import { Effect } from "effect";
import { describe, expect, test } from "vitest";
import { dropDatabase } from "~programs/database/drop-database.js";
import { assertCurrentConnectionDatabaseName } from "~test-setup/assertions.js";
import { createTestDatabase } from "~test-setup/database.js";
import { runProgram } from "~test-setup/run-program.js";
import type { TestProgramContext } from "~test-setup/setup.js";

describe("dropDatabase", () => {
	test<TestProgramContext>(
		"should drop the current environment database",
		{ retry: 6 },
		async (context) => {
			await createTestDatabase(context);

			await Effect.runPromise(runProgram(dropDatabase, context));

			assertCurrentConnectionDatabaseName(undefined);

			expect(context.logMessages).toMatchInlineSnapshot(`[]`);
		},
	);

	test<TestProgramContext>(
		"should be idempotent",
		{ retry: 6 },
		async (context) => {
			await createTestDatabase(context);

			await Effect.runPromise(runProgram(dropDatabase, context));
			await Effect.runPromise(runProgram(dropDatabase, context));
			await Effect.runPromise(runProgram(dropDatabase, context));

			assertCurrentConnectionDatabaseName(undefined);

			expect(context.logMessages).toMatchInlineSnapshot(`[]`);
		},
	);
});
