import { readFileSync, rmSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { scaffoldMigration } from "~/migrations/scaffold.js";
import { runProgramWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
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
		rmSync(path.join(context.folder, "db", "migrations", "default", "unsafe"), {
			recursive: true,
			force: true,
		});
		const result = await runProgramWithErrorCause(scaffoldMigration());

		const expected = `import { Kysely } from "kysely";
import { NO_DEPENDENCY, Migration } from "monolayer/migration";

export const migration: Migration = {
  name: "${path.basename(result).substring(0, path.basename(result).lastIndexOf("."))}",
  transaction: false,
  scaffold: true,
  dependsOn: NO_DEPENDENCY,
};

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;
		expect(readFileSync(result).toString()).toBe(expected);
	});

	test<ProgramContext>("creates an empty migration file with dependencies", async () => {
		const result = await runProgramWithErrorCause(scaffoldMigration());

		const expected = `import { Kysely } from "kysely";
import { Migration } from "monolayer/migration";

export const migration: Migration = {
  name: "${path.basename(result).substring(0, path.basename(result).lastIndexOf("."))}",
  transaction: false,
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
