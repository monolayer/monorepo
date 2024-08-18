import { Effect } from "effect";
import { rmdirSync } from "node:fs";
import color from "picocolors";
import { beforeEach, test } from "vitest";
import { expectLogMessage } from "~programs/__test_setup__/assertions.js";
import { createTestDatabase } from "~programs/__test_setup__/database.js";
import { migrationFolder } from "~programs/__test_setup__/program_context.js";
import { runProgram } from "~programs/__test_setup__/run-program.js";
import type { TestProgramContext } from "~programs/__test_setup__/setup.js";
import { logPendingMigrations } from "~programs/migrations/log-pending-migrations.js";

beforeEach<TestProgramContext>(async (context) => {
	await createTestDatabase(context);
});

test<TestProgramContext>("should list the pending migrations", async (context) => {
	await Effect.runPromise(runProgram(logPendingMigrations, context));

	expectLogMessage({
		expected: `${color.bgYellow(color.black(" PENDING "))}`,
		messages: context.logMessages,
		count: 4,
	});

	expectLogMessage({
		expected: `${color.bgYellow(color.black(" PENDING "))} monolayer/migrations/default/expand/20240405T120024-regulus-mint.ts (expand)`,
		messages: context.logMessages,
		count: 1,
	});

	expectLogMessage({
		expected: `${color.bgYellow(color.black(" PENDING "))} monolayer/migrations/default/expand/20240405T120250-canopus-teal.ts (expand)`,
		messages: context.logMessages,
		count: 1,
	});

	expectLogMessage({
		expected: `${color.bgYellow(color.black(" PENDING "))} monolayer/migrations/default/expand/20240405T153857-alphard-black.ts (expand)`,
		messages: context.logMessages,
		count: 1,
	});

	expectLogMessage({
		expected: `${color.bgYellow(color.black(" PENDING "))} monolayer/migrations/default/expand/20240405T154913-mirfak-mustard.ts (expand)`,
		messages: context.logMessages,
		count: 1,
	});
});

test<TestProgramContext>("should print no pending migrations when there are no pending migrations", async (context) => {
	rmdirSync(migrationFolder(context), { recursive: true });

	await Effect.runPromise(runProgram(logPendingMigrations, context));

	expectLogMessage({
		expected: `${color.bgYellow(color.black(" PENDING "))}`,
		messages: context.logMessages,
		count: 0,
	});

	expectLogMessage({
		expected: "No pending migrations.",
		messages: context.logMessages,
		count: 1,
	});
});
