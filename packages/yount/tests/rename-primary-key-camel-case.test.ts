/* eslint-disable max-lines */
import { afterEach, beforeEach, describe, test, vi } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { table } from "~/database/schema/table/table.js";
import { integer, primaryKey } from "~/pg.js";
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
	"Rename primary key camel case",
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

		test<DbContext>("rename table with primary key camel case", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
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
							to: "new_books",
						},
					]);
				},
			});
		});

		test<DbContext>("rename table and primary key camel case", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
				.execute();

			const newBooks = table({
				columns: {
					newId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["newId"]),
				},
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
							'renameColumn("id", "new_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'renameColumn("new_id", "id")',
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
								to: "new_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("rename primary key camel case", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
				.execute();

			const books = table({
				columns: {
					newId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["newId"]),
				},
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
							'renameColumn("id", "new_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'renameColumn("new_id", "id")',
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
								to: "new_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("rename table and drop primary key camel case", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["book_id"])
				.execute();

			const newBooks = table({
				columns: {
					bookId: integer(),
				},
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
					priority: 1004,
					tableName: "new_books",
					type: "dropPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'dropConstraint("books_yount_pk")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'alterColumn("book_id", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'addPrimaryKeyConstraint("books_yount_pk", ["book_id"])',
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

		test<DbContext>("rename table and drop primary key maintain not null camel case", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_yount_pk", ["book_id"])
				.execute();

			const newBooks = table({
				columns: {
					bookId: integer().notNull(),
				},
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
					priority: 1004,
					tableName: "new_books",
					type: "dropPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'dropConstraint("books_yount_pk")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'addPrimaryKeyConstraint("books_yount_pk", ["book_id"])',
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

		test<DbContext>("rename table and add primary key camel case", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("book_id", "integer")
				.execute();

			const newBooks = table({
				columns: {
					bookId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId"]),
				},
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
					priority: 4001,
					tableName: "new_books",
					type: "createPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'addPrimaryKeyConstraint("new_books_yount_pk", ["book_id"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'dropConstraint("new_books_yount_pk")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'alterColumn("book_id", (col) => col.dropNotNull())',
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

		test<DbContext>("rename table and add primary key not null camel case", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("book_id", "integer")
				.execute();

			const newBooks = table({
				columns: {
					bookId: integer().notNull(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId"]),
				},
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
					priority: 3008,
					tableName: "new_books",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'alterColumn("book_id", (col) => col.setNotNull())',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'alterColumn("book_id", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 4001,
					tableName: "new_books",
					type: "createPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'addPrimaryKeyConstraint("new_books_yount_pk", ["book_id"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'dropConstraint("new_books_yount_pk")',
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

		test<DbContext>("rename table and add primary key on renamed column camel case", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			const newBooks = table({
				columns: {
					bookId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId"]),
				},
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
					priority: 4001,
					tableName: "new_books",
					type: "createPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'addPrimaryKeyConstraint("new_books_yount_pk", ["book_id"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'dropConstraint("new_books_yount_pk")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'alterColumn("book_id", (col) => col.dropNotNull())',
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

		test<DbContext>("rename table and add primary key on renamed column not null camel case", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			const newBooks = table({
				columns: {
					bookId: integer().notNull(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId"]),
				},
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
					priority: 3008,
					tableName: "new_books",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'alterColumn("book_id", (col) => col.setNotNull())',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'alterColumn("book_id", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 4001,
					tableName: "new_books",
					type: "createPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'addPrimaryKeyConstraint("new_books_yount_pk", ["book_id"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("new_books")',
							'dropConstraint("new_books_yount_pk")',
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
	},
);
