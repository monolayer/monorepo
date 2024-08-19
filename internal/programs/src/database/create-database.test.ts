import { Effect } from "effect";
import color from "picocolors";
import { describe, test } from "vitest";
import { createDatabase } from "~programs/database/create-database.js";
import {
	assertCurrentConnectionDatabaseName,
	expectLogMessage,
} from "~test-setup/assertions.js";
import { runProgram } from "~test-setup/run-program.js";
import type { TestProgramContext } from "~test-setup/setup.js";

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
