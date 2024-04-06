import captureConsole from "capture-console";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { pendingMigrations } from "~/cli/programs/pending-migrations.js";
import { layers } from "~tests/helpers/layers.js";
import { programWithErrorCause } from "~tests/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/helpers/test-context.js";

describe("pendingMigrations", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("lists pending migrations", async (context) => {
		await context.migrator.migrateUp();

		let output = "";
		captureConsole.startCapture(process.stdout, (stdout) => {
			output += stdout;
		});

		const pending = await Effect.runPromise(
			Effect.provide(programWithErrorCause(pendingMigrations()), layers),
		);

		captureConsole.stopCapture(process.stdout);

		const expected = [
			{
				name: "20240405T120250-canopus-teal",
			},
			{
				name: "20240405T153857-alphard-black",
			},
			{
				name: "20240405T154913-mirfak-mustard",
			},
		];

		const pendingNames = pending.map((m) => ({ name: m.name }));
		expect(pendingNames).toStrictEqual(expected);

		expect(output).toContain(
			"\u001b[33mpending\u001b[39m db/migrations/20240405T120250-canopus-teal.ts",
		);
		expect(output).toContain(
			"\u001b[33mpending\u001b[39m db/migrations/20240405T153857-alphard-black.ts",
		);
		expect(output).toContain(
			"\u001b[33mpending\u001b[39m db/migrations/20240405T154913-mirfak-mustard.ts",
		);
	});
});
