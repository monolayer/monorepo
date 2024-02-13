import dotenv from "dotenv";
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { env } from "process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { type DbContext, globalPool } from "~tests/setup.js";
import { dbExtensionInfo } from "./extensions.js";
dotenv.config();

describe("#dbExtensionInfo", () => {
	beforeEach<DbContext>(async (context) => {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		context.kysely = new Kysely<any>({
			dialect: new PostgresDialect({
				pool: new pg.Pool({
					connectionString: `${env.POSTGRES_URL}/db_extension_info_test?schema=public`,
				}),
			}),
		});
		await globalPool().query("CREATE DATABASE db_extension_info_test");
	});

	afterEach<DbContext>(async (context) => {
		context.kysely.destroy();
		await globalPool().query("DROP DATABASE IF EXISTS db_extension_info_test");
	});

	test<DbContext>("list installed extensions", async ({ kysely }) => {
		await sql`CREATE EXTENSION moddatetime`.execute(kysely);
		await sql`CREATE EXTENSION btree_gin`.execute(kysely);

		const result = await dbExtensionInfo(kysely, "public");
		expect(result).toStrictEqual({
			status: "Success",
			result: {
				btree_gin: true,
				moddatetime: true,
			},
		});
	});
});
