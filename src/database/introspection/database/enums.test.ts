import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { env } from "process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { dropTables } from "~tests/helpers/dropTables.js";
import { type DbContext, globalPool } from "~tests/setup.js";
import { dbEnumInfo } from "./enums.js";

describe("dbEnumInfo", () => {
	beforeEach<DbContext>(async (context) => {
		const pool = globalPool();
		await pool.query("DROP DATABASE IF EXISTS test_enums");
		await pool.query("CREATE DATABASE test_enums");
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		context.kysely = new Kysely<any>({
			dialect: new PostgresDialect({
				pool: new pg.Pool({
					connectionString: `${env.POSTGRES_URL}/test_enums?schema=public`,
				}),
			}),
		});
		context.tableNames = [];
		await dropTables(context);
	});

	afterEach<DbContext>(async (context) => {
		await dropTables(context);
		await context.kysely.destroy();
		const pool = globalPool();
		await pool.query("DROP DATABASE IF EXISTS test_enums");
	});

	test<DbContext>("return kinetic enums", async ({ kysely }) => {
		await kysely.schema
			.createType("status")
			.asEnum(["failed", "success"])
			.execute();

		await kysely.schema
			.createType("role")
			.asEnum(["user", "admin", "superuser"])
			.execute();

		await kysely.schema
			.createType("not_kinetic")
			.asEnum(["failed", "success"])
			.execute();

		await sql`COMMENT ON TYPE status IS 'kinetic'`.execute(kysely);
		await sql`COMMENT ON TYPE role IS 'kinetic'`.execute(kysely);

		const result = await dbEnumInfo(kysely, "public");
		expect(result).toEqual({
			status: "Success",
			result: {
				status: "failed, success",
				role: "admin, superuser, user",
			},
		});
	});
});
