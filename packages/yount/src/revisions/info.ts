import { FileMigrationProvider, Kysely, Migrator } from "kysely";
import fs from "node:fs/promises";
import path from "path";
import { cwd } from "process";
import { YountConfig } from "~/configuration.js";

export async function fetchPendingMigrations(
	config: YountConfig,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	db: Kysely<any>,
	migrationsFolderName = "revisions",
) {
	const migrationsFolder = path.join(
		cwd(),
		config.folder,
		migrationsFolderName,
	);

	const allMigrations = await migrations(config, db, migrationsFolderName);

	const migrationFiles = await fs.readdir(migrationsFolder);

	return allMigrations
		.filter((m) => m.executedAt === undefined)
		.map((m) => {
			const migrationFile = migrationFiles.find((f) => f.startsWith(m.name));
			return {
				name: m.name,
				path:
					migrationFile !== undefined
						? path.join(migrationsFolder, migrationFile)
						: "PATH NOT FOUND",
			};
		});
}

export async function migrations(
	config: YountConfig,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	db: Kysely<any>,
	migrationsFolderName = "revisions",
) {
	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(cwd(), config.folder, migrationsFolderName),
		}),
	});
	return await migrator.getMigrations();
}