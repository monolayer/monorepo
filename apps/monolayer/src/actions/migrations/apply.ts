/* eslint-disable complexity */
import * as p from "@clack/prompts";
import { ActionError, UnknownActionError } from "@monorepo/base/errors.js";
import { spinnerTask } from "@monorepo/cli/spinner-task.js";
import { ChangesetPhase } from "@monorepo/pg/changeset/types.js";
import { Migrator } from "@monorepo/services/migrator.js";
import { appEnvironment } from "@monorepo/state/app-environment.js";
import { Effect } from "effect";
import { execa } from "execa";
import type { MigrationResult } from "kysely";
import color from "picocolors";
import { dumpDatabaseStructureTask } from "~/actions/database/dump.js";
import { checkNoPendingMigrations } from "./pending.js";

interface ApplyExpandMigrations {
	phase: ChangesetPhase.Expand;
	migrationName?: undefined;
}

interface ApplyAlterMigrations {
	phase: ChangesetPhase.Alter;
	migrationName?: undefined;
}

interface ApplyContractMigrations {
	phase: ChangesetPhase.Contract;
	migrationName?: string;
}

interface ApplyDataMigrations {
	phase: ChangesetPhase.Data;
	migrationName?: string;
}

interface ApplyAllMigrations {
	phase: "all";
	migrationName?: undefined;
}

export function applyMigrations({
	phase,
	migrationName,
}:
	| ApplyExpandMigrations
	| ApplyAlterMigrations
	| ApplyContractMigrations
	| ApplyDataMigrations
	| ApplyAllMigrations) {
	return Effect.gen(function* () {
		const migrator = yield* Migrator;
		let noPending: boolean = true;
		let pendingPhases: ChangesetPhase[] = [];
		switch (phase) {
			case ChangesetPhase.Alter:
				[noPending, pendingPhases] = yield* checkNoPendingMigrations([
					ChangesetPhase.Expand,
				]);
				break;
			case ChangesetPhase.Data:
			case ChangesetPhase.Contract:
				[noPending, pendingPhases] = yield* checkNoPendingMigrations([
					ChangesetPhase.Expand,
					ChangesetPhase.Alter,
				]);
				break;
			default:
				break;
		}

		if (!noPending) {
			yield* Effect.fail(
				new ActionError(
					`Cannot apply ${phase} migrations`,
					pendingPhases.length > 1
						? `There are pending ${pendingPhases.join(" and ")} migrations to apply.`
						: `There are pending ${pendingPhases.join()} migrations to apply.`,
				),
			);
		}

		let migrationError: unknown;
		let migrationResults: MigrationResult[] | undefined;

		switch (phase) {
			case "all":
				({ error: migrationError, results: migrationResults } =
					yield* migrator.migrateToLatest(true));
				break;
			case ChangesetPhase.Expand:
			case ChangesetPhase.Alter:
			case ChangesetPhase.Data:
				({ error: migrationError, results: migrationResults } =
					yield* migrator.migratePhaseToLatest(phase, true));
				break;
			case ChangesetPhase.Contract:
				({ error: migrationError, results: migrationResults } =
					migrationName !== undefined
						? yield* migrator.migrateTargetUpInPhase(phase, migrationName)
						: yield* migrator.migratePhaseToLatest(phase, true));
				break;
		}

		if (migrationResults !== undefined && migrationResults.length > 0) {
			for (const result of migrationResults) {
				yield* logMigrationResultStatus(result, migrationError, "up");
			}
		}

		if (migrationResults !== undefined && migrationResults.length === 0) {
			p.log.info("No migrations to apply.");
		}
		if (migrationError !== undefined) {
			yield* Effect.fail(
				new UnknownActionError("Migration error", migrationError),
			);
		}

		const appEnv = yield* appEnvironment;
		if (
			migrationError === undefined &&
			migrationResults !== undefined &&
			migrationResults.length !== 0
		) {
			yield* dumpDatabaseStructureTask;
			if (appEnv.database.generatePrismaSchema) yield* generatePrisma;
			return true;
		} else {
			return false;
		}
	});
}

const generatePrisma = Effect.gen(function* () {
	yield* spinnerTask("Generate prisma", () =>
		Effect.gen(function* () {
			yield* Effect.tryPromise(async () =>
				execa("npx", ["prisma", "db", "pull"]),
			);
			yield* Effect.tryPromise(async () =>
				execa("npx", ["prisma", "generate"]),
			);
		}),
	);
});

export function logMigrationResultStatus(
	result: MigrationResult,
	error: unknown,
	direction: "up" | "down",
) {
	const action = direction === "up" ? "APPLIED" : "REVERTED";
	switch (result.status) {
		case "Success":
			p.log.success(
				`${color.bgGreen(color.black(` ${action} `))} ${result.migrationName}${error !== undefined ? "(ROLLBACK)" : ""}`.trimEnd(),
			);
			break;
		case "Error":
			p.log.error(
				`${color.bgRed(color.black(" ERROR "))} ${result.migrationName} (ROLLBACK)`.trimEnd(),
			);
			break;
		case "NotExecuted":
			p.log.warn(
				`${color.bgYellow(color.black(" NOT EXECUTED "))} ${result.migrationName}`,
			);
			break;
	}
	return Effect.succeed(true);
}
