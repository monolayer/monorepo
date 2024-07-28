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
import { ChangesetPhase } from "../../src/changeset/types.js";

describe("scaffoldMigration", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
		vi.unmock("~/create-file.ts");
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("creates an empty alter migration file", async (context) => {
		rmSync(
			path.join(
				context.folder,
				"db",
				"migrations",
				"default",
				ChangesetPhase.Alter,
			),
			{
				recursive: true,
				force: true,
			},
		);
		const result = await runProgramWithErrorCause(
			scaffoldMigration(ChangesetPhase.Alter),
		);

		expect(result.match(/alter\/.+\.ts$/)).not.toBeNull();

		console.log("RESULT", result.match(/alter\/.+\.ts$/));
		const expected = `import { Kysely } from "kysely";
import { Migration } from "monolayer/migration";

export const migration: Migration = {
  name: "${path.basename(result).substring(0, path.basename(result).lastIndexOf("."))}",
  transaction: false,
  scaffold: true,
};

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;
		expect(readFileSync(result).toString()).toBe(expected);
	});

	test<ProgramContext>("creates an empty data migration file", async (context) => {
		rmSync(
			path.join(
				context.folder,
				"db",
				"migrations",
				"default",
				ChangesetPhase.Data,
			),
			{
				recursive: true,
				force: true,
			},
		);
		const result = await runProgramWithErrorCause(
			scaffoldMigration(ChangesetPhase.Data),
		);

		expect(result.match(/data\/.+\.ts$/)).not.toBeNull();

		const expected = `import { Kysely } from "kysely";
import { Migration } from "monolayer/migration";

export const migration: Migration = {
  name: "${path.basename(result).substring(0, path.basename(result).lastIndexOf("."))}",
  transaction: false,
  scaffold: true,
};

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;
		expect(readFileSync(result).toString()).toBe(expected);
	});
});
