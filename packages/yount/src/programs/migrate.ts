import * as p from "@clack/prompts";
import { Effect } from "effect";
import { Migrator } from "../services/migrator.js";
import { logMigrationResultStatus } from "./log-migration-result-status.js";
import { validateRevisionDependencies } from "./revision-dependencies.js";

export function migrate() {
	return Migrator.pipe(
		Effect.tap(() => validateRevisionDependencies()),
		Effect.flatMap((migrator) =>
			Effect.tryPromise(() => migrator.instance.migrateToLatest()),
		),
		Effect.tap(({ error, results }) =>
			Effect.if(results !== undefined && results.length > 0, {
				onTrue: Effect.forEach(results!, (result) =>
					logMigrationResultStatus(result, error, "up"),
				),
				onFalse: Effect.unit,
			}),
		),
		Effect.tap(({ results }) =>
			Effect.if(results !== undefined && results.length === 0, {
				onTrue: Effect.succeed(true).pipe(
					Effect.map(() => p.log.info("No revisions to apply.")),
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
		Effect.flatMap(({ error, results }) =>
			Effect.if(error === undefined && results !== undefined, {
				onTrue: Effect.succeed(true),
				onFalse: Effect.succeed(false),
			}),
		),
	);
}
