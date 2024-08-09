import captureConsole from "capture-console";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { pendingMigrations } from "~/actions/migrations/pending.js";
import { runProgramWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";

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

		const pending = await runProgramWithErrorCause(pendingMigrations);

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

		expect(output).toContain("20240405T120250-canopus-teal");
		expect(output).toContain("20240405T153857-alphard-black");
		expect(output).toContain("20240405T154913-mirfak-mustard");
	});
});
