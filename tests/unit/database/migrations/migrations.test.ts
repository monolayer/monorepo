import { createHash } from "crypto";
import { mkdirSync, readFileSync, readdirSync, rmdirSync } from "fs";
import { Kysely } from "kysely";
import pg from "pg";
import { cwd } from "process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ChangeSet } from "~/database/db_changeset.js";
import { generateMigrationFiles } from "~/database/migrations/generate.js";
import { globalKysely } from "~tests/setup.js";

type MigrationContext = {
	folder: string;
	migrationsFolder: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
			const changeset = <ChangeSet>[
				{
					tableName: "books",
					type: "create",
					up: ['createTable("books")', 'addColumn("name", "text")'],
					down: ['dropTable("books")'],
				},
				{
					tableName: "members",
					type: "create",
					up: [
						'createTable("members")',
						'addColumn("name", "varchar", (col) => col.defaultTo("hello"))',
						'addColumn("email", "varchar(255)")',
						'addColumn("city", "text", (col) => col.notNull())',
					],
					down: ['dropTable("members")'],
				},
				{
					tableName: "shops",
					type: "drop",
					up: ['dropTable("shops")'],
					down: [
						'createTable("shops")',
						'addColumn("name", "varchar", (col) => col.defaultTo("hello"))',
						'addColumn("email", "varchar(255)")',
						'addColumn("city", "text", (col) => col.notNull())',
					],
				},
				{
					tableName: "addresses",
					type: "change",
					up: [
						'alterTable("addresses")',
						'alterColumn("name", (col) => col.setDataType("varchar"))',
						'alterColumn("name", (col) => col.setDefault("hello"))',
						'alterColumn("name", (col) => col.setNotNull())',
						'alterColumn("email", (col) => col.setDataType("varchar"))',
						'alterColumn("city", (col) => col.dropDefault())',
						'alterColumn("city", (col) => col.setNotNull())',
						'addColumn("country", "text")',
					],
					down: [
						'alterTable("addresses")',
						'dropColumn("country")',
						'alterColumn("city", (col) => col.dropNotNull())',
						'alterColumn("city", (col) => col.setDefault("bcn"))',
						'alterColumn("email", (col) => col.setDataType("varchar(255)"))',
						'alterColumn("name", (col) => col.dropNotNull())',
						'alterColumn("name", (col) => col.dropDefault())',
						'alterColumn("name", (col) => col.setDataType("text"))',
					],
				},
			];
			generateMigrationFiles(changeset, context.folder);
			const dir = readdirSync(context.migrationsFolder);
			const fileMatch = /^\w+-\d+-(\w+)\.ts$/;
			for (const file of dir) {
				const matchedFile = fileMatch.exec(file);
				if (matchedFile === null) {
					expect(matchedFile).not.toBeNull();
				} else {
					const fixtureContent = readFileSync(
						`${cwd()}/tests/fixtures/${matchedFile[1]}.txt`,
						"utf-8",
					);
					const migrationContent = readFileSync(
						`${context.migrationsFolder}/${file}`,
					).toString();
					expect(migrationContent).toBe(fixtureContent);
				}
			}
			expect(dir.length).toBe(4);
		});
	});
});
