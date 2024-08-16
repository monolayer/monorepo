import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createDatabase } from "~monolayer/actions/database/create.js";
import { programWithContextAndServices } from "~tests/__setup__/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("createDatabase", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context, false);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("creates database", async (context) => {
		expect(
			(await context.pool.query("SELECT datname FROM pg_database;")).rows.find(
				(row) => row.datname === context.dbName,
			),
		).toBeUndefined();

		await Effect.runPromise(
			await programWithContextAndServices(createDatabase),
		);

		expect(
			(await context.pool.query("SELECT datname FROM pg_database;")).rows.find(
				(row) => row.datname === context.dbName,
			).datname,
		).toEqual(context.dbName);
	});
});
