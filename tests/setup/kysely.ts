import {
	FileMigrationProvider,
	Kysely,
	Migrator,
	PostgresDialect,
} from "kysely";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "node:process";
import pg from "pg";

export function kyselyWithCustomDB(databaseName: string) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({
				connectionString: `${env.POSTGRES_URL}/${databaseName}?schema=public`,
			}),
		}),
	});
}

export function kyselyWithEmptyPool() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function kyselyMigrator(kysely: Kysely<any>, folder: string) {
	return new Migrator({
		db: kysely,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(folder, "migrations"),
		}),
	});
}
export interface DbContext {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>;
	migrator: Migrator;
	tableNames: string[];
	dbName: string;
	folder: string;
}
