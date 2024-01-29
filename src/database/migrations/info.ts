import fs from "node:fs/promises";
import path from "path";
import * as p from "@clack/prompts";
import { FileMigrationProvider, Kysely, Migrator } from "kysely";
import { cwd, exit } from "process";
import { ActionStatus, throwableOperation } from "~/cli/command.js";
import { Config } from "~/config.js";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function fetchPendingMigrations(config: Config, db: Kysely<any>) {
	const migrationsFolder = path.join(cwd(), config.folder, "migrations");
	const allMigrations = await migrations(config, db);
	if (allMigrations.status === ActionStatus.Error) {
		p.cancel("Unexpected error while fetching migrations.");
		console.error(allMigrations.error);
		exit(1);
	}

	const migrationFiles = await throwableOperation<
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		(...args: any) => Promise<string[]>
	>(async () => {
		const results = await fs.readdir(migrationsFolder);
		return results;
	});

	if (migrationFiles.status === ActionStatus.Error) {
		p.cancel("Unexpected error while reading migrations folder.");
		console.error(migrationFiles.error);
		exit(1);
	}

	return allMigrations.result
		.filter((m) => m.executedAt === undefined)
		.map((m) => {
			const migrationFile = migrationFiles.result.find((f) =>
				f.startsWith(m.name),
			);
			return {
				name: m.name,
				path:
					migrationFile !== undefined
						? path.join(migrationsFolder, migrationFile)
						: "PATH NOT FOUND",
			};
		});
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function migrations(config: Config, db: Kysely<any>) {
	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(cwd(), config.folder, "migrations"),
		}),
	});
	return await throwableOperation<typeof migrator.getMigrations>(async () => {
		return await migrator.getMigrations();
	});
}
