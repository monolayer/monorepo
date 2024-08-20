import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { cancelOperation } from "@monorepo/cli/cancel-operation.js";
import {
	Migrator,
	type PendingMigration,
} from "@monorepo/services/migrator.js";
import { Effect } from "effect";
import { flatMap, forEach, succeed, tap } from "effect/Effect";
import { unlinkSync } from "fs";
import path from "node:path";
import { cwd } from "node:process";
import color from "picocolors";

export const handlePendingSchemaMigrations = Effect.gen(function* () {
	const localPending = yield* pendingMigrations;
	if (localPending.length == 0) return true;

	yield* logPendingMigrations;

	if (yield* askConfirmationDelete) {
		yield* deletePendingMigrations(localPending);
	} else {
		yield* cancelOperation();
	}
});

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

export function deletePendingMigrations(
	pendingMigrations: Omit<PendingMigration, "phase">[],
) {
	return Effect.gen(function* () {
		for (const migration of pendingMigrations) {
			unlinkSync(migration.path);
		}
		return yield* Effect.succeed(true);
	});
}

export const pendingMigrations = Migrator.pipe(
	flatMap((migrator) => migrator.migrationStats),
	flatMap((stats) => succeed(stats.localPending)),
);

export const logPendingMigrations = pendingMigrations.pipe(
	tap((pending) =>
		Effect.if(pending.length > 0, {
			onTrue: () => forEach(pending, logPending),
			onFalse: () => Effect.succeed(p.log.message("No pending migrations.")),
		}),
	),
);

const logPending = (pending: PendingMigration) =>
	Effect.succeed(
		p.log.warn(
			`${color.bgYellow(color.black(" PENDING "))} ${path.relative(cwd(), pending.path)} (${pending.phase})`,
		),
	);
