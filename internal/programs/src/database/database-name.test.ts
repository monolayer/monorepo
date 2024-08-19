import { Effect } from "effect";
import { expect, test } from "vitest";
import { databaseName } from "~programs/database/database-name.js";
import { runProgram } from "~test-setup/run-program.js";
import type { TestProgramContext } from "~test-setup/setup.js";

test<TestProgramContext>("databaseName should return the current environment database name", async (context) => {
	expect(await Effect.runPromise(runProgram(databaseName, context))).toBe(
		"9ee562df",
	);
});
