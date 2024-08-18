import { Effect } from "effect";
import { rmdirSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { createTestDatabase } from "~programs/__test_setup__/database.js";
import { migrationFolder } from "~programs/__test_setup__/program_context.js";
import { runProgram } from "~programs/__test_setup__/run-program.js";
import type { TestProgramContext } from "~programs/__test_setup__/setup.js";
import { localPendingSchemaMigrations } from "~programs/migrations/local-pending.js";

describe("localPendingSchemaMigrations", () => {
	test<TestProgramContext>("should list the pending migrations", async (context) => {
		await createTestDatabase(context);

		const result = await Effect.runPromise(
			runProgram(localPendingSchemaMigrations, context),
		);

		expect(result.map((migration) => migration.name)).toStrictEqual([
			"20240405T120024-regulus-mint",
			"20240405T120250-canopus-teal",
			"20240405T153857-alphard-black",
			"20240405T154913-mirfak-mustard",
		]);

		rmdirSync(migrationFolder(context), { recursive: true });

		expect(
			await Effect.runPromise(
				runProgram(localPendingSchemaMigrations, context),
			),
		).toStrictEqual([]);
	});

	test<TestProgramContext>("should return an empty array without pending migrations", async (context) => {
		await createTestDatabase(context);

		rmdirSync(migrationFolder(context), { recursive: true });

		expect(
			await Effect.runPromise(
				runProgram(localPendingSchemaMigrations, context),
			),
		).toStrictEqual([]);
	});
});
