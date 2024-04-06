import { Effect } from "effect";
import { readFileSync } from "fs";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { scaffoldMigration } from "~/cli/programs/scaffold-migration.js";
import { layers } from "~tests/helpers/layers.js";
import { programWithErrorCause } from "~tests/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/helpers/test-context.js";

describe("scaffoldMigration", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("creates an empty migration file", async () => {
		const result = await Effect.runPromise(
			Effect.provide(programWithErrorCause(scaffoldMigration()), layers),
		);

		const expected = `import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;
		expect(readFileSync(result).toString()).toBe(expected);
	});
});
