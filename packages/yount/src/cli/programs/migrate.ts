import * as p from "@clack/prompts";
import { Effect } from "effect";
import type { MigrationResult } from "kysely";
import color from "picocolors";
import { Migrator } from "../services/migrator.js";

export function migrate() {
	return Migrator.pipe(
		Effect.flatMap((migrator) =>
			Effect.tryPromise(() => migrator.instance.migrateToLatest()),
		),
		Effect.tap(({ error, results }) =>
			Effect.if(results !== undefined && results.length > 0, {
				onTrue: Effect.forEach(results!, (result) =>
					logResultStatus(result, error),
				),
				onFalse: Effect.unit,
			}),
		),
		Effect.tap(({ results }) =>
			Effect.if(results !== undefined && results.length === 0, {
				onTrue: Effect.succeed(true).pipe(
					Effect.map(() => p.log.info("No migrations to apply.")),
				),
				onFalse: Effect.unit,
			}),
		),
		Effect.tap(({ error }) =>
			Effect.if(error !== undefined, {
				onTrue: Effect.fail(error),
				onFalse: Effect.succeed(true),
			}),
		),
		Effect.flatMap(({ results }) =>
			Effect.if(results !== undefined && results.length > 0, {
				onTrue: Effect.succeed(true),
				onFalse: Effect.succeed(false),
			}),
		),
	);
}

function logResultStatus(result: MigrationResult, error: unknown) {
	switch (result.status) {
		case "Success":
			if (error !== undefined) {
				p.log.info(
					`${color.green("Applied")} ${result.migrationName} (ROLLBACK)`,
				);
			} else {
				p.log.info(`${color.green("Applied")} ${result.migrationName}`);
			}
			break;
		case "Error":
			p.log.error(`${color.red("Error")} ${result.migrationName} (ROLLBACK)`);
			break;
		case "NotExecuted":
			p.log.warn(`${color.yellow("Not executed")} ${result.migrationName}`);
			break;
	}
	return Effect.succeed(true);
}
