import { Effect } from "effect";
import { rmdirSync } from "node:fs";
import fs from "node:fs/promises";
import { beforeEach, describe, expect, test } from "vitest";
import {
	logPendingMigrations,
	pendingMigrations,
} from "~programs/migrations/pending.js";
import { createTestDatabase } from "~test-setup/database.js";
import { migrationFolder } from "~test-setup/program_context.js";
import { runProgram } from "~test-setup/run-program.js";
import type { TestProgramContext } from "~test-setup/setup.js";

beforeEach<TestProgramContext>(async (context) => {
	await createTestDatabase(context);
});

describe("localPendingSchemaMigrations", () => {
	test<TestProgramContext>("should list the pending migrations", async (context) => {
		const result = await Effect.runPromise(
			runProgram(pendingMigrations, context),
		);

		expect(result.map((migration) => migration.name)).toStrictEqual([
			"20240405T120024-regulus-mint",
			"20240405T120250-canopus-teal",
			"20240405T153857-alphard-black",
			"20240405T154913-mirfak-mustard",
		]);

		rmdirSync(migrationFolder(context), { recursive: true });

		expect(
			await Effect.runPromise(runProgram(pendingMigrations, context)),
		).toStrictEqual([]);
	});

	test<TestProgramContext>("should return an empty array without pending migrations", async (context) => {
		await fs.rm(migrationFolder(context), { recursive: true });

		expect(
			await Effect.runPromise(runProgram(pendingMigrations, context)),
		).toStrictEqual([]);
	});
});

describe("logPendingMigrations", () => {
	test<TestProgramContext>(
		"should list the pending migrations",
		{ retry: 3 },
		async (context) => {
			await Effect.runPromise(runProgram(logPendingMigrations, context));

			expect(context.logMessages).toMatchInlineSnapshot(`
				[
				  "│
				▲   PENDING  monolayer/migrations/default/expand/20240405T120024-regulus-mint.ts (expand)
				",
				  "│
				▲   PENDING  monolayer/migrations/default/expand/20240405T120250-canopus-teal.ts (expand)
				",
				  "│
				▲   PENDING  monolayer/migrations/default/expand/20240405T153857-alphard-black.ts (expand)
				",
				  "│
				▲   PENDING  monolayer/migrations/default/expand/20240405T154913-mirfak-mustard.ts (expand)
				",
				]
			`);
		},
	);

	test<TestProgramContext>(
		"should print no pending migrations when there are no pending migrations",
		{ retry: 3 },
		async (context) => {
			rmdirSync(migrationFolder(context), { recursive: true });

			await Effect.runPromise(runProgram(logPendingMigrations, context));

			expect(context.logMessages).toMatchInlineSnapshot(`
				[
				  "│
				│  No pending migrations.
				",
				]
			`);
		},
	);
});
