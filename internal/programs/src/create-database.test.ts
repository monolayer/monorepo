import { Effect } from "effect";
import color from "picocolors";
import { describe, expect, test } from "vitest";
import { pgAdminPool } from "~programs/__test_setup__/pool.js";
import { runProgram } from "~programs/__test_setup__/run-program.js";
import type { TestProgramContext } from "~programs/__test_setup__/setup.js";
import { createDatabase } from "~programs/create-database.js";

describe("createDatabase", () => {
	test<TestProgramContext>("should create the current environment database", async (context) => {
		assertCurrentConnectionDatabaseName(undefined);
		await Effect.runPromise(runProgram(createDatabase, context));

		await assertCurrentConnectionDatabaseName(context.databaseName);

		expectLogMessage({
			expected: `Create database ${context.databaseName} ${color.green("✓")}`,
			messages: context.logMessages,
			count: 1,
		});
	});

	test<TestProgramContext>("should be idempotent", async (context) => {
		await Effect.runPromise(runProgram(createDatabase, context));
		await Effect.runPromise(runProgram(createDatabase, context));
		await Effect.runPromise(runProgram(createDatabase, context));

		expectLogMessage({
			expected: `Create database ${context.databaseName} ${color.green("✓")}`,
			messages: context.logMessages,
			count: 3,
		});
	});

	async function assertCurrentConnectionDatabaseName(expected?: string) {
		const assertion = expect(
			(await pgAdminPool().query("SELECT datname FROM pg_database;")).rows.find(
				(row) => row.datname === expected,
			),
		);
		if (expected === undefined) {
			assertion.toBeUndefined();
			return;
		} else {
			assertion.toEqual({ datname: expected });
		}
	}

	function expectLogMessage({
		messages,
		expected,
		count,
	}: {
		messages: string[];
		expected: string;
		count: number;
	}) {
		return expect(
			messages.filter((message) => message.includes(expected)).length,
		).toBe(count);
	}
});
