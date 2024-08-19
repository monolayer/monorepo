import { Effect } from "effect";
import { describe, expect, test } from "vitest";
import { databaseExists } from "~programs/database/database-exists.js";
import { createTestDatabase } from "~test-setup/database.js";
import { runProgram } from "~test-setup/run-program.js";
import type { TestProgramContext } from "~test-setup/setup.js";

describe("databaseExists", () => {
	test<TestProgramContext>("should return false without a current environment database", async (context) => {
		expect(await Effect.runPromise(runProgram(databaseExists, context))).toBe(
			false,
		);
	});

	test<TestProgramContext>("should return true with a current environment database", async (context) => {
		await createTestDatabase(context);

		expect(await Effect.runPromise(runProgram(databaseExists, context))).toBe(
			true,
		);
	});
});
