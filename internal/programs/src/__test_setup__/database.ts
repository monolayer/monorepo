import { pgAdminPool } from "~programs/__test_setup__/pool.js";
import type { TestProgramContext } from "~programs/__test_setup__/setup.js";

export async function createTestDatabase(context: TestProgramContext) {
	const pool = pgAdminPool();
	await pool.query(`CREATE DATABASE "${context.databaseName}"`);
}

export async function dropTestDatabase(context: TestProgramContext) {
	const pool = pgAdminPool();
	await pool.query(`DROP DATABASE IF EXISTS "${context.databaseName}"`);
}

export function setDefaultDatabaseURL(databaseName: string) {
	const databaseURL = `postgresql://postgres:postgres@localhost:5440/${databaseName}`;
	process.env.MONO_PG_DEFAULT_DATABASE_URL = databaseURL;
}
