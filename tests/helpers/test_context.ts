import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { env } from "process";
import { type TaskContext } from "vitest";
import { type DbContext, globalPool } from "~tests/setup.js";
import { dbNameForTest } from "./db_name_for_test.js";

export async function teardownContext(context: TaskContext & DbContext) {
	await context.kysely.destroy();
	await globalPool().query(`DROP DATABASE IF EXISTS ${dbNameForTest(context)}`);
}
export async function setUpContext(context: TaskContext & DbContext) {
	const pool = globalPool();
	const dbName = dbNameForTest(context);
	await pool.query(`DROP DATABASE IF EXISTS ${dbName}`);
	await pool.query(`CREATE DATABASE ${dbName}`);
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	context.kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({
				connectionString: `${env.POSTGRES_URL}/${dbName}?schema=public`,
			}),
		}),
	});
}
