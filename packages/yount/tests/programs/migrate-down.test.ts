import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { migrateDown } from "~/programs/migrate-down.js";
import { layers } from "~tests/__setup__/helpers/layers.js";
import { programWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("migrateDown", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("migrates one migration down", async (context) => {
		await context.migrator.migrateToLatest();

		await Effect.runPromise(
			Effect.provide(programWithErrorCause(migrateDown()), layers),
		);
		await Effect.runPromise(
			Effect.provide(programWithErrorCause(migrateDown()), layers),
		);

		const migrations = await context.kysely
			.selectFrom("kysely_migration")
			.select("name")
			.orderBy("name")
			.execute();

		const expected = [
			{ name: "20240405T120024-regulus-mint" },
			{ name: "20240405T120250-canopus-teal" },
		];
		expect(migrations).toEqual(expected);
	});
});
