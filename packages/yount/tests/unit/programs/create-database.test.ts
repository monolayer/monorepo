import { Effect } from "effect";
import { writeFileSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	createDatabase,
	createDevDatabase,
} from "~/cli/programs/create-database.js";
import { connectionsTemplate } from "~tests/fixtures/program.js";
import { layers } from "~tests/helpers/layers.js";
import { programWithErrorCause } from "~tests/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/helpers/test-context.js";

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
		const connectionsConfig = connectionsTemplate.render({ dbName: "devDb" });
		writeFileSync(
			path.join(context.folder, "db", "connections.ts"),
			connectionsConfig,
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
