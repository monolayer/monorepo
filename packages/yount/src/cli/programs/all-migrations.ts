import { Effect } from "effect";
import { mkdirSync } from "fs";
import { Environment } from "../services/environment.js";
import { Migrator } from "../services/migrator.js";

export function allMigrations() {
	return Effect.all([Environment, Migrator]).pipe(
		Effect.flatMap(([environment, migrator]) => {
			mkdirSync(environment.migrationFolder, { recursive: true });
			return Effect.succeed(migrator);
		}),
		Effect.flatMap((migrator) =>
			Effect.tryPromise(() => migrator.instance.getMigrations()),
		),
	);
}
