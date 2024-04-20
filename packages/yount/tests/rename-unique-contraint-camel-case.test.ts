/* eslint-disable max-lines */
import { afterEach, beforeEach, describe, test, vi } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { table } from "~/database/schema/table/table.js";
import { integer, unique } from "~/pg.js";
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
	"Rename unique constraint camel case",
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

		test<DbContext>("table", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
				},
				constraints: {
					unique: [unique(["id"])],
				},
			});

			const dbSchema = schema({
				tables: {
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

		test<DbContext>("table and column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
				.execute();

			const booksAndDocuments = table({
				columns: {
					bookId: integer(),
				},
				constraints: {
					unique: [unique(["bookId"])],
				},
			});

			const dbSchema = schema({
				tables: {
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
					tableName: "books_and_documents",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_acdd8fa3_yount_key TO books_and_documents_b663df16_yount_key`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_and_documents_b663df16_yount_key TO books_acdd8fa3_yount_key`',
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
					});
				},
			});
		});

		test<DbContext>("table and add unique", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
				},
				constraints: {
					unique: [unique(["id"])],
				},
			});

			const dbSchema = schema({
				tables: {
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
					priority: 4010,
					tableName: "books_and_documents",
					type: "createConstraint",
					up: [
						[
							`await db.withSchema("public").schema`,
							`alterTable("books_and_documents")`,
							`addUniqueConstraint("books_and_documents_acdd8fa3_yount_key", ["id"])`,
							`execute();`,
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'dropConstraint("books_and_documents_acdd8fa3_yount_key")',
							"execute();",
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

		test<DbContext>("table column and add check", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			const booksAndDocuments = table({
				columns: {
					bookId: integer(),
				},
				constraints: {
					unique: [unique(["bookId"])],
				},
			});

			const dbSchema = schema({
				tables: {
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
					priority: 4010,
					tableName: "books_and_documents",
					type: "createConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'addUniqueConstraint("books_and_documents_b663df16_yount_key", ["book_id"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'dropConstraint("books_and_documents_b663df16_yount_key")',
							"execute();",
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
					});
				},
			});
		});

		test<DbContext>("table and drop unique", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
				},
			});

			const expected = [
				{
					priority: 810,
					tableName: "books",
					type: "dropConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_acdd8fa3_yount_key")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])',
							"execute();",
						],
					],
				},
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

		test<DbContext>("table and drop some unique", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("count", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_d0c857aa_yount_key", ["count"])
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
					count: integer(),
				},
				constraints: {
					unique: [unique(["count"])],
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
				},
			});

			const expected = [
				{
					priority: 810,
					tableName: "books",
					type: "dropConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_acdd8fa3_yount_key")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])',
							"execute();",
						],
					],
				},
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

		test<DbContext>("table and drop all unique", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("count", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_d0c857aa_yount_key", ["count"])
				.execute();

			const booksAndDocuments = table({
				columns: {
					id: integer(),
					count: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
				},
			});

			const expected = [
				{
					priority: 810,
					tableName: "books",
					type: "dropConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_acdd8fa3_yount_key")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])',
							"execute();",
						],
					],
				},
				{
					priority: 810,
					tableName: "books",
					type: "dropConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_d0c857aa_yount_key")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addUniqueConstraint("books_d0c857aa_yount_key", ["count"])',
							"execute();",
						],
					],
				},
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

		test<DbContext>("table, column, and drop unique", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
				.execute();

			const booksAndDocuments = table({
				columns: {
					bookId: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
				},
			});

			const expected = [
				{
					priority: 810,
					tableName: "books",
					type: "dropConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_acdd8fa3_yount_key")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])',
							"execute();",
						],
					],
				},
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
					});
				},
			});
		});

		test<DbContext>("table, column, and drop some unique", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("count", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_d0c857aa_yount_key", ["count"])
				.execute();

			const booksAndDocuments = table({
				columns: {
					bookId: integer(),
					bookCount: integer(),
				},
				constraints: {
					unique: [unique(["bookCount"])],
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
				},
			});

			const expected = [
				{
					priority: 810,
					tableName: "books",
					type: "dropConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_acdd8fa3_yount_key")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])',
							"execute();",
						],
					],
				},
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
							'renameColumn("count", "book_count")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("book_count", "count")',
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
					tableName: "books_and_documents",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_d0c857aa_yount_key TO books_and_documents_f2bf9399_yount_key`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_and_documents_f2bf9399_yount_key TO books_d0c857aa_yount_key`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: {
					schemas: [dbSchema],
					camelCasePlugin: { enabled: true },
				},
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
								from: "count",
								to: "book_count",
							},
						],
					});
				},
			});
		});

		test<DbContext>("table, column, and drop all unique", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("count", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_d0c857aa_yount_key", ["count"])
				.execute();

			const booksAndDocuments = table({
				columns: {
					bookId: integer(),
					bookCount: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					booksAndDocuments,
				},
			});

			const expected = [
				{
					priority: 810,
					tableName: "books",
					type: "dropConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_acdd8fa3_yount_key")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])',
							"execute();",
						],
					],
				},
				{
					priority: 810,
					tableName: "books",
					type: "dropConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_d0c857aa_yount_key")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addUniqueConstraint("books_d0c857aa_yount_key", ["count"])',
							"execute();",
						],
					],
				},
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
							'renameColumn("count", "book_count")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books_and_documents")',
							'renameColumn("book_count", "count")',
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
			];

			await testChangesetAndMigrations({
				context,
				connector: {
					schemas: [dbSchema],
					camelCasePlugin: { enabled: true },
				},
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
								from: "count",
								to: "book_count",
							},
						],
					});
				},
			});
		});
	},
);
