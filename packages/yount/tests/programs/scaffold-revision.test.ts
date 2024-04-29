import { Effect } from "effect";
import { readFileSync, rmSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { scaffoldRevision } from "~/revisions/scaffold.js";
import { layers } from "~tests/__setup__/helpers/layers.js";
import { programWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("scaffoldMigration", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
		vi.unmock("~/create-file.ts");
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("creates an empty migration file with no dependecies", async (context) => {
		rmSync(path.join(context.folder, "db", "revisions", "default"), {
			recursive: true,
			force: true,
		});
		const result = await Effect.runPromise(
			Effect.provide(programWithErrorCause(scaffoldRevision()), layers),
		);

		const expected = `import { Kysely } from "kysely";
import { NO_DEPENDENCY, Revision } from "yount/revision";

export const revision: Revision = {
	scaffold: true,
	dependsOn: NO_DEPENDENCY,
};

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;
		expect(readFileSync(result).toString()).toBe(expected);
	});

	test<ProgramContext>("creates an empty migration file with dependecies", async () => {
		const result = await Effect.runPromise(
			Effect.provide(programWithErrorCause(scaffoldRevision()), layers),
		);

		const expected = `import { Kysely } from "kysely";
import { Revision } from "yount/revision";

export const revision: Revision = {
	scaffold: true,
	dependsOn: "20240405T154913-mirfak-mustard",
};

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;
		expect(readFileSync(result).toString()).toBe(expected);
	});
});
