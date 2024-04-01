import { mkdirSync, rmSync } from "fs";
import path from "path";
import { cwd } from "process";
import { type TaskContext } from "vitest";
import { globalPool } from "~tests/setup.js";
import {
	kyselyMigrator,
	kyselyWithCustomDB,
	type DbContext,
} from "~tests/setup/kysely.js";
import { dbNameForTest } from "./db-name-for-test.js";

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
	await pool.query(`DROP DATABASE IF EXISTS ${context.dbName}`);
	await pool.query(`CREATE DATABASE ${context.dbName}`);
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