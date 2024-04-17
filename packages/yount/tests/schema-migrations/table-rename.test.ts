/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test, vi } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { text } from "~/database/schema/table/column/data-types/text.js";
import { table } from "~/database/schema/table/table.js";
import {
	check,
	foreignKey,
	integer,
	primaryKey,
	serial,
	unique,
} from "~/pg.js";
import { columnDiffPrompt } from "~/programs/column-diff-prompt.js";
import { tableDiffPrompt } from "~/programs/table-diff-prompt.js";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "~tests/__setup__/helpers/test-context.js";

describe(
	"Rename table migrations",
	{ concurrent: false, sequential: true },
	() => {
		// { concurrent: false, sequential: true },
		beforeEach<DbContext>(async (context) => {
			await setUpContext(context);
		});

		afterEach<DbContext>(async (context) => {
			await teardownContext(context);
			vi.restoreAllMocks();
		});

		test<DbContext>("rename empty table", async (context) => {
			vi.mocked(tableDiffPrompt).mockResolvedValue([
				{
					from: "users",
					to: "teams",
				},
			]);
			await context.kysely.schema.createTable("users").execute();

			const dbSchema = schema({
				tables: {
					teams: table({
						columns: {},
					}),
				},
			});

			const expected = [
				{
					priority: 900,
					tableName: "users",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameTo("teams")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("teams")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
			});
		});

		test<DbContext>("rename table", async (context) => {
			vi.mocked(tableDiffPrompt).mockResolvedValue([
				{
					from: "books",
					to: "new_books",
				},
			]);

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_5c1a35cf_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addUniqueConstraint("users_b663df16_yount_key", ["book_id"])
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addCheckConstraint("users_918b4271_yount_chk", sql`"id" < 50000`)
				.execute();

			const new_books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
					foreignKeys: [
						foreignKey(["book_id"], new_books, ["id"])
							.updateRule("cascade")
							.deleteRule("set null"),
					],
					unique: [unique(["book_id"])],
					checks: [check(sql`${sql.ref("id")} > 50`)],
				},
			});

			const dbSchema = schema({
				tables: {
					new_books,
					users,
				},
			});

			const expected = [
				{
					priority: 900,
					tableName: "books",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameTo("new_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
			];
			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
			});
		});

		test<DbContext>("rename table and add columns", async (context) => {
			vi.mocked(tableDiffPrompt).mockResolvedValue([
				{
					from: "books",
					to: "new_books",
				},
			]);

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_5c1a35cf_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addUniqueConstraint("users_b663df16_yount_key", ["book_id"])
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addCheckConstraint("users_918b4271_yount_chk", sql`"id" < 50000`)
				.execute();

			const new_books = table({
				columns: {
					id: integer(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
					unique: [unique(["name"])],
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
					foreignKeys: [
						foreignKey(["book_id"], new_books, ["id"])
							.updateRule("cascade")
							.deleteRule("set null"),
					],
					unique: [unique(["book_id"])],
					checks: [check(sql`${sql.ref("id")} > 50`)],
				},
			});

			const dbSchema = schema({
				tables: {
					new_books,
					users,
				},
			});

			const expected = [
				{
					priority: 900,
					tableName: "books",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameTo("new_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 2003,
					tableName: "new_books",
					type: "createColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'addColumn("name", "text")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'dropColumn("name")',
							"execute();",
						],
					],
				},
				{
					priority: 4002,
					tableName: "new_books",
					type: "createConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'addUniqueConstraint("new_books_adbefd84_yount_key", ["name"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'dropConstraint("new_books_adbefd84_yount_key")',
							"execute();",
						],
					],
				},
			];
			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
			});
		});

		test<DbContext>("rename table and add primary key", async (context) => {
			vi.mocked(tableDiffPrompt).mockResolvedValue([
				{
					from: "users",
					to: "teams",
				},
			]);
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.execute();

			const dbSchema = schema({
				tables: {
					teams: table({
						columns: {
							name: text(),
						},
						constraints: {
							primaryKey: primaryKey(["name"]),
						},
					}),
				},
			});

			const expected = [
				{
					priority: 900,
					tableName: "users",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameTo("teams")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("teams")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 4001,
					tableName: "teams",
					type: "createPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("teams")',
							'addPrimaryKeyConstraint("teams_yount_pk", ["name"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("teams")',
							'dropConstraint("teams_yount_pk")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("teams")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
			});
		});

		test<DbContext>("rename table and drop primary key", async (context) => {
			vi.mocked(tableDiffPrompt).mockResolvedValue([
				{
					from: "users",
					to: "teams",
				},
			]);
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_yount_pk", ["name"])
				.execute();

			const dbSchema = schema({
				tables: {
					teams: table({
						columns: {
							name: text(),
						},
					}),
				},
			});

			const expected = [
				{
					priority: 900,
					tableName: "users",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameTo("teams")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("teams")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 1004,
					tableName: "teams",
					type: "dropPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("teams")',
							'dropConstraint("users_yount_pk")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("teams")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("teams")',
							'addPrimaryKeyConstraint("users_yount_pk", ["name"])',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
			});
		});

		test<DbContext>("rename table and add foreign key reference", async (context) => {
			vi.mocked(tableDiffPrompt).mockResolvedValue([
				{
					from: "books",
					to: "new_books",
				},
			]);

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_id_yount_pk", ["id"])
				.execute();

			const new_books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
					foreignKeys: [
						foreignKey(["book_id"], new_books, ["id"])
							.updateRule("cascade")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					new_books,
					users,
				},
			});

			const expected = [
				{
					priority: 900,
					tableName: "books",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameTo("new_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_5c1a35cf_yount_fk")',
							"execute();",
						],
					],
					priority: 4002,
					tableName: "users",
					type: "createConstraint",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_5c1a35cf_yount_fk", ["book_id"], "new_books", ["id"])
    .onDelete("set null")
    .onUpdate("cascade")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_5c1a35cf_yount_fk"`',
							"execute(db);",
						],
					],
				},
			];
			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
			});
		});

		test<DbContext>("rename table change column name and add foreign key reference", async (context) => {
			vi.mocked(tableDiffPrompt).mockResolvedValue([
				{
					from: "books",
					to: "new_books",
				},
			]);

			vi.mocked(columnDiffPrompt).mockResolvedValue({
				new_books: [
					{
						from: "id",
						to: "demo",
					},
				],
			});

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_id_yount_pk", ["id"])
				.execute();

			const new_books = table({
				columns: {
					demo: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["demo"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
					foreignKeys: [
						foreignKey(["book_id"], new_books, ["demo"])
							.updateRule("cascade")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					new_books,
					users,
				},
			});

			const expected = [
				{
					priority: 900,
					tableName: "books",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameTo("new_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "new_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameColumn("id", "demo")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameColumn("demo", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 4002,
					tableName: "users",
					type: "createConstraint",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_218e6fc1_yount_fk", ["book_id"], "new_books", ["demo"])
    .onDelete("set null")
    .onUpdate("cascade")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_218e6fc1_yount_fk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_218e6fc1_yount_fk")',
							"execute();",
						],
					],
				},
			];
			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
			});
		});

		test<DbContext>("rename table change column name and drop foreign key reference", async (context) => {
			vi.mocked(tableDiffPrompt).mockResolvedValue([
				{
					from: "books",
					to: "new_books",
				},
			]);

			vi.mocked(columnDiffPrompt).mockResolvedValue({
				new_books: [
					{
						from: "id",
						to: "demo",
					},
				],
			});

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_5c1a35cf_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const new_books = table({
				columns: {
					demo: integer().renameFrom("id"),
				},
				constraints: {
					primaryKey: primaryKey(["demo"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const dbSchema = schema({
				tables: {
					new_books,
					users,
				},
			});

			const expected = [
				{
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameTo("books")',
							"execute();",
						],
					],
					priority: 900,
					tableName: "books",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameTo("new_books")',
							"execute();",
						],
					],
				},
				{
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_5c1a35cf_yount_fk", ["book_id"], "new_books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_5c1a35cf_yount_fk"`',
							"execute(db);",
						],
					],
					priority: 1003,
					tableName: "users",
					type: "dropConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_5c1a35cf_yount_fk")',
							"execute();",
						],
					],
				},
				{
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameColumn("demo", "id")',
							"execute();",
						],
					],
					priority: 3000,
					tableName: "new_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameColumn("id", "demo")',
							"execute();",
						],
					],
				},
			];
			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
			});
		});

		test<DbContext>("rename table and add unique constraint", async (context) => {
			vi.mocked(tableDiffPrompt).mockResolvedValue([
				{
					from: "books",
					to: "new_books",
				},
			]);

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("name", "text")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
				.execute();

			const new_books = table({
				columns: {
					id: integer(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
					unique: [unique(["name"])],
				},
			});

			const dbSchema = schema({
				tables: {
					new_books,
				},
			});

			const expected = [
				{
					priority: 900,
					tableName: "books",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameTo("new_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 4002,
					tableName: "new_books",
					type: "createConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'addUniqueConstraint("new_books_adbefd84_yount_key", ["name"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'dropConstraint("new_books_adbefd84_yount_key")',
							"execute();",
						],
					],
				},
			];
			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
			});
		});

		test<DbContext>("rename table and drop unique constraint", async (context) => {
			vi.mocked(tableDiffPrompt).mockResolvedValue([
				{
					from: "books",
					to: "new_books",
				},
			]);

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("name", "text")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_adbefd84_yount_key", ["name"])
				.execute();

			const new_books = table({
				columns: {
					id: integer(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const dbSchema = schema({
				tables: {
					new_books,
				},
			});

			const expected = [
				{
					priority: 900,
					tableName: "books",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameTo("new_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 1003,
					tableName: "new_books",
					type: "dropConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'dropConstraint("books_adbefd84_yount_key")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'addUniqueConstraint("books_adbefd84_yount_key", ["name"])',
							"execute();",
						],
					],
				},
			];
			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
			});
		});

		test<DbContext>("rename table change column name and add unique constraint", async (context) => {
			vi.mocked(tableDiffPrompt).mockResolvedValue([
				{
					from: "books",
					to: "new_books",
				},
			]);

			vi.mocked(columnDiffPrompt).mockResolvedValue({
				new_books: [
					{
						from: "name",
						to: "description",
					},
				],
			});

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("name", "text")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
				.execute();

			const new_books = table({
				columns: {
					id: integer(),
					description: text().renameFrom("name"),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
					unique: [unique(["description"])],
				},
			});

			const dbSchema = schema({
				tables: {
					new_books,
				},
			});

			const expected = [
				{
					priority: 900,
					tableName: "books",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameTo("new_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "new_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameColumn("name", "description")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameColumn("description", "name")',
							"execute();",
						],
					],
				},
				{
					priority: 4002,
					tableName: "new_books",
					type: "createConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'addUniqueConstraint("new_books_488b93f9_yount_key", ["description"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'dropConstraint("new_books_488b93f9_yount_key")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
			});
		});

		test<DbContext>("rename table and add check constraint", async (context) => {
			vi.mocked(tableDiffPrompt).mockResolvedValue([
				{
					from: "books",
					to: "new_books",
				},
			]);

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("name", "text")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
				.execute();

			const new_books = table({
				columns: {
					id: integer(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
					checks: [check(sql`${sql.ref("id")} > 50`)],
				},
			});

			const dbSchema = schema({
				tables: {
					new_books,
				},
			});

			const expected = [
				{
					priority: 900,
					tableName: "books",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameTo("new_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 4002,
					tableName: "new_books",
					type: "createConstraint",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("new_books")
    .addCheckConstraint("new_books_918b4271_yount_chk", sql\`"id" > 50\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."new_books" VALIDATE CONSTRAINT "new_books_918b4271_yount_chk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'dropConstraint("new_books_918b4271_yount_chk")',
							"execute();",
						],
					],
				},
			];
			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
			});
		});

		test<DbContext>("rename table and drop check constraint", async (context) => {
			vi.mocked(tableDiffPrompt).mockResolvedValue([
				{
					from: "books",
					to: "new_books",
				},
			]);

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("name", "text")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint("books_918b4271_yount_chk", sql`"id" > 50`)
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint("books_e37c55a5_yount_chk", sql`"id" < 50000`)
				.execute();

			const new_books = table({
				columns: {
					id: integer(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
					checks: [check(sql`${sql.ref("id")} < 50000`)],
				},
			});

			const dbSchema = schema({
				tables: {
					new_books,
				},
			});

			const expected = [
				{
					priority: 900,
					tableName: "books",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameTo("new_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 1003,
					tableName: "new_books",
					type: "dropConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'dropConstraint("books_918b4271_yount_chk")',
							"execute();",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."new_books" ADD CONSTRAINT "books_918b4271_yount_chk" CHECK ((id > 50)) NOT VALID`',
							"execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."new_books" VALIDATE CONSTRAINT "books_918b4271_yount_chk"`',
							"execute(db);",
						],
					],
				},
			];
			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
			});
		});

		test<DbContext>("rename table and drop all check constraints", async (context) => {
			vi.mocked(tableDiffPrompt).mockResolvedValue([
				{
					from: "books",
					to: "new_books",
				},
			]);

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("name", "text")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint("books_918b4271_yount_chk", sql`"id" > 50`)
				.execute();

			const new_books = table({
				columns: {
					id: integer(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const dbSchema = schema({
				tables: {
					new_books,
				},
			});

			const expected = [
				{
					priority: 900,
					tableName: "books",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameTo("new_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 1003,
					tableName: "new_books",
					type: "dropConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'dropConstraint("books_918b4271_yount_chk")',
							"execute();",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."new_books" ADD CONSTRAINT "books_918b4271_yount_chk" CHECK ((id > 50)) NOT VALID`',
							"execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."new_books" VALIDATE CONSTRAINT "books_918b4271_yount_chk"`',
							"execute(db);",
						],
					],
				},
			];
			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
			});
		});
	},
);
