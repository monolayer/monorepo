import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { dropDatabase } from "~/database/drop.js";
import { runProgramWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("dropDatabase", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("drops database", async (context) => {
		expect(
			(await context.pool.query("SELECT datname FROM pg_database;")).rows.find(
				(row) => row.datname === context.dbName,
			).datname,
		).toEqual(context.dbName);

		await runProgramWithErrorCause(dropDatabase());

		expect(
			(await context.pool.query("SELECT datname FROM pg_database;")).rows.find(
				(row) => row.datname === context.dbName,
			),
		).toBeUndefined();
	});
});
