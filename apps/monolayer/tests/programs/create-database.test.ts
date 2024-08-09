import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createDatabase } from "~/actions/database/create.js";
import { runProgramWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
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

		await runProgramWithErrorCause(createDatabase);

		expect(
			(await context.pool.query("SELECT datname FROM pg_database;")).rows.find(
				(row) => row.datname === context.dbName,
			).datname,
		).toEqual(context.dbName);
	});
});
