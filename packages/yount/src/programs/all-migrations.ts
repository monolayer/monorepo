import { Effect } from "effect";
import { mkdirSync } from "fs";
import { Migrator } from "../services/migrator.js";

export function allMigrations() {
	return Migrator.pipe(
		Effect.flatMap((migrator) => {
			mkdirSync(migrator.folder, { recursive: true });
			return Effect.succeed(migrator);
		}),
		Effect.flatMap((migrator) =>
			Effect.tryPromise(() => migrator.instance.getMigrations()),
		),
	);
}
