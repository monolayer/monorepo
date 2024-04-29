import { Effect } from "effect";
import { mkdirSync } from "fs";
import { Migrator, type MigratorAttributes } from "../services/migrator.js";

export function allRevisions() {
	return Migrator.pipe(
		Effect.tap(createMigrationFolder),
		Effect.flatMap(getMigrations),
	);
}

function createMigrationFolder(migrator: MigratorAttributes) {
	mkdirSync(migrator.folder, { recursive: true });
}

function getMigrations(migrator: MigratorAttributes) {
	return Effect.tryPromise(() => migrator.instance.getMigrations());
}
