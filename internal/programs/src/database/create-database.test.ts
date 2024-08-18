import { Effect } from "effect";
import color from "picocolors";
import { describe, test } from "vitest";
import {
	assertCurrentConnectionDatabaseName,
	expectLogMessage,
} from "~programs/__test_setup__/assertions.js";
import { runProgram } from "~programs/__test_setup__/run-program.js";
import type { TestProgramContext } from "~programs/__test_setup__/setup.js";
import { createDatabase } from "~programs/database/create-database.js";

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
});
