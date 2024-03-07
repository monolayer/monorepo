import { mkdirSync } from "fs";
import {
	FileMigrationProvider,
	Kysely,
	Migrator,
	PostgresDialect,
} from "kysely";
import fs from "node:fs/promises";
import path from "path";
import pg from "pg";
import { cwd, env } from "process";
import { type TaskContext } from "vitest";
import { globalPool, type DbContext } from "~tests/setup.js";
import { dbNameForTest } from "./db_name_for_test.js";

export async function teardownContext(context: TaskContext & DbContext) {
	try {
		await context.kysely.destroy();
	} catch (e) {
		/* empty */
	}
	await globalPool().query(`DROP DATABASE IF EXISTS ${context.dbName}`);
}

export async function setUpContext(context: TaskContext & DbContext) {
	const pool = globalPool();
	context.dbName = dbNameForTest(context);
	await pool.query(`DROP DATABASE IF EXISTS ${context.dbName}`);
	await pool.query(`CREATE DATABASE ${context.dbName}`);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	context.kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({
				connectionString: `${env.POSTGRES_URL}/${context.dbName}?schema=public`,
			}),
		}),
	});
	const dateStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
	context.folder = path.join(
		cwd(),
		`tmp/schema_migrations/${dateStr}-${context.dbName}`,
	);
	mkdirSync(path.join(context.folder, "migrations"), { recursive: true });
	context.migrator = new Migrator({
		db: context.kysely,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(context.folder, "migrations"),
		}),
	});
}
