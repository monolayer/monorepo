import fs from "node:fs/promises";
import path from "node:path";
import { env } from "node:process";
import pg from "pg";

async function importKysely() {
	const kyselyImport = await import("kysely");
	return {
		Kysely: kyselyImport.Kysely,
		FileMigrationProvider: kyselyImport.FileMigrationProvider,
		Migrator: kyselyImport.Migrator,
		PostgresDialect: kyselyImport.PostgresDialect,
	};
}

export async function kyselyWithCustomDB(databaseName: string) {
	const { Kysely, PostgresDialect } = await importKysely();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({
				connectionString: `${env.POSTGRES_URL}/${databaseName}?schema=public`,
			}),
		}),
	});
}

export async function kyselyWithEmptyPool() {
	const { Kysely, PostgresDialect } = await importKysely();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
}

export async function kyselyMigrator(
	kysely: Awaited<ReturnType<typeof kyselyWithCustomDB>>,
	folder: string,
) {
	const { Migrator, FileMigrationProvider } = await importKysely();
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
	kysely: Awaited<ReturnType<typeof kyselyWithCustomDB>>;
	migrator: InstanceType<Awaited<ReturnType<typeof importKysely>>["Migrator"]>;
	tableNames: string[];
	dbName: string;
	folder: string;
}
