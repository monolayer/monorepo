/* eslint-disable max-lines */
import { afterEach, beforeEach, describe, test, vi } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { table } from "~/database/schema/table/table.js";
import { foreignKey, integer, primaryKey, unique } from "~/pg.js";
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

describe("Rename foreign key", { concurrent: false, sequential: true }, () => {
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

		const persons = table({
			columns: {
				id: integer(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], books, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				persons,
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
						'renameTo("persons")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "persons",
				type: "changeConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_c02e3d7d_yount_fk TO users_c02e3d7d_yount_fk`',
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
						from: "users",
						to: "persons",
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

		const documents = table({
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
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], documents, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				users,
				documents,
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
						'renameTo("documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_7e0fa77c_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_7e0fa77c_yount_fk TO users_c02e3d7d_yount_fk`',
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
						to: "documents",
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

		const documents = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], documents, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				persons,
				documents,
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
						'renameTo("documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
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
						'renameTo("persons")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "persons",
				type: "changeConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_7e0fa77c_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_7e0fa77c_yount_fk TO users_c02e3d7d_yount_fk`',
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
						to: "documents",
					},
					{
						from: "users",
						to: "persons",
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

		const documents = table({
			columns: {
				document_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["document_id"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], documents, ["document_id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				users,
				documents,
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
						'renameTo("documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "documents",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_44bd42ca_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_44bd42ca_yount_fk TO users_c02e3d7d_yount_fk`',
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
						to: "documents",
					},
				]);
				mockColumnDiffOnce({
					documents: [
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

		const documents = table({
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
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], documents, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				users,
				documents,
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
						'renameTo("documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_c234a11e_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c234a11e_yount_fk TO users_c02e3d7d_yount_fk`',
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
						to: "documents",
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

		const persons = table({
			columns: {
				id: integer(),
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], books, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				persons,
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
						'renameTo("persons")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "persons",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "persons",
				type: "changeConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_12f9128c_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_12f9128c_yount_fk TO users_c02e3d7d_yount_fk`',
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
						from: "users",
						to: "persons",
					},
				]);
				mockColumnDiffOnce({
					persons: [
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
				book_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["book_id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], books, ["book_id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				persons,
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
						'renameTo("persons")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
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
				tableName: "persons",
				type: "changeConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_c3276eac_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_c3276eac_yount_fk TO users_c02e3d7d_yount_fk`',
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
						from: "users",
						to: "persons",
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
				book_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["book_id"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], books, ["book_id"])
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

		const documents = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], documents, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
				persons,
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
						'renameTo("documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
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
						'renameTo("persons")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "persons",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "persons",
				type: "changeConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_c234a11e_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_c234a11e_yount_fk TO users_c02e3d7d_yount_fk`',
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
						to: "documents",
					},
					{
						from: "users",
						to: "persons",
					},
				]);
				mockColumnDiffOnce({
					persons: [
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

		const documents = table({
			columns: {
				book_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["book_id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], documents, ["book_id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
				persons,
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
						'renameTo("documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
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
						'renameTo("persons")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "documents",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "persons",
				type: "changeConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_ba2ce7c9_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_ba2ce7c9_yount_fk TO users_c02e3d7d_yount_fk`',
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
						to: "documents",
					},
					{
						from: "users",
						to: "persons",
					},
				]);
				mockColumnDiffOnce({
					documents: [
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

		const documents = table({
			columns: {
				book_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["book_id"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], documents, ["book_id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
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
						'renameTo("documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "documents",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_c0179c30_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c0179c30_yount_fk TO users_c02e3d7d_yount_fk`',
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
						to: "documents",
					},
				]);
				mockColumnDiffOnce({
					documents: [
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

		const documents = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], documents, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
				persons,
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
						'renameTo("documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
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
						'renameTo("persons")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "persons",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "persons",
				type: "changeConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_c234a11e_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_c234a11e_yount_fk TO users_c02e3d7d_yount_fk`',
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
						from: "users",
						to: "persons",
					},
					{
						from: "books",
						to: "documents",
					},
				]);
				mockColumnDiffOnce({
					persons: [
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

		const documents = table({
			columns: {
				book_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["book_id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], documents, ["book_id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
				persons,
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
						'renameTo("documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
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
						'renameTo("persons")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "documents",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "persons",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "persons",
				type: "changeConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_c0179c30_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_c0179c30_yount_fk TO users_c02e3d7d_yount_fk`',
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
						from: "users",
						to: "persons",
					},
					{
						from: "books",
						to: "documents",
					},
				]);
				mockColumnDiffOnce({
					documents: [
						{
							from: "id",
							to: "book_id",
						},
					],
					persons: [
						{
							from: "book_id",
							to: "document_id",
						},
					],
				});
			},
		});
	});
});

describe(
	"Rename composite foreign key",
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
					location_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "location_id"]),
				},
			});

			const persons = table({
				columns: {
					id: integer(),
					book_id: integer(),
					book_location_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["book_id", "book_location_id"], books, [
							"id",
							"location_id",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					persons,
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
							'renameTo("persons")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "persons",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_6de35d86_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_6de35d86_yount_fk TO users_c02e3d7d_yount_fk`',
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
							from: "users",
							to: "persons",
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

			const documents = table({
				columns: {
					id: integer(),
					location_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "location_id"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					book_id: integer(),
					book_location_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["book_id", "book_location_id"], documents, [
							"id",
							"location_id",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					documents,
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
							'renameTo("documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
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
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_7245ab87_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_7245ab87_yount_fk TO users_c02e3d7d_yount_fk`',
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
							to: "documents",
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

			const documents = table({
				columns: {
					id: integer(),
					location_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "location_id"]),
				},
			});

			const persons = table({
				columns: {
					id: integer(),
					book_id: integer(),
					book_location_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["book_id", "book_location_id"], documents, [
							"id",
							"location_id",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					persons,
					documents,
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
							'renameTo("documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
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
							'renameTo("persons")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "persons",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_7245ab87_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_7245ab87_yount_fk TO users_c02e3d7d_yount_fk`',
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
							to: "documents",
						},
						{
							from: "users",
							to: "persons",
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

			const documents = table({
				columns: {
					document_id: integer(),
					new_location_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["document_id", "new_location_id"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					book_id: integer(),
					book_location_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["book_id", "book_location_id"], documents, [
							"document_id",
							"new_location_id",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					documents,
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
							'renameTo("documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameColumn("id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameColumn("document_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameColumn("location_id", "new_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
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
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_d3091021_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_d3091021_yount_fk TO users_c02e3d7d_yount_fk`',
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
							to: "documents",
						},
					]);
					mockColumnDiffOnce({
						documents: [
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

			const documents = table({
				columns: {
					id: integer(),
					location_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "location_id"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					document_id: integer(),
					document_location_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["document_id", "document_location_id"], documents, [
							"id",
							"location_id",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					documents,
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
							'renameTo("documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
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
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_4ac9e5d2_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_4ac9e5d2_yount_fk TO users_c02e3d7d_yount_fk`',
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
							to: "documents",
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
					location_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "location_id"]),
				},
			});

			const persons = table({
				columns: {
					id: integer(),
					document_id: integer(),
					document_location_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["document_id", "document_location_id"], books, [
							"id",
							"location_id",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					persons,
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
							'renameTo("persons")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "persons",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "persons",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("book_location_id", "document_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("document_location_id", "book_location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "persons",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_73ffb2a8_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_73ffb2a8_yount_fk TO users_c02e3d7d_yount_fk`',
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
							from: "users",
							to: "persons",
						},
					]);
					mockColumnDiffOnce({
						persons: [
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
					book_id: integer(),
					new_location_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["book_id", "new_location_id"]),
				},
			});

			const persons = table({
				columns: {
					id: integer(),
					book_id: integer(),
					book_location_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["book_id", "book_location_id"], books, [
							"book_id",
							"new_location_id",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					persons,
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
							'renameTo("persons")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
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
					tableName: "persons",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_8e7302ef_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_8e7302ef_yount_fk TO users_c02e3d7d_yount_fk`',
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
							from: "users",
							to: "persons",
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
					book_id: integer(),
					new_location_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["book_id", "new_location_id"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					document_id: integer(),
					document_location_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["document_id", "document_location_id"], books, [
							"book_id",
							"new_location_id",
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

			const documents = table({
				columns: {
					id: integer(),
					location_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "location_id"]),
				},
			});

			const persons = table({
				columns: {
					id: integer(),
					document_id: integer(),
					document_location_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["document_id", "document_location_id"], documents, [
							"id",
							"location_id",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					documents,
					persons,
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
							'renameTo("documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
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
							'renameTo("persons")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "persons",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "persons",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("book_location_id", "document_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("document_location_id", "book_location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "persons",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_4ac9e5d2_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_4ac9e5d2_yount_fk TO users_c02e3d7d_yount_fk`',
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
							to: "documents",
						},
						{
							from: "users",
							to: "persons",
						},
					]);
					mockColumnDiffOnce({
						persons: [
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

			const documents = table({
				columns: {
					book_id: integer(),
					new_location_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["book_id", "new_location_id"]),
				},
			});

			const persons = table({
				columns: {
					id: integer(),
					book_id: integer(),
					book_location_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["book_id", "book_location_id"], documents, [
							"book_id",
							"new_location_id",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					documents,
					persons,
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
							'renameTo("documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
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
							'renameTo("persons")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameColumn("id", "book_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameColumn("book_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameColumn("location_id", "new_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameColumn("new_location_id", "location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "persons",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_585d1288_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_585d1288_yount_fk TO users_c02e3d7d_yount_fk`',
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
							to: "documents",
						},
						{
							from: "users",
							to: "persons",
						},
					]);
					mockColumnDiffOnce({
						documents: [
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

			const documents = table({
				columns: {
					book_id: integer(),
					new_location_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["book_id", "new_location_id"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					document_id: integer(),
					document_location_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["document_id", "document_location_id"], documents, [
							"book_id",
							"new_location_id",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					documents,
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
							'renameTo("documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameTo("books")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameColumn("id", "book_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameColumn("book_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameColumn("location_id", "new_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
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
					down: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_01ac2967_yount_fk TO users_c02e3d7d_yount_fk`',
							"execute(db);",
						],
					],
					priority: 5002,
					tableName: "users",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_01ac2967_yount_fk`',
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
							to: "documents",
						},
					]);
					mockColumnDiffOnce({
						documents: [
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

			const documents = table({
				columns: {
					id: integer(),
					location_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "location_id"]),
				},
			});

			const persons = table({
				columns: {
					id: integer(),
					document_id: integer(),
					document_location_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["document_id", "document_location_id"], documents, [
							"id",
							"location_id",
						])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					documents,
					persons,
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
							'renameTo("documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
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
							'renameTo("persons")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "persons",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "persons",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("book_location_id", "document_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("document_location_id", "book_location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 5002,
					tableName: "persons",
					type: "changeConstraint",
					up: [
						[
							'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_4ac9e5d2_yount_fk`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_4ac9e5d2_yount_fk TO users_c02e3d7d_yount_fk`',
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
							from: "users",
							to: "persons",
						},
						{
							from: "books",
							to: "documents",
						},
					]);
					mockColumnDiffOnce({
						persons: [
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

		test<DbContext>("child table, parent table, parent column, child column replace foreign key", async (context) => {
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
					"users_6de35d86_yount_fk",
					["book_id", "book_location_id"],
					"books",
					["id", "location_id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const documents = table({
				columns: {
					book_id: integer(),
					new_location_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["book_id", "new_location_id"]),
					unique: [unique(["new_location_id"])],
				},
			});

			const persons = table({
				columns: {
					id: integer(),
					document_id: integer(),
					new_book_location_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["new_book_location_id"], documents, ["new_location_id"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					documents,
					persons,
				},
			});

			const expected = [
				{
					priority: 810,
					tableName: "users",
					type: "dropConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_6de35d86_yount_fk")',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_6de35d86_yount_fk", ["book_id", "book_location_id"], "books", ["id", "location_id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_6de35d86_yount_fk"`',
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
							'renameTo("documents")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
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
							'renameTo("persons")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameTo("users")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameColumn("id", "book_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameColumn("book_id", "id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "documents",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameColumn("location_id", "new_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'renameColumn("new_location_id", "location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "persons",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("book_id", "document_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("document_id", "book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 3000,
					tableName: "persons",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("book_location_id", "new_book_location_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'renameColumn("new_book_location_id", "book_location_id")',
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					tableName: "documents",
					type: "createConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'addUniqueConstraint("documents_c78003f2_yount_key", ["new_location_id"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("documents")',
							'dropConstraint("documents_c78003f2_yount_key")',
							"execute();",
						],
					],
				},
				{
					priority: 4011,
					tableName: "persons",
					type: "createConstraint",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("persons")
    .addForeignKeyConstraint("persons_63ccbc6d_yount_fk", ["new_book_location_id"], "documents", ["new_location_id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."persons" VALIDATE CONSTRAINT "persons_63ccbc6d_yount_fk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("persons")',
							'dropConstraint("persons_63ccbc6d_yount_fk")',
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
							from: "users",
							to: "persons",
						},
						{
							from: "books",
							to: "documents",
						},
					]);
					mockColumnDiffOnce({
						documents: [
							{
								from: "id",
								to: "book_id",
							},
							{
								from: "location_id",
								to: "new_location_id",
							},
						],
						persons: [
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

		test<DbContext>("build", async (context) => {
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
					"users_6de35d86_yount_fk",
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
					location_id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "location_id"]),
				},
			});

			const users = table({
				columns: {
					id: integer(),
					book_id: integer(),
					book_location_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["book_id", "book_location_id"], books, [
							"id",
							"location_id",
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

			const expected: string[] = [];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: expected,
				down: "same",
				mock: () => {},
			});
		});
	},
);
