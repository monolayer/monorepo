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
import { connectorsTemplateTwoDatabaseSchemas } from "~tests/fixtures/program.js";
import { defaultMigrationPath } from "~tests/helpers/default-migration-path.js";
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
		rmSync(defaultMigrationPath(context.folder), {
			recursive: true,
			force: true,
		});
		mkdirSync(defaultMigrationPath(context.folder), {
			recursive: true,
		});

		writeFileSync(path.join(context.folder, "db", "schema.ts"), schemaFile);

		await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(generateChangesetMigration()),
				layers,
			),
		);

		const migrationFiles = readdirSync(defaultMigrationPath(context.folder));

		expect(migrationFiles.length).toBe(1);

		const migration = readFileSync(
			path.join(
				context.folder,
				"db",
				"migrations",
				"default",
				migrationFiles[0]!,
			),
		);
		expect(migration.toString()).toBe(expectedMigration);
	});

	test<ProgramContext>("returns a changeset list for multiple database definitions", async (context) => {
		rmSync(defaultMigrationPath(context.folder), {
			recursive: true,
			force: true,
		});
		mkdirSync(defaultMigrationPath(context.folder), {
			recursive: true,
		});

		writeFileSync(path.join(context.folder, "db", "schema.ts"), schemaFile);
		writeFileSync(
			path.join(context.folder, "db", "anotherSchema.ts"),
			anotherSchemaFile,
		);

		const connectorsConfig = connectorsTemplateTwoDatabaseSchemas.render({
			dbName: context.dbName,
			secondSchemaFile: "anotherSchema",
		});

		writeFileSync(
			path.join(context.folder, "db", "connectors.ts"),
			connectorsConfig,
		);

		await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(generateChangesetMigration()),
				layers,
			),
		);

		const migrationFiles = readdirSync(defaultMigrationPath(context.folder));

		expect(migrationFiles.length).toBe(1);

		const migration = readFileSync(
			path.join(
				context.folder,
				"db",
				"migrations",
				"default",
				migrationFiles[0]!,
			),
		);
		expect(migration.toString()).toBe(expectedMigrationWithSchemas);
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

const anotherSchemaFile = `import { pgDatabase, table, text } from "${indexPath}";

export const database = pgDatabase({
	schema: "accounts",
  tables: {
    regulus_wolf: table({
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
  await db.withSchema("public").schema
    .createTable("regulus_mint")
    .addColumn("name", "text", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.withSchema("public").schema
    .dropTable("regulus_mint")
    .execute();
}
`;

const expectedMigrationWithSchemas = `/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.withSchema("public").schema
    .createTable("regulus_mint")
    .addColumn("name", "text", (col) => col.notNull())
    .execute();

  await sql\`CREATE SCHEMA IF NOT EXISTS "accounts";\`
    .execute(db);

  await db.withSchema("accounts").schema
    .createTable("regulus_wolf")
    .addColumn("name", "text", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.withSchema("accounts").schema
    .dropTable("regulus_wolf")
    .execute();

  await db.withSchema("public").schema
    .dropTable("regulus_mint")
    .execute();
}
`;