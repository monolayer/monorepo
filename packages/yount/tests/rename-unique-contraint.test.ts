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
	"Rename unique constraint",
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

			const publications = table({
				columns: {
					id: integer(),
				},
				constraints: {
					unique: [unique(["id"])],
				},
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

		test<DbContext>("table and column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
				.execute();

			const publications = table({
				columns: {
					identifier: integer(),
				},
				constraints: {
					unique: [unique(["identifier"])],
				},
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
							'renameColumn("id", "identifier")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("publications")',
							'renameColumn("identifier", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "publications",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT books_acdd8fa3_yount_key TO publications_1c0982e8_yount_key`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT publications_1c0982e8_yount_key TO books_acdd8fa3_yount_key`',
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
								to: "identifier",
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

			const publications = table({
				columns: {
					id: integer(),
				},
				constraints: {
					unique: [unique(["id"])],
				},
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
					priority: 4010,
					tableName: "publications",
					type: "createConstraint",
					up: [
						[
							`await db.withSchema("public").schema`,
							`alterTable("publications")`,
							`addUniqueConstraint("publications_acdd8fa3_yount_key", ["id"])`,
							`execute();`,
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("publications")',
							'dropConstraint("publications_acdd8fa3_yount_key")',
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

		test<DbContext>("table column and add check", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			const publications = table({
				columns: {
					identifier: integer(),
				},
				constraints: {
					unique: [unique(["identifier"])],
				},
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
							'renameColumn("id", "identifier")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("publications")',
							'renameColumn("identifier", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					tableName: "publications",
					type: "createConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("publications")',
							'addUniqueConstraint("publications_1c0982e8_yount_key", ["identifier"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("publications")',
							'dropConstraint("publications_1c0982e8_yount_key")',
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
					mockColumnDiffOnce({
						publications: [
							{
								from: "id",
								to: "identifier",
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

			const publications = table({
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
					publications,
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

			const publications = table({
				columns: {
					id: integer(),
					count: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					publications,
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

		test<DbContext>("table, column, and drop unique", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
				.execute();

			const publications = table({
				columns: {
					book_id: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					publications,
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

			const publications = table({
				columns: {
					book_id: integer(),
					book_count: integer(),
				},
				constraints: {
					unique: [unique(["book_count"])],
				},
			});

			const dbSchema = schema({
				tables: {
					publications,
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
							'renameColumn("count", "book_count")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("publications")',
							'renameColumn("book_count", "count")',
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
					priority: 5002,
					tableName: "publications",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT books_d0c857aa_yount_key TO publications_f2bf9399_yount_key`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT publications_f2bf9399_yount_key TO books_d0c857aa_yount_key`',
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

			const publications = table({
				columns: {
					book_id: integer(),
					book_count: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					publications,
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
							'renameColumn("count", "book_count")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("publications")',
							'renameColumn("book_count", "count")',
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
