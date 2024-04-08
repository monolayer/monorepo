import { appendFileSync, copyFileSync, mkdirSync, rmSync } from "fs";
import { FileMigrationProvider, Migrator, type Kysely } from "kysely";
import fs from "node:fs/promises";
import path from "path";
import type { Pool } from "pg";
import { chdir, cwd } from "process";
import { type TaskContext } from "vitest";
import {
	connectionsTemplate,
	yountConfigTemplate,
} from "~tests/fixtures/program.js";
import { globalPool, globalPoolTwo } from "~tests/setup.js";
import {
	kyselyMigrator,
	kyselyWithCustomDB,
	type DbContext,
} from "~tests/setup/kysely.js";
import { dbNameForTest, programFolder } from "./names.js";

export async function teardownContext(context: TaskContext & DbContext) {
	try {
		await context.kysely.destroy();
		rmSync(context.folder, { recursive: true, force: true });
	} catch (e) {
		/* empty */
	}
	await globalPool().query(`DROP DATABASE IF EXISTS ${context.dbName}`);
}

export async function setUpContext(context: TaskContext & DbContext) {
	const pool = globalPool();
	context.dbName = dbNameForTest(context);
	await pool.query(`DROP DATABASE IF EXISTS "${context.dbName}"`);
	await pool.query(`CREATE DATABASE "${context.dbName}"`);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	context.kysely = await kyselyWithCustomDB(context.dbName);
	const dateStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
	context.folder = path.join(
		cwd(),
		`tmp/schema_migrations/${dateStr}-${context.dbName}`,
	);
	mkdirSync(path.join(context.folder, "migrations"), { recursive: true });
	context.migrator = await kyselyMigrator(context.kysely, context.folder);
}

export async function setupProgramContext(
	context: TaskContext & ProgramContext,
	createDb = true,
) {
	context.currentWorkingDirectory = cwd();
	context.folder = path.join(cwd(), `tmp/programs/${programFolder(context)}`);
	rmSync(context.folder, { recursive: true, force: true });
	mkdirSync(path.join(context.folder, "db", "migrations", "default"), {
		recursive: true,
	});
	context.pool = globalPool();
	context.poolTwo = globalPoolTwo();
	context.dbName = dbNameForTest(context);
	await context.pool.query(`DROP DATABASE IF EXISTS "${context.dbName}"`);
	await context.poolTwo.query(
		`DROP DATABASE IF EXISTS "${context.dbName}_test"`,
	);
	await context.pool.query(`DROP DATABASE IF EXISTS "${context.dbName}_stats"`);
	await context.poolTwo.query(
		`DROP DATABASE IF EXISTS "${context.dbName}_stats_test"`,
	);
	if (createDb) {
		await context.pool.query(`CREATE DATABASE "${context.dbName}"`);
		await context.poolTwo.query(`CREATE DATABASE "${context.dbName}_test"`);
		await context.pool.query(`CREATE DATABASE "${context.dbName}_stats"`);
		await context.poolTwo.query(
			`CREATE DATABASE "${context.dbName}_stats_test"`,
		);
	}

	const dbMigrator = await dbAndMigrator(context);
	context.kysely = dbMigrator.db;
	context.migrator = dbMigrator.migrator;
	const yountConfig = yountConfigTemplate.render();
	appendFileSync(path.join(context.folder, "yount.config.ts"), yountConfig);

	const connectionsConfig = connectionsTemplate.render({
		dbName: context.dbName,
	});
	appendFileSync(
		path.join(context.folder, "db", "connections.ts"),
		connectionsConfig,
	);

	copyMigrations(
		[
			"20240405T120024-regulus-mint",
			"20240405T120250-canopus-teal",
			"20240405T153857-alphard-black",
			"20240405T154913-mirfak-mustard",
		],
		context,
	);
	chdir(context.folder);
}

export async function teardownProgramContext(
	context: TaskContext & ProgramContext,
) {
	rmSync(context.folder, { recursive: true, force: true });
	try {
		await context.kysely.destroy();
	} catch (e) {
		/* empty */
	}
	chdir(context.currentWorkingDirectory);
}

export type ProgramContext = {
	folder: string;
	pool: Pool;
	poolTwo: Pool;
	dbName: string;
	currentWorkingDirectory: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>;
	migrator: Migrator;
};

function copyMigration(migrationName: string, context: ProgramContext) {
	copyFileSync(
		`tests/fixtures/migrations/${migrationName}.ts`,
		path.join(
			context.folder,
			"db",
			"migrations",
			"default",
			`${migrationName}.ts`,
		),
	);
}

export function copyMigrations(migrations: string[], context: ProgramContext) {
	migrations.forEach((migration) => {
		copyMigration(migration, context);
	});
}

export async function dbAndMigrator(context: ProgramContext) {
	return {
		db: await kyselyWithCustomDB(context.dbName),
		migrator: new Migrator({
			db: await kyselyWithCustomDB(context.dbName),
			provider: new FileMigrationProvider({
				fs,
				path,
				migrationFolder: path.join(
					context.folder,
					"db",
					"migrations",
					"default",
				),
			}),
		}),
	};
}
