import { ChangesetPhase } from "@monorepo/pg/changeset/types.js";
import { Effect } from "effect";
import color from "picocolors";
import { test } from "vitest";
import { expectLogMessage } from "~programs/__test_setup__/assertions.js";
import { programFolder } from "~programs/__test_setup__/program_context.js";
import { runProgram } from "~programs/__test_setup__/run-program.js";
import type { TestProgramContext } from "~programs/__test_setup__/setup.js";
import { logPendingMigrations } from "~programs/migrations/log-pending-migrations.js";

test<TestProgramContext>("should list the pending migrations", async (context) => {
	const folder = programFolder(context);

	await Effect.runPromise(
		runProgram(
			logPendingMigrations([
				{
					name: "20240405T120024-regulus-mint",
					path: `${folder}/monolayer/migrations/default/expand/20240405T120024-regulus-mint.ts`,
					phase: ChangesetPhase.Expand,
				},
				{
					name: "20240405T153857-alphard-black",
					path: `${folder}/monolayer/migrations/default/alter/20240405T153857-alphard-black`,
					phase: ChangesetPhase.Alter,
				},
				{
					name: "20240405T120250-canopus-teal",
					path: `${folder}/monolayer/migrations/default/contract/20240405T120250-canopus-teal`,
					phase: ChangesetPhase.Contract,
				},
			]),
			context,
		),
	);

	expectLogMessage({
		expected: `${color.bgYellow(color.black(" PENDING "))}`,
		messages: context.logMessages,
		count: 3,
	});

	expectLogMessage({
		expected: `${color.bgYellow(color.black(" PENDING "))} monolayer/migrations/default/expand/20240405T120024-regulus-mint.ts (expand)`,
		messages: context.logMessages,
		count: 1,
	});

	expectLogMessage({
		expected: `${color.bgYellow(color.black(" PENDING "))} monolayer/migrations/default/alter/20240405T153857-alphard-black (alter)`,
		messages: context.logMessages,
		count: 1,
	});

	expectLogMessage({
		expected: `${color.bgYellow(color.black(" PENDING "))} monolayer/migrations/default/contract/20240405T120250-canopus-teal (contract)`,
		messages: context.logMessages,
		count: 1,
	});
});

test<TestProgramContext>("should print no pending migrations when there are no pending migrations", async (context) => {
	await Effect.runPromise(runProgram(logPendingMigrations([]), context));

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
