/* eslint-disable max-lines */
import { afterEach, beforeEach, describe, test, vi } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { table } from "~/database/schema/table/table.js";
import { foreignKey, integer, primaryKey } from "~/pg.js";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "~tests/__setup__/helpers/test-context.js";
import {
	mockColumnDiffOnce,
	mockTableDiffOnce,
} from "~tests/__setup__/setup.js";

describe(
	"Rename foreign key camel case",
	{ concurrent: false, sequential: true },
	() => {
		beforeEach<DbContext>(async (context) => {
			await setUpContext(context);
		});

		afterEach<DbContext>(async (context) => {
			await teardownContext(context);
			vi.restoreAllMocks();
		});

		test<DbContext>("child table", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					bookId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["bookId"], books, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					userBooks,
					books,
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
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_c02e3d7d_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "users",
							to: "user_books",
						},
					]);
				},
			});
		});

		test<DbContext>("parent table", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					bookId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["bookId"], booksAndDocuments, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					booksAndDocuments,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "users",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_0ea2ca34_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_0ea2ca34_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "books_and_documents",
						},
					]);
				},
			});
		});

		test<DbContext>("parent table, child table", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					bookId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["bookId"], booksAndDocuments, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					userBooks,
					booksAndDocuments,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 900,
					tableName: "users",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_0ea2ca34_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_0ea2ca34_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "books_and_documents",
						},
						{
							from: "users",
							to: "user_books",
						},
					]);
				},
			});
		});

		test<DbContext>("parent table, parent column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					documentId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["documentId"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					bookId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["bookId"], booksAndDocuments, ["documentId"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					booksAndDocuments,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books_and_documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("document_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "users",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_53048e1b_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_53048e1b_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "books_and_documents",
						},
					]);
					mockColumnDiffOnce({
						books_and_documents: [
							{
								from: "id",
								to: "document_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("parent table, child column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					documentId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["documentId"], booksAndDocuments, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					booksAndDocuments,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "users",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_216959d6_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_216959d6_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "books_and_documents",
						},
					]);
					mockColumnDiffOnce({
						users: [
							{
								from: "book_id",
								to: "document_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("child table, child column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					documentId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["documentId"], books, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					userBooks,
					books,
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
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "user_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_12f9128c_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_12f9128c_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "users",
							to: "user_books",
						},
					]);
					mockColumnDiffOnce({
						user_books: [
							{
								from: "book_id",
								to: "document_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("child table, parent column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					bookId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					bookId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["bookId"], books, ["bookId"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					userBooks,
					books,
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
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("id", "book_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("book_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_c3276eac_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_c3276eac_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "users",
							to: "user_books",
						},
					]);
					mockColumnDiffOnce({
						books: [
							{
								from: "id",
								to: "book_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("child column, parent column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					bookId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					documentId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["documentId"], books, ["bookId"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					books,
				},
			});

			const expected = [
				{
					priority: 3000,
					tableName: "books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("id", "book_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("book_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "users",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_273ade4f_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_273ade4f_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockColumnDiffOnce({
						books: [
							{
								from: "id",
								to: "book_id",
							},
						],
						users: [
							{
								from: "book_id",
								to: "document_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("child table, parent table, child column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					documentId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["documentId"], booksAndDocuments, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
					userBooks,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 900,
					tableName: "users",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "user_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_216959d6_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_216959d6_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "books_and_documents",
						},
						{
							from: "users",
							to: "user_books",
						},
					]);
					mockColumnDiffOnce({
						user_books: [
							{
								from: "book_id",
								to: "document_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("child table, parent table, parent column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					bookId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					bookId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["bookId"], booksAndDocuments, ["bookId"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
					userBooks,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 900,
					tableName: "users",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books_and_documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("id", "book_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("book_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_bf145a2d_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_bf145a2d_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "books_and_documents",
						},
						{
							from: "users",
							to: "user_books",
						},
					]);
					mockColumnDiffOnce({
						books_and_documents: [
							{
								from: "id",
								to: "book_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("parent table, parent column, child column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					bookId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					documentId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["documentId"], booksAndDocuments, ["bookId"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books_and_documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("id", "book_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("book_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "users",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_9e7627f3_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_9e7627f3_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "books_and_documents",
						},
					]);
					mockColumnDiffOnce({
						books_and_documents: [
							{
								from: "id",
								to: "book_id",
							},
						],
						users: [
							{
								from: "book_id",
								to: "document_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("child table, child column, parent column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					documentId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["documentId"], booksAndDocuments, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
					userBooks,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 900,
					tableName: "users",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "user_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_216959d6_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_216959d6_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "users",
							to: "user_books",
						},
						{
							from: "books",
							to: "books_and_documents",
						},
					]);
					mockColumnDiffOnce({
						user_books: [
							{
								from: "book_id",
								to: "document_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("child table, parent table, parent column, child column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					bookId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					document_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["document_id"], booksAndDocuments, ["bookId"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
					userBooks,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 900,
					tableName: "users",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books_and_documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("id", "book_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("book_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "user_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_9e7627f3_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_9e7627f3_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "users",
							to: "user_books",
						},
						{
							from: "books",
							to: "books_and_documents",
						},
					]);
					mockColumnDiffOnce({
						books_and_documents: [
							{
								from: "id",
								to: "book_id",
							},
						],
						user_books: [
							{
								from: "book_id",
								to: "document_id",
							},
						],
					});
				},
			});
		});
	},
);

describe(
	"Rename composite foreign key camel case",
	{ concurrent: false, sequential: true },
	() => {
		beforeEach<DbContext>(async (context) => {
			await setUpContext(context);
		});

		afterEach<DbContext>(async (context) => {
			await teardownContext(context);
			vi.restoreAllMocks();
		});

		test<DbContext>("child table", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.addColumn("book_location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id", "book_location_id"],
					"books",
					["id", "location_id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					id: integer(),
					locationId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "locationId"]),
				},
			});

			const bookUsers = table({
				columns: {
					id: integer(),
					bookId: integer(),
					bookLocationId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["bookId", "bookLocationId"], books, [
							"id",
							"locationId",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					bookUsers,
					books,
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
							'renameTo("book_users")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("book_users")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "book_users",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."book_users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO book_users_6de35d86_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."book_users" RENAME CONSTRAINT book_users_6de35d86_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "users",
							to: "book_users",
						},
					]);
				},
			});
		});

		test<DbContext>("parent table", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.addColumn("book_location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id", "book_location_id"],
					"books",
					["id", "location_id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
					locationId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "locationId"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					bookId: integer(),
					bookLocationId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["bookId", "bookLocationId"], booksAndDocuments, [
							"id",
							"locationId",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					booksAndDocuments,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "users",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_462ff70f_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_462ff70f_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "books_and_documents",
						},
					]);
				},
			});
		});

		test<DbContext>("parent table, child table", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.addColumn("book_location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id", "book_location_id"],
					"books",
					["id", "location_id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
					locationId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "locationId"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					bookId: integer(),
					bookLocationId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["bookId", "bookLocationId"], booksAndDocuments, [
							"id",
							"locationId",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					userBooks,
					booksAndDocuments,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 900,
					tableName: "users",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_462ff70f_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_462ff70f_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "books_and_documents",
						},
						{
							from: "users",
							to: "user_books",
						},
					]);
				},
			});
		});

		test<DbContext>("parent table, parent column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.addColumn("book_location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id", "book_location_id"],
					"books",
					["id", "location_id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					documentId: integer(),
					newLocationId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["documentId", "newLocationId"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					bookId: integer(),
					bookLocationId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["bookId", "bookLocationId"], booksAndDocuments, [
							"documentId",
							"newLocationId",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					booksAndDocuments,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books_and_documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("document_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books_and_documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("location_id", "new_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("new_location_id", "location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "users",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_43da5779_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_43da5779_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "books_and_documents",
						},
					]);
					mockColumnDiffOnce({
						books_and_documents: [
							{
								from: "id",
								to: "document_id",
							},
							{
								from: "location_id",
								to: "new_location_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("parent table, child column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.addColumn("book_location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id", "book_location_id"],
					"books",
					["id", "location_id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
					locationId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "locationId"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					documentId: integer(),
					documentLocationId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(
							["documentId", "documentLocationId"],
							booksAndDocuments,
							["id", "locationId"],
						)
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					booksAndDocuments,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("book_location_id", "document_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("document_location_id", "book_location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "users",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_a8017e4b_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_a8017e4b_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "books_and_documents",
						},
					]);
					mockColumnDiffOnce({
						users: [
							{
								from: "book_id",
								to: "document_id",
							},
							{
								from: "book_location_id",
								to: "document_location_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("child table, child column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.addColumn("book_location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id", "book_location_id"],
					"books",
					["id", "location_id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					id: integer(),
					locationId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "locationId"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					documentId: integer(),
					documentLocationId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["documentId", "documentLocationId"], books, [
							"id",
							"locationId",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					userBooks,
					books,
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
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "user_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "user_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("book_location_id", "document_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("document_location_id", "book_location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_73ffb2a8_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_73ffb2a8_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "users",
							to: "user_books",
						},
					]);
					mockColumnDiffOnce({
						user_books: [
							{
								from: "book_id",
								to: "document_id",
							},
							{
								from: "book_location_id",
								to: "document_location_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("child table, parent column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.addColumn("book_location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id", "book_location_id"],
					"books",
					["id", "location_id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					bookId: integer(),
					newLocationId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId", "newLocationId"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					bookId: integer(),
					bookLocationId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["bookId", "bookLocationId"], books, [
							"bookId",
							"newLocationId",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					userBooks,
					books,
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
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("id", "book_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("book_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("location_id", "new_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("new_location_id", "location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_8e7302ef_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_8e7302ef_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "users",
							to: "user_books",
						},
					]);
					mockColumnDiffOnce({
						books: [
							{
								from: "id",
								to: "book_id",
							},
							{
								from: "location_id",
								to: "new_location_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("child column, parent column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.addColumn("book_location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id", "book_location_id"],
					"books",
					["id", "location_id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					bookId: integer(),
					newLocationId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId", "newLocationId"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					documentId: integer(),
					documentLocationId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["documentId", "documentLocationId"], books, [
							"bookId",
							"newLocationId",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					books,
				},
			});

			const expected = [
				{
					priority: 3000,
					tableName: "books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("id", "book_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("book_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("location_id", "new_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("new_location_id", "location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("book_location_id", "document_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("document_location_id", "book_location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "users",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_998f2e77_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_998f2e77_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockColumnDiffOnce({
						books: [
							{
								from: "id",
								to: "book_id",
							},
							{
								from: "location_id",
								to: "new_location_id",
							},
						],
						users: [
							{
								from: "book_id",
								to: "document_id",
							},
							{
								from: "book_location_id",
								to: "document_location_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("child table, parent table, child column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.addColumn("book_location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id", "book_location_id"],
					"books",
					["id", "location_id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
					locationId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "locationId"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					documentId: integer(),
					documentLocationId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(
							["documentId", "documentLocationId"],
							booksAndDocuments,
							["id", "locationId"],
						)
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
					userBooks,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 900,
					tableName: "users",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "user_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "user_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("book_location_id", "document_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("document_location_id", "book_location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_a8017e4b_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_a8017e4b_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "books_and_documents",
						},
						{
							from: "users",
							to: "user_books",
						},
					]);
					mockColumnDiffOnce({
						user_books: [
							{
								from: "book_id",
								to: "document_id",
							},
							{
								from: "book_location_id",
								to: "document_location_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("child table, parent table, parent column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.addColumn("book_location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id", "book_location_id"],
					"books",
					["id", "location_id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					bookId: integer(),
					newLocationId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId", "newLocationId"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					bookId: integer(),
					bookLocationId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["bookId", "bookLocationId"], booksAndDocuments, [
							"bookId",
							"newLocationId",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
					userBooks,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 900,
					tableName: "users",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books_and_documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("id", "book_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("book_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books_and_documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("location_id", "new_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("new_location_id", "location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_9ffb5f4c_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_9ffb5f4c_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "books_and_documents",
						},
						{
							from: "users",
							to: "user_books",
						},
					]);
					mockColumnDiffOnce({
						books_and_documents: [
							{
								from: "id",
								to: "book_id",
							},
							{
								from: "location_id",
								to: "new_location_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("parent table, parent column, child column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.addColumn("book_location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id", "book_location_id"],
					"books",
					["id", "location_id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					bookId: integer(),
					newLocationId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId", "newLocationId"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					documentId: integer(),
					documentLocationId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(
							["documentId", "documentLocationId"],
							booksAndDocuments,
							["bookId", "newLocationId"],
						)
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books_and_documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("id", "book_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("book_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books_and_documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("location_id", "new_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("new_location_id", "location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("book_location_id", "document_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("document_location_id", "book_location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "users",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_32ae36b2_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_32ae36b2_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "books_and_documents",
						},
					]);
					mockColumnDiffOnce({
						books_and_documents: [
							{
								from: "id",
								to: "book_id",
							},
							{
								from: "location_id",
								to: "new_location_id",
							},
						],
						users: [
							{
								from: "book_id",
								to: "document_id",
							},
							{
								from: "book_location_id",
								to: "document_location_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("child table, child column, parent column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.addColumn("book_location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id", "book_location_id"],
					"books",
					["id", "location_id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
					locationId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "locationId"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					documentId: integer(),
					documentLocationId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(
							["documentId", "documentLocationId"],
							booksAndDocuments,
							["id", "locationId"],
						)
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
					userBooks,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 900,
					tableName: "users",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "user_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "user_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("book_location_id", "document_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("document_location_id", "book_location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_a8017e4b_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_a8017e4b_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "users",
							to: "user_books",
						},
						{
							from: "books",
							to: "books_and_documents",
						},
					]);
					mockColumnDiffOnce({
						user_books: [
							{
								from: "book_id",
								to: "document_id",
							},
							{
								from: "book_location_id",
								to: "document_location_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("child table, parent table, parent column, child column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("book_id", "integer")
				.addColumn("book_location_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_c02e3d7d_yount_fk",
					["book_id", "book_location_id"],
					"books",
					["id", "location_id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const booksAndDocuments = table({
				columns: {
					bookId: integer(),
					newLocationId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId", "newLocationId"]),
				},
			});

			const userBooks = table({
				columns: {
					id: integer(),
					documentId: integer(),
					newBookLocationId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["documentId", "newBookLocationId"], booksAndDocuments, [
							"bookId",
							"newLocationId",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
					userBooks,
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
							'renameTo("books_and_documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 900,
					tableName: "users",
					type: "changeTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameTo("user_books")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books_and_documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("id", "book_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("book_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "books_and_documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("location_id", "new_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("new_location_id", "location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "user_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "user_books",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("book_location_id", "new_book_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("user_books")',
							'renameColumn("new_book_location_id", "book_location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "user_books",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_2c6c4875_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_2c6c4875_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "users",
							to: "user_books",
						},
						{
							from: "books",
							to: "books_and_documents",
						},
					]);
					mockColumnDiffOnce({
						books_and_documents: [
							{
								from: "id",
								to: "book_id",
							},
							{
								from: "location_id",
								to: "new_location_id",
							},
						],
						user_books: [
							{
								from: "book_id",
								to: "document_id",
							},
							{
								from: "book_location_id",
								to: "new_book_location_id",
							},
						],
					});
				},
			});
		});
	},
);
