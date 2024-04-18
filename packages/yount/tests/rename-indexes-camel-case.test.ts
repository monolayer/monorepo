/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test, vi } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { table } from "~/database/schema/table/table.js";
import { index, integer, text } from "~/pg.js";
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
	"Rename indexes camel case",
	{ concurrent: false, sequential: true },
	() => {
		beforeEach<DbContext>(async (context) => {
			await setUpContext(context);
		});

		afterEach<DbContext>(async (context) => {
			await teardownContext(context);
			vi.restoreAllMocks();
		});

		test<DbContext>("rename table and add index", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("book_id", "integer")
				.execute();

			const newBooks = table({
				columns: {
					bookId: integer(),
				},
				indexes: [index(["bookId"])],
			});

			const dbSchema = schema({
				tables: {
					newBooks,
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
					priority: 4003,
					tableName: "new_books",
					type: "createIndex",
					up: [
						[
							'await sql`create index "new_books_03cf58de_yount_idx" on "public"."new_books" ("book_id")`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("new_books_03cf58de_yount_idx")',
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
							to: "new_books",
						},
					]);
					mockColumnDiffOnce({
						new_books: [
							{
								from: "id",
								to: "book_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("rename table and add complex index", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("book_id", "integer")
				.addColumn("sample_count", "integer")
				.addColumn("rating_count", "integer")
				.execute();

			const newBooks = table({
				columns: {
					bookId: integer(),
					sampleCount: integer(),
					ratingCount: integer(),
				},
				indexes: [
					index(["bookId", "sampleCount"])
						.where("sampleCount", ">", 20)
						.where(sql.ref("ratingCount"), ">", 5)
						.nullsNotDistinct()
						.using("btree")
						.unique(),
				],
			});

			const dbSchema = schema({
				tables: {
					newBooks,
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
					priority: 4003,
					tableName: "new_books",
					type: "createIndex",
					up: [
						[
							'await sql`create unique index "new_books_d92f1fb8_yount_idx" on "public"."new_books" using btree ("book_id", "sample_count") nulls not distinct where "sample_count" > 20 and "rating_count" > 5`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("new_books_d92f1fb8_yount_idx")',
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
							to: "new_books",
						},
					]);
				},
			});
		});

		test<DbContext>("rename table and add multiple indexes", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("book_id", "integer")
				.addColumn("sample_count", "integer")
				.addColumn("rating_count", "integer")
				.execute();

			const newBooks = table({
				columns: {
					bookId: integer(),
					sampleCount: integer(),
					ratingCount: integer(),
				},
				indexes: [
					index(["bookId"]),
					index(["bookId", "sampleCount"])
						.where("sampleCount", ">", 20)
						.where(sql.ref("ratingCount"), ">", 5)
						.nullsNotDistinct()
						.using("btree")
						.unique(),
				],
			});

			const dbSchema = schema({
				tables: {
					newBooks,
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
					priority: 4003,
					tableName: "new_books",
					type: "createIndex",
					up: [
						[
							'await sql`create index "new_books_03cf58de_yount_idx" on "public"."new_books" ("book_id")`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("new_books_03cf58de_yount_idx")',
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					tableName: "new_books",
					type: "createIndex",
					up: [
						[
							'await sql`create unique index "new_books_d92f1fb8_yount_idx" on "public"."new_books" using btree ("book_id", "sample_count") nulls not distinct where "sample_count" > 20 and "rating_count" > 5`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("new_books_d92f1fb8_yount_idx")',
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
							to: "new_books",
						},
					]);
				},
			});
		});

		test<DbContext>("rename table with index", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("books_0c84fd75_yount_idx")
				.on("books")
				.columns(["id"])
				.execute();

			const newBooks = table({
				columns: {
					id: integer(),
				},
				indexes: [index(["id"])],
			});

			const dbSchema = schema({
				tables: {
					newBooks,
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
					priority: 5001,
					tableName: "new_books",
					type: "changeIndex",
					up: [
						[
							"await sql`ALTER INDEX books_0c84fd75_yount_idx RENAME TO new_books_0c84fd75_yount_idx`",
							"execute(db);",
						],
					],
					down: [
						[
							"await sql`ALTER INDEX new_books_0c84fd75_yount_idx RENAME TO books_0c84fd75_yount_idx`",
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
							to: "new_books",
						},
					]);
				},
			});
		});

		test<DbContext>("rename table with complex index", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("sample_count", "integer")
				.addColumn("rating_count", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("books_07ceb5ca_yount_idx")
				.on("books")
				.columns(["id", "sample_count"])
				.where("sample_count", ">", 20)
				.where(sql.ref("rating_count"), ">", 5)
				.nullsNotDistinct()
				.unique()
				.execute();

			const newBooks = table({
				columns: {
					id: integer(),
					sampleCount: integer(),
					ratingCount: integer(),
				},
				indexes: [
					index(["id", "sampleCount"])
						.where("sampleCount", ">", 20)
						.where(sql.ref("ratingCount"), ">", 5)
						.nullsNotDistinct()
						.using("btree")
						.unique(),
				],
			});

			const dbSchema = schema({
				tables: {
					newBooks,
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
					priority: 5001,
					tableName: "new_books",
					type: "changeIndex",
					up: [
						[
							"await sql`ALTER INDEX books_07ceb5ca_yount_idx RENAME TO new_books_07ceb5ca_yount_idx`",
							"execute(db);",
						],
					],
					down: [
						[
							"await sql`ALTER INDEX new_books_07ceb5ca_yount_idx RENAME TO books_07ceb5ca_yount_idx`",
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
							to: "new_books",
						},
					]);
				},
			});
		});

		test<DbContext>("rename table and column with index", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("books_0c84fd75_yount_idx")
				.on("books")
				.columns(["id"])
				.execute();

			const newBooks = table({
				columns: {
					bookId: integer(),
				},
				indexes: [index(["bookId"])],
			});

			const dbSchema = schema({
				tables: {
					newBooks,
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
							'renameColumn("id", "book_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameColumn("book_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 5001,
					tableName: "new_books",
					type: "changeIndex",
					up: [
						[
							"await sql`ALTER INDEX books_0c84fd75_yount_idx RENAME TO new_books_03cf58de_yount_idx`",
							"execute(db);",
						],
					],
					down: [
						[
							"await sql`ALTER INDEX new_books_03cf58de_yount_idx RENAME TO books_0c84fd75_yount_idx`",
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
							to: "new_books",
						},
					]);
					mockColumnDiffOnce({
						new_books: [
							{
								from: "id",
								to: "book_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("rename table and column with complex index", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("sample_count", "integer")
				.addColumn("rating_count", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("books_07ceb5ca_yount_idx")
				.on("books")
				.columns(["id", "sample_count"])
				.where("sample_count", ">", 20)
				.where(sql.ref("rating_count"), ">", 5)
				.nullsNotDistinct()
				.unique()
				.execute();

			const newBooks = table({
				columns: {
					id: integer(),
					selectionCount: integer(),
					gradingCount: integer(),
				},
				indexes: [
					index(["id", "selectionCount"])
						.where("selectionCount", ">", 20)
						.where(sql.ref("gradingCount"), ">", 5)
						.nullsNotDistinct()
						.using("btree")
						.unique(),
				],
			});

			const dbSchema = schema({
				tables: {
					newBooks,
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
							'renameColumn("rating_count", "grading_count")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameColumn("grading_count", "rating_count")',
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
							'renameColumn("sample_count", "selection_count")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameColumn("selection_count", "sample_count")',
							"execute();",
						],
					],
				},
				{
					priority: 5001,
					tableName: "new_books",
					type: "changeIndex",
					up: [
						[
							"await sql`ALTER INDEX books_07ceb5ca_yount_idx RENAME TO new_books_a2402dca_yount_idx`",
							"execute(db);",
						],
					],
					down: [
						[
							"await sql`ALTER INDEX new_books_a2402dca_yount_idx RENAME TO books_07ceb5ca_yount_idx`",
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
							to: "new_books",
						},
					]);
					mockColumnDiffOnce({
						new_books: [
							{
								from: "sample_count",
								to: "selection_count",
							},
							{
								from: "rating_count",
								to: "grading_count",
							},
						],
					});
				},
			});
		});

		test<DbContext>("rename table and drop index", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("books_0c84fd75_yount_idx")
				.on("books")
				.columns(["id"])
				.execute();

			const newBooks = table({
				columns: {
					id: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					newBooks,
				},
			});

			const expected = [
				{
					priority: 800,
					tableName: "books",
					type: "dropIndex",
					up: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_0c84fd75_yount_idx")',
							"execute();",
						],
					],
					down: [
						[
							"await sql`CREATE INDEX books_0c84fd75_yount_idx ON public.books USING btree (id)`",
							"execute(db);",
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
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "new_books",
						},
					]);
				},
			});
		});

		test<DbContext>("rename table and drop complex index", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("sample_count", "integer")
				.addColumn("rating_count", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("books_07ceb5ca_yount_idx")
				.on("books")
				.columns(["id", "sample_count"])
				.where("sample_count", ">", 20)
				.where(sql.ref("rating_count"), ">", 5)
				.nullsNotDistinct()
				.unique()
				.execute();

			const newBooks = table({
				columns: {
					id: integer(),
					sampleCount: integer(),
					ratingCount: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					newBooks,
				},
			});

			const expected = [
				{
					priority: 800,
					tableName: "books",
					type: "dropIndex",
					up: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_07ceb5ca_yount_idx")',
							"execute();",
						],
					],
					down: [
						[
							"await sql`CREATE UNIQUE INDEX books_07ceb5ca_yount_idx ON public.books USING btree (id, sample_count) NULLS NOT DISTINCT WHERE ((sample_count > 20) AND (rating_count > 5))`",
							"execute(db);",
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
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected: expected,
				down: "same",
				mock: () => {
					mockTableDiffOnce([
						{
							from: "books",
							to: "new_books",
						},
					]);
				},
			});
		});

		test<DbContext>("rename column and add index", async (context) => {
			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			const users = table({
				columns: {
					name: text(),
					documentId: integer(),
				},
				indexes: [index(["documentId"])],
			});

			const dbSchema = schema({
				tables: {
					users_pk1: users,
				},
			});

			const expected = [
				{
					priority: 3000,
					tableName: "users_pk1",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'renameColumn("document_id", "book_id")',
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
							'await sql`create index "users_pk1_14f4de9c_yount_idx" on "public"."users_pk1" ("document_id")`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pk1_14f4de9c_yount_idx")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected,
				down: "same",
				mock: () => {
					mockColumnDiffOnce({
						users_pk1: [
							{
								from: "book_id",
								to: "document_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("rename column and add complex index", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("samples", "integer")
				.addColumn("ratings", "integer")
				.execute();

			const books = table({
				columns: {
					id: integer(),
					testSamples: integer(),
					ratings: integer(),
				},
				indexes: [
					index(["id", "testSamples"])
						.where("testSamples", ">", 20)
						.where(sql.ref("ratings"), ">", 5)
						.nullsNotDistinct()
						.using("btree")
						.unique(),
				],
			});

			const dbSchema = schema({
				tables: {
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
							'renameColumn("samples", "test_samples")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("test_samples", "samples")',
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					tableName: "books",
					type: "createIndex",
					up: [
						[
							'await sql`create unique index "books_70e67ee1_yount_idx" on "public"."books" using btree ("id", "test_samples") nulls not distinct where "test_samples" > 20 and "ratings" > 5`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_70e67ee1_yount_idx")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
				expected,
				down: "same",
				mock: () => {
					mockColumnDiffOnce({
						books: [
							{
								from: "samples",
								to: "test_samples",
							},
						],
					});
				},
			});
		});

		test<DbContext>("rename column with index", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("books_0c84fd75_yount_idx")
				.on("books")
				.columns(["id"])
				.execute();

			const books = table({
				columns: {
					bookId: integer(),
				},
				indexes: [index(["bookId"])],
			});

			const dbSchema = schema({
				tables: {
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
					priority: 5001,
					tableName: "books",
					type: "changeIndex",
					up: [
						[
							"await sql`ALTER INDEX books_0c84fd75_yount_idx RENAME TO books_03cf58de_yount_idx`",
							"execute(db);",
						],
					],
					down: [
						[
							"await sql`ALTER INDEX books_03cf58de_yount_idx RENAME TO books_0c84fd75_yount_idx`",
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
					});
				},
			});
		});

		test<DbContext>("rename columns with complex index", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("samples", "integer")
				.addColumn("ratings", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("books_6b9be986_yount_idx")
				.on("books")
				.columns(["id", "samples"])
				.where("samples", ">", 20)
				.where(sql.ref("ratings"), ">", 5)
				.nullsNotDistinct()
				.unique()
				.execute();

			const books = table({
				columns: {
					bookId: integer(),
					testSamples: integer(),
					ratings: integer(),
				},
				indexes: [
					index(["bookId", "testSamples"])
						.where("testSamples", ">", 20)
						.where(sql.ref("ratings"), ">", 5)
						.nullsNotDistinct()
						.using("btree")
						.unique(),
				],
			});

			const dbSchema = schema({
				tables: {
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
							'renameColumn("samples", "test_samples")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("test_samples", "samples")',
							"execute();",
						],
					],
				},
				{
					priority: 5001,
					tableName: "books",
					type: "changeIndex",
					up: [
						[
							"await sql`ALTER INDEX books_6b9be986_yount_idx RENAME TO books_e92fba06_yount_idx`",
							"execute(db);",
						],
					],
					down: [
						[
							"await sql`ALTER INDEX books_e92fba06_yount_idx RENAME TO books_6b9be986_yount_idx`",
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
								from: "samples",
								to: "test_samples",
							},
							{
								from: "id",
								to: "book_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("rename column and drop index", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("books_0c84fd75_yount_idx")
				.on("books")
				.columns(["id"])
				.execute();

			const books = table({
				columns: {
					bookId: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					books,
				},
			});

			const expected = [
				{
					priority: 800,
					tableName: "books",
					type: "dropIndex",
					up: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_0c84fd75_yount_idx")',
							"execute();",
						],
					],
					down: [
						[
							"await sql`CREATE INDEX books_0c84fd75_yount_idx ON public.books USING btree (id)`",
							"execute(db);",
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
					});
				},
			});
		});

		test<DbContext>("rename columns and drop complex index", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("samples", "integer")
				.addColumn("ratings", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("books_6b9be986_yount_idx")
				.on("books")
				.columns(["id", "samples"])
				.where("samples", ">", 20)
				.where(sql.ref("ratings"), ">", 5)
				.nullsNotDistinct()
				.unique()
				.execute();

			const books = table({
				columns: {
					bookId: integer(),
					testSamples: integer(),
					ratings: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					books,
				},
			});

			const expected = [
				{
					priority: 800,
					tableName: "books",
					type: "dropIndex",
					up: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_6b9be986_yount_idx")',
							"execute();",
						],
					],
					down: [
						[
							"await sql`CREATE UNIQUE INDEX books_6b9be986_yount_idx ON public.books USING btree (id, samples) NULLS NOT DISTINCT WHERE ((samples > 20) AND (ratings > 5))`",
							"execute(db);",
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
							'renameColumn("samples", "test_samples")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("test_samples", "samples")',
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
					mockColumnDiffOnce({
						books: [
							{
								from: "samples",
								to: "test_samples",
							},
							{
								from: "id",
								to: "book_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("rename columns and drop multiple indexes", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("samples", "integer")
				.addColumn("ratings", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("books_0c84fd75_yount_idx")
				.on("books")
				.columns(["id"])
				.execute();

			await context.kysely.schema
				.createIndex("books_6b9be986_yount_idx")
				.on("books")
				.columns(["id", "samples"])
				.where("samples", ">", 20)
				.where(sql.ref("ratings"), ">", 5)
				.nullsNotDistinct()
				.unique()
				.execute();

			const books = table({
				columns: {
					bookId: integer(),
					testSamples: integer(),
					ratings: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					books,
				},
			});

			const expected = [
				{
					priority: 800,
					tableName: "books",
					type: "dropIndex",
					up: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_0c84fd75_yount_idx")',
							"execute();",
						],
					],
					down: [
						[
							"await sql`CREATE INDEX books_0c84fd75_yount_idx ON public.books USING btree (id)`",
							"execute(db);",
						],
					],
				},
				{
					priority: 800,
					tableName: "books",
					type: "dropIndex",
					up: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_6b9be986_yount_idx")',
							"execute();",
						],
					],
					down: [
						[
							"await sql`CREATE UNIQUE INDEX books_6b9be986_yount_idx ON public.books USING btree (id, samples) NULLS NOT DISTINCT WHERE ((samples > 20) AND (ratings > 5))`",
							"execute(db);",
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
							'renameColumn("samples", "test_samples")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("test_samples", "samples")',
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
					mockColumnDiffOnce({
						books: [
							{
								from: "samples",
								to: "test_samples",
							},
							{
								from: "id",
								to: "book_id",
							},
						],
					});
				},
			});
		});
	},
);
