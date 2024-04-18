/* eslint-disable max-lines */
import { afterEach, beforeEach, describe, test, vi } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { table } from "~/database/schema/table/table.js";
import { bigint, integer } from "~/pg.js";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "~tests/__setup__/helpers/test-context.js";
import {
	mockColumnDiffOnce,
	mockTableDiffOnce,
	tableDiffMock,
} from "~tests/__setup__/setup.js";

describe("Rename table", { concurrent: false, sequential: true }, () => {
	// { concurrent: false, sequential: true },
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
		vi.restoreAllMocks();
	});

	test<DbContext>("rename empty table", async (context) => {
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
			mock: () => {
				tableDiffMock().mockResolvedValueOnce([
					{
						from: "users",
						to: "teams",
					},
				]);
			},
		});
	});

	test<DbContext>("rename empty table camel case", async (context) => {
		tableDiffMock().mockResolvedValueOnce([
			{
				from: "users",
				to: "new_users",
			},
		]);
		await context.kysely.schema.createTable("users").execute();

		const dbSchema = schema({
			tables: {
				newUsers: table({
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
						'renameTo("new_users")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_users")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true, options: {} },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "users",
						to: "new_users",
					},
				]);
			},
		});
	});

	test<DbContext>("table with columns", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
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

	test<DbContext>("table with columns camel case", async (context) => {
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

	test<DbContext>("table and columns", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				publication_id: integer(),
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
						'renameColumn("id", "publication_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("publication_id", "id")',
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
							to: "publication_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("table and columns camel case", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const newBooks = table({
			columns: {
				publicationId: integer(),
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
						'renameColumn("id", "publication_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("publication_id", "id")',
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
							to: "publication_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("table and column and type", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				publication_id: bigint(),
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
						'renameColumn("id", "publication_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("publication_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3001,
				tableName: "publications",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("publication_id", (col) => col.setDataType(sql`bigint`))',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("publication_id", (col) => col.setDataType(sql`integer`))',
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
							to: "publication_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("table and columns and type camel case", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const newBooks = table({
			columns: {
				publicationId: bigint(),
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
						'renameColumn("id", "publication_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("publication_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3001,
				tableName: "new_books",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'alterColumn("publication_id", (col) => col.setDataType(sql`bigint`))',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'alterColumn("publication_id", (col) => col.setDataType(sql`integer`))',
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
							to: "publication_id",
						},
					],
				});
			},
		});
	});
});
