import { Effect, Ref } from "effect";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { loadEnv } from "~/cli/cli-action.js";
import { dropDatabase } from "~/database/drop.js";
import { AppEnvironment } from "~/state/app-environment.js";
import { layers } from "~tests/__setup__/helpers/layers.js";
import { programWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
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

		await Effect.runPromise(
			Effect.provideServiceEffect(
				Effect.provide(programWithErrorCause(dropDatabase()), layers),
				AppEnvironment,
				Ref.make(await loadEnv("development", "default")),
			),
		);

		expect(
			(await context.pool.query("SELECT datname FROM pg_database;")).rows.find(
				(row) => row.datname === context.dbName,
			),
		).toBeUndefined();
	});
});
