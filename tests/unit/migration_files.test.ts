/* eslint-disable max-lines */
import { createHash } from "crypto";
import { mkdirSync, readFileSync, readdirSync, rmdirSync } from "fs";
import { Kysely } from "kysely";
import pg from "pg";
import { cwd } from "process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	ChangeSetType,
	Changeset,
} from "~/changeset/migration_op/changeset.js";
import { generateMigrationFiles } from "~/migrations/generate.js";
import { globalKysely } from "~tests/setup.js";

type MigrationContext = {
	folder: string;
	migrationsFolder: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>;
	pool: pg.Pool;
	task: {
		name: string;
	};
};

describe("Migrator", () => {
	describe("#generateMigrationFiles", () => {
		beforeEach((context: MigrationContext) => {
			context.kysely = globalKysely();
			const digest = createHash("sha256")
				.update(context.task.name)
				.digest("hex");
			context.folder = `${cwd()}/tmp/test/migrations/${digest}`;
			context.migrationsFolder = `${context.folder}/migrations`;
			mkdirSync(context.migrationsFolder, {
				recursive: true,
			});
		});

		afterEach((context: MigrationContext) => {
			rmdirSync(context.folder, { recursive: true });
		});

		test("#output files", (context: MigrationContext) => {
			const changeset: Changeset[] = [
				{
					tableName: "books",
					type: ChangeSetType.CreateTable,
					priority: 1,
					up: [
						[
							"await db.schema",
							'createTable("books")',
							'addColumn("name", "text")',
							"execute();",
						],
					],
					down: [["await db.schema", 'dropTable("books")', "execute();"]],
				},
				{
					tableName: "members",
					priority: 1,
					type: ChangeSetType.CreateTable,
					up: [
						[
							"await db.schema",
							'createTable("members")',
							'addColumn("name", "varchar", (col) => col.defaultTo("hello"))',
							'addColumn("email", "varchar(255)")',
							'addColumn("city", "text", (col) => col.notNull())',
							"execute();",
						],
					],
					down: [["await db.schema", 'dropTable("members")', "execute();"]],
				},
				{
					tableName: "shops",
					priority: 1,
					type: ChangeSetType.DropTable,
					up: [["await db.schema", 'dropTable("shops")', "execute();"]],
					down: [
						[
							"await db.schema",
							'createTable("shops")',
							'addColumn("name", "varchar", (col) => col.defaultTo("hello"))',
							'addColumn("email", "varchar(255)")',
							'addColumn("city", "text", (col) => col.notNull())',
							"execute();",
						],
					],
				},
				{
					tableName: "addresses",
					type: ChangeSetType.CreateColumn,
					priority: 2,
					up: [
						[
							"await db.schema",
							'alterTable("addresses")',
							'addColumn("country", "text")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("addresses")',
							'dropColumn("country")',
							"execute();",
						],
					],
				},
				{
					tableName: "addresses",
					type: ChangeSetType.ChangeColumn,
					priority: 3001,
					up: [
						[
							"await db.schema",
							'alterTable("addresses")',
							'alterColumn("name", (col) => col.setDataType("varchar"))',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("addresses")',
							'alterColumn("name", (col) => col.setDataType("text"))',
							"execute();",
						],
					],
				},
				{
					tableName: "addresses",
					type: ChangeSetType.ChangeColumn,
					priority: 3001,
					up: [
						[
							"await db.schema",
							'alterTable("addresses")',
							'alterColumn("email", (col) => col.setDataType("varchar"))',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("addresses")',
							'alterColumn("email", (col) => col.setDataType("varchar(255)"))',
							"execute();",
						],
					],
				},
				{
					tableName: "addresses",
					type: ChangeSetType.ChangeColumn,
					priority: 3002,
					up: [
						[
							"await db.schema",
							'alterTable("addresses")',
							'alterColumn("name", (col) => col.setDefault("hello"))',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("addresses")',
							'alterColumn("name", (col) => col.dropDefault())',
							"execute();",
						],
					],
				},
				{
					tableName: "addresses",
					type: ChangeSetType.ChangeColumn,
					priority: 3002,
					up: [
						[
							"await db.schema",
							'alterTable("addresses")',
							'alterColumn("name", (col) => col.setNotNull())',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("addresses")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					tableName: "addresses",
					type: ChangeSetType.ChangeColumn,
					priority: 3002,
					up: [
						[
							"await db.schema",
							'alterTable("addresses")',
							'alterColumn("city", (col) => col.dropDefault())',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("addresses")',
							'alterColumn("city", (col) => col.setDefault("bcn"))',
							"execute();",
						],
					],
				},
				{
					tableName: "addresses",
					type: ChangeSetType.ChangeColumn,
					priority: 3002,
					up: [
						[
							"await db.schema",
							'alterTable("addresses")',
							'alterColumn("city", (col) => col.setNotNull())',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("addresses")',
							'alterColumn("city", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					tableName: "books",
					type: ChangeSetType.CreateIndex,
					up: [
						[
							'await sql`create index "books_name_kntc_idx" on "books" ("name")`.execute(db);',
						],
					],
					down: [[]],
				},
				{
					tableName: "shops",
					priority: 4003,
					type: ChangeSetType.DropIndex,
					up: [],
					down: [
						[
							'await sql`create unique index "shops_mail_kntc_idx" on "shops" using btree ("email")`.execute(db);',
						],
					],
				},
				{
					tableName: "shops",
					priority: 4003,
					type: ChangeSetType.DropIndex,
					up: [],
					down: [
						[
							'await sql`create unique index "shops_city_kntc_idx" on "shops" using btree ("city")`.execute(db);',
						],
					],
				},
				{
					tableName: "addresses",
					priority: 4003,
					type: ChangeSetType.CreateIndex,
					up: [
						[
							'await sql`create unique index "addresses_city_kntc_idx" on "addresses" using btree ("city")`.execute(db);',
						],
					],
					down: [
						['await db.schema.dropIndex("addresses_city_kntc_idx").execute();'],
					],
				},
			];
			generateMigrationFiles(changeset, context.folder);
			const dir = readdirSync(context.migrationsFolder);
			const fileMatch = /^\w+-(\w+)-(\w+)\.ts$/;
			for (const file of dir) {
				const matchedFile = fileMatch.exec(file);
				if (matchedFile === null) {
					expect(matchedFile).not.toBeNull();
				} else {
					const fixtureContent = readFileSync(
						`${cwd()}/tests/fixtures/test_migration.txt`,
						"utf-8",
					);
					const migrationContent = readFileSync(
						`${context.migrationsFolder}/${file}`,
					).toString();
					console.dir(migrationContent, { depth: null });
					expect(migrationContent).toBe(fixtureContent);
				}
			}
		});

		test("#output without sql import", (context: MigrationContext) => {
			const changeset: Changeset[] = [
				{
					tableName: "books",
					type: ChangeSetType.CreateTable,
					priority: 1,
					up: [
						[
							"await db.schema",
							'createTable("books")',
							'addColumn("name", "text")',
							"execute();",
						],
					],
					down: [["await db.schema", 'dropTable("books")', "execute();"]],
				},
			];
			generateMigrationFiles(changeset, context.folder);
			const dir = readdirSync(context.migrationsFolder);
			const fileMatch = /^\w+-(\w+)-(\w+)\.ts$/;
			for (const file of dir) {
				const matchedFile = fileMatch.exec(file);
				if (matchedFile === null) {
					expect(matchedFile).not.toBeNull();
				} else {
					const fixtureContent = readFileSync(
						`${cwd()}/tests/fixtures/test_migration_without_sql_import.txt`,
						"utf-8",
					);
					const migrationContent = readFileSync(
						`${context.migrationsFolder}/${file}`,
					).toString();
					expect(migrationContent).toBe(fixtureContent);
				}
			}
		});
	});
});
