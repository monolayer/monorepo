import { Effect } from "effect";
import { Migrator } from "../services/migrator.js";

export function allMigrations() {
	return Migrator.pipe(
		Effect.flatMap((migrator) =>
			Effect.tryPromise(() => migrator.instance.getMigrations()),
		),
	);
}
