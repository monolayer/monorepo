import { Effect } from "effect";
import color from "picocolors";
import { describe, test } from "vitest";
import {
	assertCurrentConnectionDatabaseName,
	expectLogMessage,
} from "~programs/__test_setup__/assertions.js";
import { createTestDatabase } from "~programs/__test_setup__/database.js";
import { runProgram } from "~programs/__test_setup__/run-program.js";
import type { TestProgramContext } from "~programs/__test_setup__/setup.js";
import { dropDatabase } from "~programs/database/drop-database.js";

describe("dropDatabase", () => {
	test<TestProgramContext>("should drop the current environment database", async (context) => {
		await createTestDatabase(context);

		await Effect.runPromise(runProgram(dropDatabase, context));

		assertCurrentConnectionDatabaseName(undefined);

		expectLogMessage({
			expected: `Drop database ${context.databaseName} ${color.green("✓")}`,
			messages: context.logMessages,
			count: 1,
		});
	});

	test<TestProgramContext>("should be idempotent", async (context) => {
		await createTestDatabase(context);

		await Effect.runPromise(runProgram(dropDatabase, context));
		await Effect.runPromise(runProgram(dropDatabase, context));
		await Effect.runPromise(runProgram(dropDatabase, context));

		assertCurrentConnectionDatabaseName(undefined);

		expectLogMessage({
			expected: `Drop database ${context.databaseName} ${color.green("✓")}`,
			messages: context.logMessages,
			count: 3,
		});
	});
});
