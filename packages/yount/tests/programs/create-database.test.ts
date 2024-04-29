import { Effect } from "effect";
import { writeFileSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	createDatabase,
	createDevDatabase,
} from "~/database/create-database.js";
import { configurationsTemplate } from "~tests/__setup__/fixtures/program.js";
import { layers } from "~tests/__setup__/helpers/layers.js";
import { programWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
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
			Effect.provide(programWithErrorCause(createDatabase()), layers),
		);

		expect(
			(await context.pool.query("SELECT datname FROM pg_database;")).rows.find(
				(row) => row.datname === context.dbName,
			).datname,
		).toEqual(context.dbName);
	});
});

describe("createDevDatabase", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context, false);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("creates the development database", async (context) => {
		const configurations = configurationsTemplate.render({ dbName: "devDb" });
		writeFileSync(
			path.join(context.folder, "db", "configuration.ts"),
			configurations,
		);

		await context.pool.query(`DROP DATABASE IF EXISTS "devDb"`);

		expect(
			(await context.pool.query("SELECT datname FROM pg_database;")).rows.find(
				(row) => row.datname === "devDb",
			),
		).toBeUndefined();

		await Effect.runPromise(
			Effect.provide(programWithErrorCause(createDevDatabase()), layers),
		);

		expect(
			(await context.pool.query("SELECT datname FROM pg_database;")).rows.find(
				(row) => row.datname === "devDb",
			).datname,
		).toEqual("devDb");
	});
});
