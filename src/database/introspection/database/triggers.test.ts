import dotenv from "dotenv";
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { env } from "process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { type DbContext, globalPool } from "~tests/setup.js";
import { dbTriggerInfo } from "./triggers.js";
dotenv.config();

describe("dbTriggerInfo", () => {
	beforeEach<DbContext>(async (context) => {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		context.kysely = new Kysely<any>({
			dialect: new PostgresDialect({
				pool: new pg.Pool({
					connectionString: `${env.POSTGRES_URL}/db_trigger_info_test?schema=public`,
				}),
			}),
		});
		await globalPool().query("CREATE DATABASE db_trigger_info_test");
		await sql`CREATE EXTENSION moddatetime`.execute(context.kysely);
		await context.kysely.schema
			.createTable("trigger_test_1")
			.addColumn("id", "serial")
			.addColumn("updated_at", "timestamp", (col) =>
				col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
			)
			.execute();
		await context.kysely.schema
			.createTable("trigger_test_2")
			.addColumn("id", "serial")
			.addColumn("updated_at", "timestamp", (col) =>
				col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
			)
			.execute();
	});

	afterEach<DbContext>(async (context) => {
		context.kysely.destroy();
		await globalPool().query("DROP DATABASE IF EXISTS db_trigger_info_test");
	});

	test<DbContext>("returns trigger info", async ({ kysely }) => {
		await sql`
      CREATE TRIGGER updated_at_trigger_test_1_trg
        BEFORE UPDATE ON trigger_test_1
        FOR EACH ROW
        EXECUTE PROCEDURE moddatetime (updated_at);
    `.execute(kysely);

		await sql`
      CREATE TRIGGER updated_at_trigger_test_2_trg
        BEFORE UPDATE ON trigger_test_2
        FOR EACH ROW
        EXECUTE PROCEDURE moddatetime (updated_at);
    `.execute(kysely);

		await sql`
      COMMENT ON TRIGGER updated_at_trigger_test_1_trg ON trigger_test_1 IS '1234';
      COMMENT ON TRIGGER updated_at_trigger_test_2_trg ON trigger_test_2 IS 'abcd';
    `.execute(kysely);

		const indexInfo = await dbTriggerInfo(kysely, "public", [
			"trigger_test_1",
			"trigger_test_2",
		]);

		const expected = {
			status: "Success",
			result: {
				trigger_test_1: {
					updated_at_trigger_test_1_trg:
						"1234:CREATE TRIGGER updated_at_trigger_test_1_trg BEFORE UPDATE ON public.trigger_test_1 FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at')",
				},
				trigger_test_2: {
					updated_at_trigger_test_2_trg:
						"abcd:CREATE TRIGGER updated_at_trigger_test_2_trg BEFORE UPDATE ON public.trigger_test_2 FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at')",
				},
			},
		};
		expect(indexInfo).toStrictEqual(expected);
	});
});
