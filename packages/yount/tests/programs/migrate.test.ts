import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { migrate } from "~/programs/migrate.js";
import { layers } from "~tests/__setup__/helpers/layers.js";
import { programWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("migrate", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("applies all pending migrations", async (context) => {
		const migrateResult = await Effect.runPromise(
			Effect.provide(programWithErrorCause(migrate()), layers),
		);

		expect(migrateResult).toBe(true);
		const migrations = await context.kysely
			.selectFrom("kysely_migration")
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
			await Effect.runPromise(
				Effect.provide(programWithErrorCause(migrate()), layers),
			),
		).toBe(true);
	});
});
