import { Effect } from "effect";
import {
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "fs";
import path from "path";
import { cwd } from "process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { generateChangesetMigration } from "~/cli/programs/generate-changeset-migration.js";
import { layers } from "~tests/helpers/layers.js";
import { programWithErrorCause } from "~tests/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/helpers/test-context.js";

describe("generateChangesetMigration", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("returns a changeset list", async (context) => {
		rmSync(path.join(context.folder, "db", "migrations"), {
			recursive: true,
			force: true,
		});
		mkdirSync(path.join(context.folder, "db", "migrations"), {
			recursive: true,
		});

		writeFileSync(path.join(context.folder, "db", "schema.ts"), schemaFile);

		await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(generateChangesetMigration()),
				layers,
			),
		);

		const migrationFiles = readdirSync(
			path.join(context.folder, "db", "migrations"),
		);

		expect(migrationFiles.length).toBe(1);

		const migration = readFileSync(
			path.join(context.folder, "db", "migrations", migrationFiles[0]!),
		);
		expect(migration.toString()).toBe(expectedMigration);
	});
});

const indexPath = path.join(cwd(), "src", "index.ts");
const schemaFile = `import { pgDatabase, table, text } from "${indexPath}";

export const database = pgDatabase({
  tables: {
    regulus_mint: table({
			columns: {
				name: text().notNull(),
			},
		}),
  },
});
`;

const expectedMigration = `/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("regulus_mint")
    .addColumn("name", "text", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("regulus_mint")
    .execute();
}
`;
