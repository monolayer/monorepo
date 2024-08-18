import { Effect } from "effect";
import { describe, expect, test } from "vitest";
import { createDatabase } from "~programs/__test_setup__/database.js";
import { runProgram } from "~programs/__test_setup__/run-program.js";
import type { TestProgramContext } from "~programs/__test_setup__/setup.js";
import { databaseExists } from "~programs/database-exists.js";

describe("databaseExists", () => {
	test<TestProgramContext>("should return false without a current environment database", async (context) => {
		expect(await Effect.runPromise(runProgram(databaseExists, context))).toBe(
			false,
		);
	});

	test<TestProgramContext>("should return true with a current environment database", async (context) => {
		await createDatabase(context.databaseName);

		expect(await Effect.runPromise(runProgram(databaseExists, context))).toBe(
			true,
		);
	});
});
