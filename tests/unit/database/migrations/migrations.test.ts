import { createHash } from "crypto";
import { mkdirSync, readFileSync, readdirSync, rmdirSync } from "fs";
import { Kysely } from "kysely";
import pg from "pg";
import { cwd } from "process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ChangeSet, ChangeSetType } from "~/database/db_changeset.js";
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
			const changeset: ChangeSet = {
				books: {
					columns: {
						tableName: "books",
						type: ChangeSetType.CreateTable,
						up: ['createTable("books")', 'addColumn("name", "text")'],
						down: ['dropTable("books")'],
					},
					indexes: [
						{
							tableName: "books",
							type: ChangeSetType.CreateIndex,
							up: [
								'await sql`create index "books_name_idx" on "books" ("name")`.execute(db);',
							],
							down: [],
						},
					],
				},
				members: {
					columns: {
						tableName: "members",
						type: ChangeSetType.CreateTable,
						up: [
							'createTable("members")',
							'addColumn("name", "varchar", (col) => col.defaultTo("hello"))',
							'addColumn("email", "varchar(255)")',
							'addColumn("city", "text", (col) => col.notNull())',
						],
						down: ['dropTable("members")'],
					},
					indexes: [],
				},
				shops: {
					columns: {
						tableName: "shops",
						type: ChangeSetType.DropTable,
						up: ['dropTable("shops")'],
						down: [
							'createTable("shops")',
							'addColumn("name", "varchar", (col) => col.defaultTo("hello"))',
							'addColumn("email", "varchar(255)")',
							'addColumn("city", "text", (col) => col.notNull())',
						],
					},
					indexes: [
						{
							tableName: "shops",
							type: ChangeSetType.DropIndex,
							up: [],
							down: [
								'await sql`create unique index "shops_mail_idx" on "shops" using btree ("email")`.execute(db);',
							],
						},
						{
							tableName: "shops",
							type: ChangeSetType.DropIndex,
							up: [],
							down: [
								'await sql`create unique index "shops_city_idx" on "shops" using btree ("city")`.execute(db);',
							],
						},
					],
				},
				addresses: {
					columns: {
						tableName: "addresses",
						type: ChangeSetType.ChangeTable,
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
					indexes: [
						{
							tableName: "addresses",
							type: ChangeSetType.CreateIndex,
							up: [
								'await sql`create unique index "addresses_city_idx" on "addresses" using btree ("city")`.execute(db);',
							],
							down: [
								'await db.schema.dropIndex("addresses_city_idx").execute();',
							],
						},
					],
				},
			};
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
