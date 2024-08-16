import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { programWithContextAndServices } from "~tests/__setup__/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";
import { migrate } from "../../__setup__/helpers/migration-success.js";

describe("migrate", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("applies all pending migrations", async (context) => {
		const migrateResult = await Effect.runPromise(
			await programWithContextAndServices(migrate),
		);

		expect(migrateResult).toBe(true);
		const migrations = await context.kysely
			.selectFrom("monolayer_alter_migration")
			.select("name")
			.orderBy("name")
			.execute();

		const expected = [
			{ name: "20240405T120024-regulus-mint" },
			{ name: "20240405T120250-canopus-teal" },
			{ name: "20240405T153857-alphard-black" },
			{ name: "20240405T154913-mirfak-mustard" },
		];
		expect(migrations).toEqual(expected);

		expect(
			await Effect.runPromise(await programWithContextAndServices(migrate)),
		).toBe(true);
	});
});
