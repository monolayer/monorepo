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

describe("Rename primary key", { concurrent: false, sequential: true }, () => {
	// { concurrent: false, sequential: true },
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
		vi.restoreAllMocks();
	});

	test<DbContext>("rename table with primary key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
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

	test<DbContext>("rename table and primary key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
			.execute();

		const publications = table({
			columns: {
				identifier: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["identifier"]),
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

	test<DbContext>("rename primary key", async (context) => {
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
				identifier: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["identifier"]),
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
						'renameColumn("id", "identifier")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("identifier", "id")',
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
							to: "identifier",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename table and drop primary key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id"])
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
			{
				priority: 1004,
				tableName: "publications",
				type: "dropPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("books_yount_pk")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("id", (col) => col.dropNotNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addPrimaryKeyConstraint("books_yount_pk", ["id"])',
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

	test<DbContext>("rename table and drop primary key maintain not null", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id"])
			.execute();

		const publications = table({
			columns: {
				id: integer().notNull(),
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
				priority: 1004,
				tableName: "publications",
				type: "dropPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("books_yount_pk")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addPrimaryKeyConstraint("books_yount_pk", ["id"])',
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

	test<DbContext>("rename table and add primary key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
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
				priority: 4001,
				tableName: "publications",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addPrimaryKeyConstraint("publications_yount_pk", ["id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_yount_pk")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("id", (col) => col.dropNotNull())',
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

	test<DbContext>("rename table and add primary key not null", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				id: integer().notNull(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
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
				priority: 3008,
				tableName: "publications",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("id", (col) => col.setNotNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("id", (col) => col.dropNotNull())',
						"execute();",
					],
				],
			},
			{
				priority: 4001,
				tableName: "publications",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addPrimaryKeyConstraint("publications_yount_pk", ["id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_yount_pk")',
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

	test<DbContext>("rename table and add primary key on renamed column", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				identifier: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["identifier"]),
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
				priority: 4001,
				tableName: "publications",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addPrimaryKeyConstraint("publications_yount_pk", ["identifier"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_yount_pk")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("identifier", (col) => col.dropNotNull())',
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

	test<DbContext>("rename table and add primary key on renamed column not null", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				identifier: integer().notNull(),
			},
			constraints: {
				primaryKey: primaryKey(["identifier"]),
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
				priority: 3008,
				tableName: "publications",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("identifier", (col) => col.setNotNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("identifier", (col) => col.dropNotNull())',
						"execute();",
					],
				],
			},
			{
				priority: 4001,
				tableName: "publications",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addPrimaryKeyConstraint("publications_yount_pk", ["identifier"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_yount_pk")',
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
});
