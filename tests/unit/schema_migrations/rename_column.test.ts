/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { pgInteger, pgText, pgVarchar } from "~/database/schema/pg_column.js";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { pgForeignKey } from "~/database/schema/pg_foreign_key.js";
import { pgIndex } from "~/database/schema/pg_index.js";
import { pgTable } from "~/database/schema/pg_table.js";
import { pgUnique } from "~/database/schema/pg_unique.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration_success.js";
import { setUpContext, teardownContext } from "~tests/helpers/test_context.js";
import { type DbContext } from "~tests/setup.js";

describe("Rename column migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	describe("not applied in remote", () => {
		test<DbContext>("column name", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.execute();

			const database = pgDatabase({
				tables: {
					users: pgTable({
						columns: {
							fullName: pgText().renameFrom("name"),
						},
					}),
				},
			});

			const expected = [
				{
					priority: 3010,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							"await db.schema",
							'alterTable("users")',
							'renameColumn("name", "fullName")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users")',
							'renameColumn("fullName", "name")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				database,
				expected,
				down: "reverse",
			});
		});

		test<DbContext>("column name and type", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.execute();

			const database = pgDatabase({
				tables: {
					users: pgTable({
						columns: {
							fullName: pgVarchar(255).renameFrom("name"),
						},
					}),
				},
			});

			const expected = [
				{
					priority: 3001,
					tableName: "users",
					type: "changeColumn",
					up: [
						[
							"await db.schema",
							'alterTable("users")',
							'alterColumn("name", (col) => col.setDataType("varchar(255)"))',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users")',
							'alterColumn("name", (col) => col.setDataType("text"))',
							"execute();",
						],
					],
				},
				{
					priority: 3010,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							"await db.schema",
							'alterTable("users")',
							'renameColumn("name", "fullName")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users")',
							'renameColumn("fullName", "name")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				database,
				expected,
				down: "reverse",
			});
		});

		test<DbContext>("with unique constraints applied", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addUniqueConstraint("users_name_kinetic_key", ["name"])
				.execute();

			const users = pgTable({
				columns: {
					fullName: pgText().renameFrom("name"),
				},
				uniqueConstraints: [pgUnique(["fullName"]).nullsNotDistinct()],
			});

			const database = pgDatabase({
				tables: {
					users: users,
				},
			});

			const expected = [
				{
					priority: 1003,
					tableName: "users",
					type: "dropConstraint",
					up: [
						[
							"await db.schema",
							'alterTable("users")',
							'dropConstraint("users_name_kinetic_key")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users")',
							'addUniqueConstraint("users_name_kinetic_key", ["name"])',
							"execute();",
						],
					],
				},
				{
					priority: 3010,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							"await db.schema",
							'alterTable("users")',
							'renameColumn("name", "fullName")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users")',
							'renameColumn("fullName", "name")',
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
							"await db.schema",
							'alterTable("users")',
							'addUniqueConstraint("users_fullName_kinetic_key", ["fullName"], (col) => col.nullsNotDistinct())',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users")',
							'dropConstraint("users_fullName_kinetic_key")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				database,
				expected,
				down: "reverse",
			});
		});

		test<DbContext>("with unique constraints not applied", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.execute();

			const users = pgTable({
				columns: {
					fullName: pgText().renameFrom("name"),
				},
				uniqueConstraints: [pgUnique(["fullName"])],
			});

			const database = pgDatabase({
				tables: {
					users: users,
				},
			});

			const expected = [
				{
					priority: 3010,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							"await db.schema",
							'alterTable("users")',
							'renameColumn("name", "fullName")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users")',
							'renameColumn("fullName", "name")',
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
							"await db.schema",
							'alterTable("users")',
							'addUniqueConstraint("users_fullName_kinetic_key", ["fullName"])',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users")',
							'dropConstraint("users_fullName_kinetic_key")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				database,
				expected,
				down: "reverse",
			});
		});

		test<DbContext>("with primary key applied", async (context) => {
			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.execute();

			await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_name_kinetic_pk PRIMARY KEY (\"name\")`.execute(
				context.kysely,
			);

			const users = pgTable({
				columns: {
					fullName: pgText().renameFrom("name"),
				},
				primaryKey: ["fullName"],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			const expected = [
				{
					priority: 1004,
					tableName: "users_pk1",
					type: "dropPrimaryKey",
					up: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'dropConstraint("users_pk1_name_kinetic_pk")',
							"execute();",
						],
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'addPrimaryKeyConstraint("users_pk1_name_kinetic_pk", ["name"])',
							"execute();",
						],
					],
				},
				{
					priority: 3010,
					tableName: "users_pk1",
					type: "changeColumnName",
					up: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'renameColumn("name", "fullName")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'renameColumn("fullName", "name")',
							"execute();",
						],
					],
				},
				{
					priority: 4001,
					tableName: "users_pk1",
					type: "createPrimaryKey",
					up: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'addPrimaryKeyConstraint("users_pk1_fullName_kinetic_pk", ["fullName"])',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'dropConstraint("users_pk1_fullName_kinetic_pk")',
							"execute();",
						],
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'alterColumn("fullName", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				database,
				expected,
				down: "reverse",
			});
		});

		test<DbContext>("with primary key not applied", async (context) => {
			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.execute();

			const users = pgTable({
				columns: {
					fullName: pgText().renameFrom("name"),
				},
				primaryKey: ["fullName"],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			const expected = [
				{
					priority: 3010,
					tableName: "users_pk1",
					type: "changeColumnName",
					up: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'renameColumn("name", "fullName")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'renameColumn("fullName", "name")',
							"execute();",
						],
					],
				},
				{
					priority: 4001,
					tableName: "users_pk1",
					type: "createPrimaryKey",
					up: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'addPrimaryKeyConstraint("users_pk1_fullName_kinetic_pk", ["fullName"])',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'dropConstraint("users_pk1_fullName_kinetic_pk")',
							"execute();",
						],
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'alterColumn("fullName", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				database,
				expected,
				down: "reverse",
			});
		});

		test<DbContext>("with foreign key applied", async (context) => {
			await context.kysely.schema
				.createTable("books_pk1")
				.addColumn("id", "integer")
				.addPrimaryKeyConstraint("books_pk1_id_kinetic_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.addForeignKeyConstraint(
					"users_pk1_book_id_books_pk1_id_kinetic_fk",
					["book_id"],
					"books_pk1",
					["id"],
				)
				.execute();

			const books = pgTable({
				columns: {
					id: pgInteger(),
				},
				primaryKey: ["id"],
			});

			const users = pgTable({
				columns: {
					name: pgText(),
					bookId: pgInteger().renameFrom("book_id"),
				},
				foreignKeys: [pgForeignKey(["bookId"], books, ["id"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
					books_pk1: books,
				},
			});

			const expected = [
				{
					priority: 1003,
					tableName: "users_pk1",
					type: "dropConstraint",
					up: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'dropConstraint("users_pk1_book_id_books_pk1_id_kinetic_fk")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'addForeignKeyConstraint("users_pk1_book_id_books_pk1_id_kinetic_fk", ["book_id"], "books_pk1", ["id"])',
							'onDelete("no action")',
							'onUpdate("no action")',
							"execute();",
						],
					],
				},
				{
					priority: 3010,
					tableName: "users_pk1",
					type: "changeColumnName",
					up: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'renameColumn("book_id", "bookId")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'renameColumn("bookId", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 4002,
					tableName: "users_pk1",
					type: "createConstraint",
					up: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'addForeignKeyConstraint("users_pk1_bookId_books_pk1_id_kinetic_fk", ["bookId"], "books_pk1", ["id"])',
							'onDelete("no action")',
							'onUpdate("no action")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'dropConstraint("users_pk1_bookId_books_pk1_id_kinetic_fk")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				database,
				expected,
				down: "reverse",
			});
		});

		test<DbContext>("with foreign key not applied", async (context) => {
			await context.kysely.schema
				.createTable("books_pk1")
				.addColumn("id", "integer")
				.addPrimaryKeyConstraint("books_pk1_id_kinetic_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			const books = pgTable({
				columns: {
					id: pgInteger(),
				},
				primaryKey: ["id"],
			});

			const users = pgTable({
				columns: {
					name: pgText(),
					bookId: pgInteger().renameFrom("book_id"),
				},
				foreignKeys: [pgForeignKey(["bookId"], books, ["id"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
					books_pk1: books,
				},
			});

			const expected = [
				{
					priority: 3010,
					tableName: "users_pk1",
					type: "changeColumnName",
					up: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'renameColumn("book_id", "bookId")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'renameColumn("bookId", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 4002,
					tableName: "users_pk1",
					type: "createConstraint",
					up: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'addForeignKeyConstraint("users_pk1_bookId_books_pk1_id_kinetic_fk", ["bookId"], "books_pk1", ["id"])',
							'onDelete("no action")',
							'onUpdate("no action")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'dropConstraint("users_pk1_bookId_books_pk1_id_kinetic_fk")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				database,
				expected,
				down: "reverse",
			});
		});

		test<DbContext>("with indexes applied", async (context) => {
			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("users_pk1_book_id_kntc_idx")
				.on("users_pk1")
				.columns(["book_id"])
				.execute();

			await sql`COMMENT ON INDEX users_pk1_book_id_kntc_idx IS 'abcd'`.execute(
				context.kysely,
			);

			const users = pgTable({
				columns: {
					name: pgText(),
					bookId: pgInteger().renameFrom("book_id"),
				},
				indexes: [pgIndex(["bookId"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			const expected = [
				{
					priority: 1002,
					tableName: "users_pk1",
					type: "dropIndex",
					up: [
						[
							'await db.schema.dropIndex("users_pk1_book_id_kntc_idx").execute();',
						],
					],
					down: [
						[
							"await sql`CREATE INDEX users_pk1_book_id_kntc_idx ON public.users_pk1 USING btree (book_id);COMMENT ON INDEX \"users_pk1_book_id_kntc_idx\" IS 'abcd'`.execute(db);",
						],
					],
				},
				{
					priority: 3010,
					tableName: "users_pk1",
					type: "changeColumnName",
					up: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'renameColumn("book_id", "bookId")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'renameColumn("bookId", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					tableName: "users_pk1",
					type: "createIndex",
					up: [
						[
							'await sql`create index "users_pk1_bookId_kntc_idx" on "users_pk1" ("bookId");COMMENT ON INDEX "users_pk1_bookId_kntc_idx" IS \'760bce2553cad9e0e6cd7f0a18b3e369ac3ab110c7832c2b3f72d94b2e42d5fb\'`.execute(db);',
						],
					],
					down: [
						[
							'await db.schema.dropIndex("users_pk1_bookId_kntc_idx").execute();',
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				database,
				expected,
				down: "reverse",
			});
		});

		test<DbContext>("with indexes not applied", async (context) => {
			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			const users = pgTable({
				columns: {
					name: pgText(),
					bookId: pgInteger().renameFrom("book_id"),
				},
				indexes: [pgIndex(["bookId"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			const expected = [
				{
					priority: 3010,
					tableName: "users_pk1",
					type: "changeColumnName",
					up: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'renameColumn("book_id", "bookId")',
							"execute();",
						],
					],
					down: [
						[
							"await db.schema",
							'alterTable("users_pk1")',
							'renameColumn("bookId", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					tableName: "users_pk1",
					type: "createIndex",
					up: [
						[
							'await sql`create index "users_pk1_bookId_kntc_idx" on "users_pk1" ("bookId");COMMENT ON INDEX "users_pk1_bookId_kntc_idx" IS \'760bce2553cad9e0e6cd7f0a18b3e369ac3ab110c7832c2b3f72d94b2e42d5fb\'`.execute(db);',
						],
					],
					down: [
						[
							'await db.schema.dropIndex("users_pk1_bookId_kntc_idx").execute();',
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				database,
				expected,
				down: "reverse",
			});
		});
	});

	describe("applied in remote", () => {
		test<DbContext>("with unique constraints with previous name applied", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addUniqueConstraint("users_name_kinetic_key", ["name"])
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.renameColumn("name", "fullName")
				.execute();

			const users = pgTable({
				columns: {
					fullName: pgText().renameFrom("name"),
				},
				uniqueConstraints: [pgUnique(["fullName"])],
			});

			const database = pgDatabase({
				tables: {
					users: users,
				},
			});

			await testChangesetAndMigrations({
				context,
				database,
				expected: [],
				down: "reverse",
			});
		});

		test<DbContext>("with unique constraints name applied", async (context) => {
			await context.kysely.schema
				.createTable("users6")
				.addColumn("fullName", "text")
				.addUniqueConstraint("usersh_fullName_kinetic_key", ["fullName"])
				.execute();

			const users = pgTable({
				columns: {
					fullName: pgText().renameFrom("name"),
				},
				uniqueConstraints: [pgUnique(["fullName"])],
			});

			const database = pgDatabase({
				tables: {
					users6: users,
				},
			});

			await testChangesetAndMigrations({
				context,
				database,
				expected: [],
				down: "reverse",
			});
		});

		test<DbContext>("with primary key from previous name applied", async (context) => {
			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.execute();

			await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_name_kinetic_pk PRIMARY KEY (name)`.execute(
				context.kysely,
			);

			await context.kysely.schema
				.alterTable("users_pk1")
				.renameColumn("name", "fullName")
				.execute();

			const users = pgTable({
				columns: {
					fullName: pgText().renameFrom("name"),
				},
				primaryKey: ["fullName"],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			await testChangesetAndMigrations({
				context,
				database,
				expected: [],
				down: "reverse",
			});
		});

		test<DbContext>("with primary key name applied", async (context) => {
			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("fullName", "text")
				.execute();

			await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_fullName_kinetic_pk PRIMARY KEY (\"fullName\")`.execute(
				context.kysely,
			);

			const users = pgTable({
				columns: {
					fullName: pgText().renameFrom("name"),
				},
				primaryKey: ["fullName"],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			await testChangesetAndMigrations({
				context,
				database,
				expected: [],
				down: "reverse",
			});
		});

		test<DbContext>("with foreign key from previous name applied", async (context) => {
			await context.kysely.schema
				.createTable("books_pk1")
				.addColumn("id", "integer")
				.addPrimaryKeyConstraint("books_pk1_id_kinetic_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.addForeignKeyConstraint(
					"users_pk1_book_id_books_pk1_id_kinetic_fk",
					["book_id"],
					"books_pk1",
					["id"],
				)
				.execute();

			await context.kysely.schema
				.alterTable("users_pk1")
				.renameColumn("book_id", "bookId")
				.execute();

			const books = pgTable({
				columns: {
					id: pgInteger(),
				},
				primaryKey: ["id"],
			});

			const users = pgTable({
				columns: {
					name: pgText(),
					bookId: pgInteger().renameFrom("book_id"),
				},
				foreignKeys: [pgForeignKey(["bookId"], books, ["id"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
					books_pk1: books,
				},
			});

			await testChangesetAndMigrations({
				context,
				database,
				expected: [],
				down: "reverse",
			});
		});

		test<DbContext>("with foreign key name applied", async (context) => {
			await context.kysely.schema
				.createTable("books_pk1")
				.addColumn("id", "integer")
				.addPrimaryKeyConstraint("books_pk1_id_kinetic_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("bookId", "integer")
				.addForeignKeyConstraint(
					"users_pk1_book_id_books_pk1_id_kinetic_fk",
					["bookId"],
					"books_pk1",
					["id"],
				)
				.execute();

			const books = pgTable({
				columns: {
					id: pgInteger(),
				},
				primaryKey: ["id"],
			});

			const users = pgTable({
				columns: {
					name: pgText(),
					bookId: pgInteger().renameFrom("book_id"),
				},
				foreignKeys: [pgForeignKey(["bookId"], books, ["id"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
					books_pk1: books,
				},
			});

			await testChangesetAndMigrations({
				context,
				database,
				expected: [],
				down: "reverse",
			});
		});

		test<DbContext>("with indexes from previous name applied", async (context) => {
			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("users_pk1_book_id_kntc_idx")
				.on("users_pk1")
				.columns(["book_id"])
				.execute();

			await sql`COMMENT ON INDEX users_pk1_book_id_kntc_idx IS 'abcd'`.execute(
				context.kysely,
			);

			await context.kysely.schema
				.alterTable("users_pk1")
				.renameColumn("book_id", "bookId")
				.execute();

			const users = pgTable({
				columns: {
					name: pgText(),
					bookId: pgInteger().renameFrom("book_id"),
				},
				indexes: [pgIndex(["bookId"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			const expected = [
				{
					priority: 1002,
					tableName: "users_pk1",
					type: "dropIndex",
					up: [
						[
							'await db.schema.dropIndex("users_pk1_book_id_kntc_idx").execute();',
						],
					],
					down: [
						[
							'await sql`CREATE INDEX users_pk1_book_id_kntc_idx ON public.users_pk1 USING btree ("bookId");COMMENT ON INDEX "users_pk1_book_id_kntc_idx" IS \'abcd\'`.execute(db);',
						],
					],
				},
				{
					priority: 4003,
					tableName: "users_pk1",
					type: "createIndex",
					up: [
						[
							'await sql`create index "users_pk1_bookId_kntc_idx" on "users_pk1" ("bookId");COMMENT ON INDEX "users_pk1_bookId_kntc_idx" IS \'760bce2553cad9e0e6cd7f0a18b3e369ac3ab110c7832c2b3f72d94b2e42d5fb\'`.execute(db);',
						],
					],
					down: [
						[
							'await db.schema.dropIndex("users_pk1_bookId_kntc_idx").execute();',
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				database,
				expected,
				down: "reverse",
			});
		});

		test<DbContext>("with indexes name applied", async (context) => {
			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users_pk1")
				.renameColumn("book_id", "bookId")
				.execute();

			await context.kysely.schema
				.createIndex("users_pk1_bookId_kntc_idx")
				.on("users_pk1")
				.columns(["bookId"])
				.execute();

			await sql`COMMENT ON INDEX "users_pk1_bookId_kntc_idx" IS '760bce2553cad9e0e6cd7f0a18b3e369ac3ab110c7832c2b3f72d94b2e42d5fb'`.execute(
				context.kysely,
			);

			const users = pgTable({
				columns: {
					name: pgText(),
					bookId: pgInteger().renameFrom("book_id"),
				},
				indexes: [pgIndex(["bookId"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			await testChangesetAndMigrations({
				context,
				database,
				expected: [],
				down: "reverse",
			});
		});

		test<DbContext>("change name", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("fullName", "text")
				.execute();

			const database = pgDatabase({
				tables: {
					users: pgTable({
						columns: {
							fullName: pgText().renameFrom("name"),
						},
					}),
				},
			});

			await testChangesetAndMigrations({
				context,
				database,
				expected: [],
				down: "reverse",
			});
		});

		test<DbContext>("change name and type", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("fullName", "varchar")
				.execute();

			const database = pgDatabase({
				tables: {
					users: pgTable({
						columns: {
							fullName: pgVarchar().renameFrom("name"),
						},
					}),
				},
			});

			await testChangesetAndMigrations({
				context,
				database,
				expected: [],
				down: "reverse",
			});
		});
	});
});
