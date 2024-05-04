import * as p from "@clack/prompts";
import { Effect } from "effect";
import type { MigrationResult } from "kysely";
import { NO_MIGRATIONS } from "kysely";
import color from "picocolors";
import { dumpDatabase } from "../database/dump.js";
import { Migrator } from "../services/migrator.js";
import { validateMigrationDependencies } from "./validate.js";

export function applyMigrations() {
	return Effect.gen(function* () {
		const result = yield* migrate();
		if (result) {
			yield* dumpDatabase();
		}
		return result;
	});
}

export function migrate() {
	return Migrator.pipe(
		Effect.tap(() => validateMigrationDependencies()),
		Effect.flatMap((migrator) =>
			Effect.tryPromise(() => migrator.instance.migrateToLatest()),
		),
		Effect.tap(({ error, results }) =>
			Effect.if(results !== undefined && results.length > 0, {
				onTrue: () =>
					Effect.forEach(results!, (result) =>
						logMigrationResultStatus(result, error, "up"),
					),
				onFalse: () => Effect.void,
			}),
		),
		Effect.tap(({ results }) =>
			Effect.if(results !== undefined && results.length === 0, {
				onTrue: () =>
					Effect.succeed(true).pipe(
						Effect.map(() => p.log.info("No migrations to apply.")),
					),
				onFalse: () => Effect.void,
			}),
		),
		Effect.tap(({ error }) =>
			Effect.if(error !== undefined, {
				onTrue: () => Effect.fail(error),
				onFalse: () => Effect.succeed(true),
			}),
		),
		Effect.flatMap(({ error, results }) =>
			Effect.if(error === undefined && results !== undefined, {
				onTrue: () => Effect.succeed(true),
				onFalse: () => Effect.succeed(false),
			}),
		),
	);
}

export function migrateTo(downTo: string | typeof NO_MIGRATIONS) {
	return Migrator.pipe(
		Effect.flatMap((migrator) =>
			Effect.tryPromise(() => migrator.instance.migrateTo(downTo)),
		),
		Effect.tap(({ error, results }) =>
			Effect.if(!(results !== undefined && results.length > 0), {
				onTrue: () =>
					Effect.forEach(results!, (result) =>
						logMigrationResultStatus(result, error, "down"),
					),
				onFalse: () => Effect.void,
			}),
		),
		Effect.flatMap(({ results }) =>
			Effect.succeed(results !== undefined && results.length > 0),
		),
	);
}

function logMigrationResultStatus(
	result: MigrationResult,
	error: unknown,
	direction: "up" | "down",
) {
	const action = direction === "up" ? "applied" : "reverted";
	switch (result.status) {
		case "Success":
			p.log.success(
				`${color.green(`${action} migration`)} ${result.migrationName}${error !== undefined ? "(ROLLBACK)" : ""}`.trimEnd(),
			);
			break;
		case "Error":
			p.log.error(
				`${color.red("error in migration")} ${result.migrationName} (ROLLBACK)`.trimEnd(),
			);
			break;
		case "NotExecuted":
			p.log.warn(`${color.yellow("not executed")} ${result.migrationName}`);
			break;
	}
	return Effect.succeed(true);
}
