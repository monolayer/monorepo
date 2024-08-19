import { ChangesetPhase } from "@monorepo/pg/changeset/types.js";
import { Effect } from "effect";
import fs from "node:fs/promises";
import path from "node:path";
import { beforeEach, expect, test } from "vitest";
import {
	checkNoPendingPhases,
	pendingPhases,
} from "~programs/migrations/phases.js";
import { createTestDatabase } from "~test-setup/database.js";
import { migrationFolder } from "~test-setup/program_context.js";
import { runProgram } from "~test-setup/run-program.js";
import type { TestProgramContext } from "~test-setup/setup.js";

beforeEach<TestProgramContext>(async (context) => {
	await createTestDatabase(context);
});

test<TestProgramContext>("pendingPhases should list the pending migrations phases", async (context) => {
	const phases = await Effect.runPromise(runProgram(pendingPhases, context));

	expect(phases).toEqual(["expand"]);

	await fs.cp(
		path.join(migrationFolder(context), "expand"),
		path.join(migrationFolder(context), "contract"),
		{ recursive: true, force: true },
	);

	expect(
		(await Effect.runPromise(runProgram(pendingPhases, context))).sort(),
	).toStrictEqual(["expand", "contract"].sort());

	await fs.cp(
		path.join(migrationFolder(context), "expand"),
		path.join(migrationFolder(context), "alter"),
		{ recursive: true, force: true },
	);

	expect(
		(await Effect.runPromise(runProgram(pendingPhases, context))).sort(),
	).toStrictEqual(["expand", "contract", "alter"].sort());

	await fs.cp(
		path.join(migrationFolder(context), "expand"),
		path.join(migrationFolder(context), "data"),
		{ recursive: true, force: true },
	);

	expect(
		(await Effect.runPromise(runProgram(pendingPhases, context))).sort(),
	).toStrictEqual(["expand", "contract", "alter", "data"].sort());

	await fs.rm(migrationFolder(context), { recursive: true });

	expect(
		await Effect.runPromise(runProgram(pendingPhases, context)),
	).toStrictEqual([]);
});

test<TestProgramContext>("checkNoPendingPhases checks if there are pending migrations by phases", async (context) => {
	await fs.cp(
		path.join(migrationFolder(context), ChangesetPhase.Expand),
		path.join(migrationFolder(context), ChangesetPhase.Contract),
		{ recursive: true, force: true },
	);
	await fs.cp(
		path.join(migrationFolder(context), ChangesetPhase.Expand),
		path.join(migrationFolder(context), ChangesetPhase.Alter),
		{ recursive: true, force: true },
	);
	await fs.cp(
		path.join(migrationFolder(context), ChangesetPhase.Expand),
		path.join(migrationFolder(context), ChangesetPhase.Data),
		{ recursive: true, force: true },
	);

	expect(
		await Effect.runPromise(
			runProgram(checkNoPendingPhases([ChangesetPhase.Expand]), context),
		),
	).toStrictEqual(["expand"]);

	expect(
		await Effect.runPromise(
			runProgram(
				checkNoPendingPhases([
					ChangesetPhase.Expand,
					ChangesetPhase.Contract,
					ChangesetPhase.Data,
				]),
				context,
			),
		),
	).toStrictEqual(["expand", "contract", "data"]);

	await fs.rm(path.join(migrationFolder(context), ChangesetPhase.Expand), {
		recursive: true,
		force: true,
	});

	expect(
		await Effect.runPromise(
			runProgram(
				checkNoPendingPhases([
					ChangesetPhase.Expand,
					ChangesetPhase.Contract,
					ChangesetPhase.Data,
				]),
				context,
			),
		),
	).toStrictEqual(["contract", "data"]);
});
