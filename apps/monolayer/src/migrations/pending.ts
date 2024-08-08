import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { Effect } from "effect";
import { unlinkSync } from "fs";
import path from "path";
import color from "picocolors";
import { cwd } from "process";
import { ChangesetPhase } from "../changeset/types.js";
import { cancelOperation } from "../cli/cancel-operation.js";
import { Migrator } from "../services/migrator.js";

export const pendingMigrations = Effect.gen(function* () {
	const pendingMigrations = yield* localPendingSchemaMigrations;
	if (pendingMigrations.length > 0) {
		yield* Effect.forEach(pendingMigrations, (pendingMigration) => {
			p.log.message(
				`${color.bgYellow(color.black(" PENDING "))} ${path.basename(pendingMigration.path, ".ts")} (${pendingMigration.phase})`,
			);
			return Effect.void;
		});
	} else {
		p.log.message("No pending migrations.");
	}
	return pendingMigrations;
});

export const handlePendingSchemaMigrations = Effect.gen(function* () {
	const localPending = yield* localPendingSchemaMigrations;
	if (localPending.length == 0) return true;

	yield* logPendingMigrations(localPending);

	if (yield* askConfirmationDelete) {
		yield* deletePendingMigrations(localPending);
	} else {
		yield* cancelOperation();
	}
});

function logPendingMigrations(
	pending: {
		name: string;
		path: string;
		phase: ChangesetPhase;
	}[],
) {
	return Effect.gen(function* () {
		for (const migration of pending) {
			p.log.warn(
				`${color.bgYellow(color.black(" PENDING "))} ${path.relative(cwd(), migration.path)} (${migration.phase})`,
			);
		}
		yield* Effect.succeed(true);
	});
}

const askConfirmationDelete = Effect.gen(function* () {
	const promptConfirm = yield* Effect.tryPromise(() =>
		confirm({
			initialValue: false,
			message: `You have pending schema migrations to apply and ${color.bold(
				"we need to delete them to continue",
			)}. Do you want to proceed?`,
		}),
	);
	return promptConfirm === true;
});

interface PendingMigration {
	name: string;
	path: string;
}

export function deletePendingMigrations(pendingMigrations: PendingMigration[]) {
	return Effect.gen(function* () {
		for (const migration of pendingMigrations) {
			unlinkSync(migration.path);
		}
		return yield* Effect.succeed(true);
	});
}

export function checkNoPendingMigrations(phases: ChangesetPhase[]) {
	return Effect.gen(function* () {
		let noPending = true;
		const pendingPhases: ChangesetPhase[] = [];
		const pendingByPhase = yield* localPendingSchemaMigrationsByPhase;
		for (const phase of phases) {
			if (pendingByPhase[phase].length !== 0) {
				noPending = false;
				pendingPhases.push(phase);
				yield* logPendingMigrations(pendingByPhase[phase]);
			}
		}
		return [noPending, pendingPhases] as [boolean, ChangesetPhase[]];
	});
}

export const localPendingSchemaMigrations = Effect.gen(function* () {
	const migrator = yield* Migrator;
	const stats = yield* migrator.migrationStats;
	return stats.localPending;
});

const localPendingSchemaMigrationsByPhase = Effect.gen(function* () {
	const localPending = yield* localPendingSchemaMigrations;
	const initial: Record<
		ChangesetPhase,
		{
			name: string;
			path: string;
			phase: ChangesetPhase;
		}[]
	> = {
		[`${ChangesetPhase.Expand}`]: [],
		[`${ChangesetPhase.Alter}`]: [],
		[`${ChangesetPhase.Contract}`]: [],
		[`${ChangesetPhase.Data}`]: [],
	};
	return localPending.reduce((acc, pending) => {
		acc[pending.phase].push(pending);
		return acc;
	}, initial);
});
