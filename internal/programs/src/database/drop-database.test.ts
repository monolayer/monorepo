import { Effect } from "effect";
import color from "picocolors";
import { describe, test } from "vitest";
import { dropDatabase } from "~programs/database/drop-database.js";
import {
	assertCurrentConnectionDatabaseName,
	expectLogMessage,
} from "~test-setup/assertions.js";
import { createTestDatabase } from "~test-setup/database.js";
import { runProgram } from "~test-setup/run-program.js";
import type { TestProgramContext } from "~test-setup/setup.js";

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
