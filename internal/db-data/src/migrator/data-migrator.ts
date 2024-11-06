import { DbClients } from "@monorepo/services/db-clients.js";
import { currentDatabaseId } from "@monorepo/state/app-environment.js";
import { kebabCase, snakeCase } from "case-anything";
import { gen } from "effect/Effect";
import fs from "fs/promises";
import { FileMigrationProvider, Kysely } from "kysely";
import path from "node:path";
import { databaseDestinationFolder } from "~db-data/programs/destination-folder.js";
import { Migrator } from "./migrator.js";

export const DEFAULT_ALLOW_UNORDERED_MIGRATIONS = false;
export const MIGRATION_LOCK_ID = "migration_lock";

export class DataMigrator extends Migrator {
	constructor(options: { db: Kysely<any>; name: string; folder: string }) {
		if (path.extname(options.folder) !== "") {
			throw new Error(`Not a folder: ${options.folder}`);
		}
		super({
			migrationTableName: snakeCase(`monolayer_${options.name}`),
			migrationLockTableName: snakeCase(`monolayer_${options.name}_lock`),
			migrationTableSchema: "public",
			db: options.db,
			provider: new FileMigrationProvider({
				fs,
				path,
				migrationFolder: options.folder,
			}),
			allowUnorderedMigrations: true,
		});
	}

	async down(targetMigrationName?: string) {
		if (targetMigrationName) {
			return await this.runMigration(targetMigrationName, "Down");
		} else {
			return await this.migrateDown();
		}
	}

	async up(targetMigrationName?: string) {
		if (targetMigrationName) {
			return await this.runMigration(targetMigrationName, "Up");
		} else {
			return await this.migrateUp();
		}
	}

	async status() {
		return await this.getMigrations();
	}
}

export const dataMigrator = gen(function* () {
	return new DataMigrator({
		db: (yield* DbClients).kyselyNoCamelCase,
		folder: yield* databaseDestinationFolder("data"),
		name: kebabCase(
			`${yield* currentDatabaseId}-${path.basename(yield* databaseDestinationFolder("data"))}`,
		),
	});
});
