import { Effect } from "effect";
import { NO_MIGRATIONS } from "kysely";
import { Migrator } from "~/services/migrator.js";
import { logMigrationResultStatus } from "../programs/log-migration-result-status.js";

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
