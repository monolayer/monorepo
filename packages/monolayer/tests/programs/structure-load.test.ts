import { Effect } from "effect";
import { copyFileSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { structureLoad } from "~/database/structure-load.js";
import { layers } from "~tests/__setup__/helpers/layers.js";
import { programWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
import {
	dbAndMigrator,
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("structureLoad", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("restores db from structure file", async (context) => {
		copyFileSync(
			path.join(
				context.currentWorkingDirectory,
				`tests/__setup__/fixtures/structure.sql`,
			),
			path.join(context.folder, "db", "dumps", "structure.default.sql"),
		);

		await context.kysely.destroy();
		await Effect.runPromise(
			Effect.provide(programWithErrorCause(structureLoad()), layers),
		);

		const kysely = (await dbAndMigrator(context)).db;
		expect(
			kysely.insertInto("regulus_mint").values({ name: "hello" }).execute(),
		).resolves.not.toThrow();
	});

	test.todo<ProgramContext>(
		"restores db from structure file on non default configurations",
		() => {},
	);
});
