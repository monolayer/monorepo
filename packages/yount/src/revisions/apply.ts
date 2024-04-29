import * as p from "@clack/prompts";
import { Effect } from "effect";
import { NO_MIGRATIONS } from "kysely";
import { dumpDatabase } from "../database/dump.js";
import { logMigrationResultStatus } from "../programs/log-migration-result-status.js";
import { Migrator } from "../services/migrator.js";
import { validateRevisionDependencies } from "./validate.js";

export function applyRevisions() {
	return Effect.gen(function* (_) {
		const result = yield* _(migrate());
		if (result) {
			yield* _(dumpDatabase());
		}
		return result;
	});
}

export function migrate() {
	return Migrator.pipe(
		Effect.tap(() => validateRevisionDependencies()),
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
						Effect.map(() => p.log.info("No revisions to apply.")),
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
