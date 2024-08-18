import { pgAdminPool } from "~programs/__test_setup__/pool.js";

export async function createDatabase(databaseName: string) {
	const pool = pgAdminPool();
	await pool.query(`CREATE DATABASE "${databaseName}"`);
}

export async function dropDatabase(databaseName: string) {
	const pool = pgAdminPool();
	await pool.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
}

export function setDefaultDatabaseURL(databaseName: string) {
	const databaseURL = `postgresql://postgres:postgres@localhost:5440/${databaseName}`;
	process.env.MONO_PG_DEFAULT_DATABASE_URL = databaseURL;
}
