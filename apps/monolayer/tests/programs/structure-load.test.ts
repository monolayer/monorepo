import { structureLoad } from "@monorepo/programs/database/structure-load.js";
import { Effect } from "effect";
import { copyFileSync } from "fs";
import path from "path";
import { afterEach, beforeEach, expect, test } from "vitest";
import { programWithContextAndServices } from "~tests/__setup__/helpers/run-program.js";
import {
	dbAndMigrator,
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";

beforeEach<ProgramContext>(async (context) => {
	await setupProgramContext(context);
});

afterEach<ProgramContext>(async (context) => {
	await teardownProgramContext(context);
});

test<ProgramContext>(
	"restores db from structure file",
	async (context) => {
		copyFileSync(
			path.join(
				context.currentWorkingDirectory,
				`tests/__setup__/fixtures/structure.sql`,
			),
			path.join(context.folder, "monolayer", "dumps", "structure.default.sql"),
		);

		await context.kysely.destroy();

		await Effect.runPromise(
			await programWithContextAndServices(structureLoad()),
		);

		const kysely = (await dbAndMigrator(context)).db;
		expect(
			kysely.insertInto("regulus_mint").values({ name: "hello" }).execute(),
		).resolves.not.toThrow();
	},
	{ timeout: 20000 },
);
