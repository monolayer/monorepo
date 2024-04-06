import { Effect } from "effect";
import { readdir } from "fs/promises";
import type { MigrationInfo } from "kysely";
import path from "path";
import { Environment } from "../services/environment.js";
import { allMigrations } from "./all-migrations.js";

export function localPendingMigrations() {
	return Environment.pipe(
		Effect.flatMap((environment) =>
			Effect.all([
				Effect.tryPromise(() => readdir(environment.config.migrationFolder)),
				allMigrations(),
			]).pipe(
				Effect.flatMap(([localMigrationFiles, migrations]) =>
					filterMigrations(
						localMigrationFiles,
						migrations,
						environment.config.migrationFolder,
					),
				),
			),
		),
	);
}

function filterMigrations(
	localMigrationFiles: string[],
	migrations: readonly MigrationInfo[],
	migrationFolder: string,
) {
	return Effect.succeed(
		migrations
			.filter((m) => m.executedAt === undefined)
			.map((m) => {
				const migrationFile = localMigrationFiles.find((f) =>
					f.startsWith(m.name),
				);
				const migrationPath =
					migrationFile !== undefined
						? path.join(migrationFolder, migrationFile)
						: "PATH NOT FOUND";
				return {
					name: m.name,
					path: migrationPath,
				};
			}),
	);
}
