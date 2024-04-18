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

describe("Rename indexes", { concurrent: false, sequential: true }, () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
		vi.restoreAllMocks();
	});

	test.skip<DbContext>("gen test", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("sampleCount", "integer")
			.addColumn("ratingCount", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_07ceb5ca_yount_idx")
			.on("books")
			.columns(["id", "sampleCount"])
			.where("sampleCount", ">", 20)
			.where(sql.ref("ratingCount"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const books = table({
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
				books,
			},
		});

		const expected: string[] = [];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema], camelCasePlugin: { enabled: true } },
			expected: expected,
			down: "same",
			mock: () => {
				// mockTableDiffOnce([
				// 	{
				// 		from: "books",
				// 		to: "new_books",
				// 	},
				// ]);
				// mockColumnDiffOnce({
				// 	new_books: [
				// 		{
				// 			from: "sample_count",
				// 			to: "selection_count",
				// 		},
				// 		{
				// 			from: "rating_count",
				// 			to: "grading_count",
				// 		},
				// 	],
				// });
			},
		});
	});

	test<DbContext>("rename table and add index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
			indexes: [index(["id"])],
		});

		const dbSchema = schema({
			tables: {
				publications,
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
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "publications",
				type: "createIndex",
				up: [
					[
						'await sql`create index "publications_0c84fd75_yount_idx" on "public"."publications" ("id")`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_0c84fd75_yount_idx")',
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
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("rename table and add complex index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		const publications = table({
			columns: {
				id: integer(),
				samples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["id", "samples"])
					.where("samples", ">", 20)
					.where(sql.ref("ratings"), ">", 5)
					.nullsNotDistinct()
					.using("btree")
					.unique(),
			],
		});

		const dbSchema = schema({
			tables: {
				publications,
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
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "publications",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "publications_6b9be986_yount_idx" on "public"."publications" using btree ("id", "samples") nulls not distinct where "samples" > 20 and "ratings" > 5`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_6b9be986_yount_idx")',
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
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("rename table and add multiple indexes", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		const publications = table({
			columns: {
				id: integer(),
				samples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["id"]),
				index(["id", "samples"])
					.where("samples", ">", 20)
					.where(sql.ref("ratings"), ">", 5)
					.nullsNotDistinct()
					.using("btree")
					.unique(),
			],
		});

		const dbSchema = schema({
			tables: {
				publications,
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
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "publications",
				type: "createIndex",
				up: [
					[
						'await sql`create index "publications_0c84fd75_yount_idx" on "public"."publications" ("id")`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_0c84fd75_yount_idx")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "publications",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "publications_6b9be986_yount_idx" on "public"."publications" using btree ("id", "samples") nulls not distinct where "samples" > 20 and "ratings" > 5`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_6b9be986_yount_idx")',
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
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
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

		const publications = table({
			columns: {
				id: integer(),
			},
			indexes: [index(["id"])],
		});

		const dbSchema = schema({
			tables: {
				publications,
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
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 5001,
				tableName: "publications",
				type: "changeIndex",
				up: [
					[
						"await sql`ALTER INDEX books_0c84fd75_yount_idx RENAME TO publications_0c84fd75_yount_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX publications_0c84fd75_yount_idx RENAME TO books_0c84fd75_yount_idx`",
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
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("rename table with complex index", async (context) => {
		await context.kysely.schema
			.createTable("publications")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("publications_6b9be986_yount_idx")
			.on("publications")
			.columns(["id", "samples"])
			.where("samples", ">", 20)
			.where(sql.ref("ratings"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const books = table({
			columns: {
				id: integer(),
				samples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["id", "samples"])
					.where("samples", ">", 20)
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
				priority: 900,
				tableName: "publications",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
			},
			{
				down: [
					[
						"await sql`ALTER INDEX books_6b9be986_yount_idx RENAME TO publications_6b9be986_yount_idx`",
						"execute(db);",
					],
				],
				priority: 5001,
				tableName: "books",
				type: "changeIndex",
				up: [
					[
						"await sql`ALTER INDEX publications_6b9be986_yount_idx RENAME TO books_6b9be986_yount_idx`",
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
			mock: () => {
				mockTableDiffOnce([
					{
						from: "publications",
						to: "books",
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

		const publications = table({
			columns: {
				book_id: integer(),
			},
			indexes: [index(["book_id"])],
		});

		const dbSchema = schema({
			tables: {
				publications,
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
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "publications",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 5001,
				tableName: "publications",
				type: "changeIndex",
				up: [
					[
						"await sql`ALTER INDEX books_0c84fd75_yount_idx RENAME TO publications_03cf58de_yount_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX publications_03cf58de_yount_idx RENAME TO books_0c84fd75_yount_idx`",
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
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
				mockColumnDiffOnce({
					publications: [
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
			.createTable("publications")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("publications_6b9be986_yount_idx")
			.on("publications")
			.columns(["id", "samples"])
			.where("samples", ">", 20)
			.where(sql.ref("ratings"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const books = table({
			columns: {
				book_id: integer(),
				samples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["book_id", "samples"])
					.where("samples", ">", 20)
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
				priority: 900,
				tableName: "publications",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
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
				priority: 5001,
				tableName: "books",
				type: "changeIndex",
				up: [
					[
						"await sql`ALTER INDEX publications_6b9be986_yount_idx RENAME TO books_a338e985_yount_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX books_a338e985_yount_idx RENAME TO publications_6b9be986_yount_idx`",
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
			mock: () => {
				mockTableDiffOnce([
					{
						from: "publications",
						to: "books",
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

		const publications = table({
			columns: {
				id: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
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
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
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
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("rename table and drop complex index", async (context) => {
		await context.kysely.schema
			.createTable("publications")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("publications_6b9be986_yount_idx")
			.on("publications")
			.columns(["id", "samples"])
			.where("samples", ">", 20)
			.where(sql.ref("ratings"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const books = table({
			columns: {
				id: integer(),
				samples: integer(),
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
				tableName: "publications",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_6b9be986_yount_idx")',
						"execute();",
					],
				],
				down: [
					[
						"await sql`CREATE UNIQUE INDEX publications_6b9be986_yount_idx ON public.publications USING btree (id, samples) NULLS NOT DISTINCT WHERE ((samples > 20) AND (ratings > 5))`",
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "publications",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
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
			mock: () => {
				mockTableDiffOnce([
					{
						from: "publications",
						to: "books",
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
				bookId: integer(),
			},
			indexes: [index(["bookId"])],
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
						'renameColumn("book_id", "bookId")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
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
						'await sql`create index "users_pk1_08bf5869_yount_idx" on "public"."users_pk1" ("bookId")`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("users_pk1_08bf5869_yount_idx")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					users_pk1: [
						{
							from: "book_id",
							to: "bookId",
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
				examples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["id", "examples"])
					.where("examples", ">", 20)
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
						'renameColumn("samples", "examples")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("examples", "samples")',
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
						'await sql`create unique index "books_85f9c9be_yount_idx" on "public"."books" using btree ("id", "examples") nulls not distinct where "examples" > 20 and "ratings" > 5`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_85f9c9be_yount_idx")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "samples",
							to: "examples",
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
				book_id: integer(),
			},
			indexes: [index(["book_id"])],
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
			connector: { schemas: [dbSchema] },
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
				book_id: integer(),
				examples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["book_id", "examples"])
					.where("examples", ">", 20)
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
						'renameColumn("samples", "examples")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("examples", "samples")',
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
						"await sql`ALTER INDEX books_6b9be986_yount_idx RENAME TO books_f58de7d0_yount_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX books_f58de7d0_yount_idx RENAME TO books_6b9be986_yount_idx`",
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
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "samples",
							to: "examples",
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
				book_id: integer(),
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
			connector: { schemas: [dbSchema] },
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
				book_id: integer(),
				examples: integer(),
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
						'renameColumn("samples", "examples")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("examples", "samples")',
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
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "samples",
							to: "examples",
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
				book_id: integer(),
				examples: integer(),
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
						'renameColumn("samples", "examples")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("examples", "samples")',
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
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "samples",
							to: "examples",
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
});
