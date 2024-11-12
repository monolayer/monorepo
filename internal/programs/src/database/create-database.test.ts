import { Effect } from "effect";
import { describe, expect, test } from "vitest";
import { createDatabase } from "~programs/database/create-database.js";
import { assertCurrentConnectionDatabaseName } from "~test-setup/assertions.js";
import { pgAdminPool, pgPool } from "~test-setup/pool.js";
import { runProgram } from "~test-setup/run-program.js";
import type { TestProgramContext } from "~test-setup/setup.js";

describe("createDatabase", () => {
	test<TestProgramContext>("should create the current environment database", async (context) => {
		assertCurrentConnectionDatabaseName(undefined);
		await Effect.runPromise(runProgram(createDatabase, context));

		await assertCurrentConnectionDatabaseName(context.databaseName);
	});

	test<TestProgramContext>("should be idempotent", async (context) => {
		await pgAdminPool().query(
			`DROP DATABASE IF EXISTS "${context.databaseName}"`,
		);
		await Effect.runPromise(runProgram(createDatabase, context));
		await assertCurrentConnectionDatabaseName(context.databaseName);

		const pg = pgPool(context.databaseName);
		await pg.query("CREATE TABLE users()");

		await Effect.runPromise(runProgram(createDatabase, context));

		const result = await pgAdminPool().query(
			"SELECT table_name FROM information_schema.tables WHERE information_schema.tables.table_name = 'users'",
		);
		expect(result.rows).toStrictEqual([{ table_name: "users" }]);
		await assertCurrentConnectionDatabaseName(context.databaseName);
	});
});
