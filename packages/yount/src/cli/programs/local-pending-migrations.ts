import { Effect } from "effect";
import { readdir } from "fs/promises";
import path from "path";
import { Environment } from "../services/environment.js";
import { allMigrations } from "./all-migrations.js";

export function localPendingMigrations() {
	return Effect.gen(function* (_) {
		const environment = yield* _(Environment);
		const migrationFolder = environment.config.migrationFolder;
		const localMigrationFiles = yield* _(
			Effect.tryPromise(async () => await readdir(migrationFolder)),
		);
		const migrations = yield* _(allMigrations());
		const filtered = migrations
			.filter((m) => m.executedAt === undefined)
			.map((m) => {
				const migrationFile = localMigrationFiles.find((f) =>
					f.startsWith(m.name),
				);
				return {
					name: m.name,
					path:
						migrationFile !== undefined
							? path.join(migrationFolder, migrationFile)
							: "PATH NOT FOUND",
				};
			});
		return filtered;
	});
}
