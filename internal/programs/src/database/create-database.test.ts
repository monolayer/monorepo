import { Effect } from "effect";
import { describe, expect, test } from "vitest";
import { createDatabase } from "~programs/database/create-database.js";
import { assertCurrentConnectionDatabaseName } from "~test-setup/assertions.js";
import { runProgram } from "~test-setup/run-program.js";
import type { TestProgramContext } from "~test-setup/setup.js";

describe("createDatabase", () => {
	test<TestProgramContext>(
		"should create the current environment database",
		{ retry: 3 },
		async (context) => {
			assertCurrentConnectionDatabaseName(undefined);
			await Effect.runPromise(runProgram(createDatabase, context));

			await assertCurrentConnectionDatabaseName(context.databaseName);

			expect(context.logMessages).toMatchInlineSnapshot(`
				[
				  "[?25l",
				  "│
				",
				  "[999D",
				  "[J",
				  "◇  Create database 3f868663 ✓
				",
				  "[?25h",
				]
			`);
		},
	);

	test<TestProgramContext>(
		"should be idempotent",
		{ retry: 3 },
		async (context) => {
			await Effect.runPromise(runProgram(createDatabase, context));
			await Effect.runPromise(runProgram(createDatabase, context));
			await Effect.runPromise(runProgram(createDatabase, context));

			expect(context.logMessages).toMatchInlineSnapshot(`
				[
				  "[?25l",
				  "│
				",
				  "[999D",
				  "[J",
				  "◇  Create database 47a71245 ✓
				",
				  "[?25h",
				  "[?25l",
				  "│
				",
				  "[999D",
				  "[J",
				  "◇  Create database 47a71245 ✓
				",
				  "[?25h",
				  "[?25l",
				  "│
				",
				  "[999D",
				  "[J",
				  "◇  Create database 47a71245 ✓
				",
				  "[?25h",
				]
			`);
		},
	);
});
