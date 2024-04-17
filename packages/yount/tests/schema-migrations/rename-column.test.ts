/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test, vi } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { varchar } from "~/database/schema/table/column/data-types/character-varying.js";
import { integer } from "~/database/schema/table/column/data-types/integer.js";
import { text } from "~/database/schema/table/column/data-types/text.js";
import { foreignKey } from "~/database/schema/table/constraints/foreign-key/foreign-key.js";
import { primaryKey } from "~/database/schema/table/constraints/primary-key/primary-key.js";
import { unique } from "~/database/schema/table/constraints/unique/unique.js";
import { index } from "~/database/schema/table/index/index.js";
import { table } from "~/database/schema/table/table.js";
import { columnDiffPrompt } from "~/programs/column-diff-prompt.js";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("Rename column migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
		vi.mocked(columnDiffPrompt).mockResolvedValue({});
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
		vi.restoreAllMocks();
	});

	describe("not applied in remote", () => {
		test<DbContext>("column name", async (context) => {
			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users: [
					{
						from: "name",
						to: "fullName",
					},
				],
			});

			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.execute();

			const dbSchema = schema({
				tables: {
					users: table({
						columns: {
							fullName: text(),
						},
					}),
				},
			});

			const expected = [
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("name", "fullName")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("fullName", "name")',
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
			});
		});

		test<DbContext>("column name camel case", async (context) => {
			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users: [
					{
						from: "name",
						to: "full_name",
					},
				],
			});

			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.execute();

			const dbSchema = schema({
				tables: {
					users: table({
						columns: {
							fullName: text(),
						},
					}),
				},
			});

			const expected = [
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("name", "full_name")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("full_name", "name")',
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
				expected,
				down: "same",
			});
		});

		test<DbContext>("column name and type", async (context) => {
			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users: [
					{
						from: "name",
						to: "fullName",
					},
				],
			});

			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.execute();

			const dbSchema = schema({
				tables: {
					users: table({
						columns: {
							fullName: varchar(255),
						},
					}),
				},
			});

			const expected = [
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("name", "fullName")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("fullName", "name")',
							"execute();",
						],
					],
				},
				{
					priority: 3001,
					tableName: "users",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("fullName", (col) => col.setDataType(sql`character varying(255)`))',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("fullName", (col) => col.setDataType(sql`text`))',
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
			});
		});

		test<DbContext>("column name and type camel case", async (context) => {
			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users: [
					{
						from: "name",
						to: "full_name",
					},
				],
			});

			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.execute();

			const dbSchema = schema({
				tables: {
					users: table({
						columns: {
							fullName: varchar(255),
						},
					}),
				},
			});

			const expected = [
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("name", "full_name")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("full_name", "name")',
							"execute();",
						],
					],
				},
				{
					priority: 3001,
					tableName: "users",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("full_name", (col) => col.setDataType(sql`character varying(255)`))',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("full_name", (col) => col.setDataType(sql`text`))',
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
				expected,
				down: "same",
			});
		});

		test<DbContext>("with unique constraints applied", async (context) => {
			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users: [
					{
						from: "name",
						to: "fullName",
					},
				],
			});

			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addUniqueConstraint("users_adbefd84_yount_key", ["name"])
				.execute();

			const users = table({
				columns: {
					fullName: text(),
				},
				constraints: {
					unique: [unique(["fullName"])],
				},
			});

			const dbSchema = schema({
				tables: {
					users: users,
				},
			});

			const expected = [
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("name", "fullName")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("fullName", "name")',
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
			});
		});

		test<DbContext>("with unique constraints applied camel case", async (context) => {
			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users: [
					{
						from: "name",
						to: "full_name",
					},
				],
			});

			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addUniqueConstraint("users_adbefd84_yount_key", ["name"])
				.execute();

			const users = table({
				columns: {
					fullName: text(),
				},
				constraints: {
					unique: [unique(["fullName"]).nullsNotDistinct()],
				},
			});

			const dbSchema = schema({
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
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_adbefd84_yount_key")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addUniqueConstraint("users_adbefd84_yount_key", ["name"])',
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
							'renameColumn("name", "full_name")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("full_name", "name")',
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
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addUniqueConstraint("users_1252b14e_yount_key", ["full_name"], (col) => col.nullsNotDistinct())',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_1252b14e_yount_key")',
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
				expected,
				down: "same",
			});
		});

		test<DbContext>("with unique constraints not applied", async (context) => {
			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users: [
					{
						from: "name",
						to: "fullName",
					},
				],
			});

			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
				},
				constraints: {
					unique: [unique(["fullName"])],
				},
			});

			const dbSchema = schema({
				tables: {
					users: users,
				},
			});

			const expected = [
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("name", "fullName")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
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
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addUniqueConstraint("users_adbefd84_yount_key", ["fullName"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_adbefd84_yount_key")',
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
			});
		});

		test<DbContext>("with unique constraints not applied camel case", async (context) => {
			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users: [
					{
						from: "name",
						to: "full_name",
					},
				],
			});

			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
				},
				constraints: {
					unique: [unique(["fullName"])],
				},
			});

			const dbSchema = schema({
				tables: {
					users: users,
				},
			});

			const expected = [
				{
					priority: 3000,
					tableName: "users",
					type: "changeColumnName",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("name", "full_name")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'renameColumn("full_name", "name")',
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
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addUniqueConstraint("users_37cff225_yount_key", ["full_name"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_37cff225_yount_key")',
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
				expected,
				down: "same",
			});
		});

		test<DbContext>("with primary key applied", async (context) => {
			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.execute();

			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users_pk1: [
					{
						from: "name",
						to: "fullName",
					},
				],
			});

			await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_yount_pk PRIMARY KEY (\"name\")`.execute(
				context.kysely,
			);

			const users = table({
				columns: {
					fullName: text(),
				},
				constraints: {
					primaryKey: primaryKey(["fullName"]),
				},
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
							'renameColumn("name", "fullName")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'renameColumn("fullName", "name")',
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
			});
		});

		test<DbContext>("with primary key applied camel case", async (context) => {
			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.execute();

			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users_pk1: [
					{
						from: "name",
						to: "full_name",
					},
				],
			});

			await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_yount_pk PRIMARY KEY (\"name\")`.execute(
				context.kysely,
			);

			const users = table({
				columns: {
					fullName: text(),
				},
				constraints: {
					primaryKey: primaryKey(["fullName"]),
				},
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
							'renameColumn("name", "full_name")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'renameColumn("full_name", "name")',
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
				expected,
				down: "same",
			});
		});

		test<DbContext>("with primary key not applied", async (context) => {
			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users_pk1: [
					{
						from: "name",
						to: "fullName",
					},
				],
			});

			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
				},
				constraints: {
					primaryKey: primaryKey(["fullName"]),
				},
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
							'renameColumn("name", "fullName")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
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
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'addPrimaryKeyConstraint("users_pk1_yount_pk", ["fullName"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'dropConstraint("users_pk1_yount_pk")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'alterColumn("fullName", (col) => col.dropNotNull())',
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
			});
		});

		test<DbContext>("with primary key not applied camel case", async (context) => {
			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users_pk1: [
					{
						from: "name",
						to: "full_name",
					},
				],
			});

			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
				},
				constraints: {
					primaryKey: primaryKey(["fullName"]),
				},
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
							'renameColumn("name", "full_name")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'renameColumn("full_name", "name")',
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
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'addPrimaryKeyConstraint("users_pk1_yount_pk", ["full_name"])',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'dropConstraint("users_pk1_yount_pk")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'alterColumn("full_name", (col) => col.dropNotNull())',
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
				expected,
				down: "same",
			});
		});

		test<DbContext>("with foreign key applied", async (context) => {
			const mock = vi
				.mocked(columnDiffPrompt)
				.mockResolvedValue({})
				.mockResolvedValueOnce({
					users_pk1: [
						{
							from: "book_id",
							to: "sample_id",
						},
					],
				});

			await context.kysely.schema
				.createTable("books_pk1")
				.addColumn("id", "integer")
				.addPrimaryKeyConstraint("books_pk1_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.addForeignKeyConstraint(
					"users_pk1_66a7ed92_yount_fk",
					["book_id"],
					"books_pk1",
					["id"],
				)
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					name: text(),
					sample_id: integer(),
				},
				constraints: {
					foreignKeys: [foreignKey(["sample_id"], books, ["id"])],
				},
			});

			const dbSchema = schema({
				tables: {
					users_pk1: users,
					books_pk1: books,
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
							'renameColumn("book_id", "sample_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'renameColumn("sample_id", "book_id")',
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
				beforeSecondRegenerate: () => {
					mock.mockResolvedValueOnce({
						users_pk1: [
							{
								from: "book_id",
								to: "sample_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("with foreign key applied camel case", async (context) => {
			const mock = vi
				.mocked(columnDiffPrompt)
				.mockResolvedValue({})
				.mockResolvedValueOnce({
					users_pk1: [
						{
							from: "book_id",
							to: "sample_id",
						},
					],
				});

			await context.kysely.schema
				.createTable("books_pk1")
				.addColumn("id", "integer")
				.addPrimaryKeyConstraint("books_pk1_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.addForeignKeyConstraint(
					"users_pk1_66a7ed92_yount_fk",
					["book_id"],
					"books_pk1",
					["id"],
				)
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					name: text(),
					sampleId: integer(),
				},
				constraints: {
					foreignKeys: [foreignKey(["sampleId"], books, ["id"])],
				},
			});

			const dbSchema = schema({
				tables: {
					users_pk1: users,
					books_pk1: books,
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
							'renameColumn("book_id", "sample_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'renameColumn("sample_id", "book_id")',
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
				expected,
				down: "same",
				beforeSecondRegenerate: () => {
					mock.mockResolvedValueOnce({
						users_pk1: [
							{
								from: "book_id",
								to: "sample_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("with foreign key not applied", async (context) => {
			const mock = vi.mocked(columnDiffPrompt).mockResolvedValueOnce({
				users_pk1: [
					{
						from: "book_id",
						to: "sample_id",
					},
				],
			});

			await context.kysely.schema
				.createTable("books_pk1")
				.addColumn("id", "integer")
				.addPrimaryKeyConstraint("books_pk1_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					name: text(),
					sample_id: integer(),
				},
				constraints: {
					foreignKeys: [foreignKey(["sample_id"], books, ["id"])],
				},
			});

			const dbSchema = schema({
				tables: {
					users_pk1: users,
					books_pk1: books,
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
							'renameColumn("book_id", "sample_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'renameColumn("sample_id", "book_id")',
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
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users_pk1")
    .addForeignKeyConstraint("users_pk1_66a7ed92_yount_fk", ["sample_id"], "books_pk1", ["id"])
    .onDelete("no action")
    .onUpdate("no action")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users_pk1" VALIDATE CONSTRAINT "users_pk1_66a7ed92_yount_fk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'dropConstraint("users_pk1_66a7ed92_yount_fk")',
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
				beforeSecondRegenerate: () => {
					mock.mockResolvedValueOnce({
						users_pk1: [
							{
								from: "book_id",
								to: "sample_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("with foreign key not applied camel case", async (context) => {
			const mock = vi.mocked(columnDiffPrompt).mockResolvedValueOnce({
				users_pk1: [
					{
						from: "book_id",
						to: "sample_id",
					},
				],
			});

			await context.kysely.schema
				.createTable("books_pk1")
				.addColumn("id", "integer")
				.addPrimaryKeyConstraint("books_pk1_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					name: text(),
					sampleId: integer(),
				},
				constraints: {
					foreignKeys: [foreignKey(["sampleId"], books, ["id"])],
				},
			});

			const dbSchema = schema({
				tables: {
					users_pk1: users,
					books_pk1: books,
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
							'renameColumn("book_id", "sample_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'renameColumn("sample_id", "book_id")',
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
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users_pk1")
    .addForeignKeyConstraint("users_pk1_66a7ed92_yount_fk", ["sample_id"], "books_pk1", ["id"])
    .onDelete("no action")
    .onUpdate("no action")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users_pk1" VALIDATE CONSTRAINT "users_pk1_66a7ed92_yount_fk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'dropConstraint("users_pk1_66a7ed92_yount_fk")',
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
				expected,
				down: "same",
				beforeSecondRegenerate: () => {
					mock.mockResolvedValueOnce({
						users_pk1: [
							{
								from: "book_id",
								to: "sample_id",
							},
						],
					});
				},
			});
		});

		test<DbContext>("with indexes applied", async (context) => {
			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users_pk1: [
					{
						from: "bookId",
						to: "sampleId",
					},
				],
			});

			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("bookId", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("users_pk1_08bf5869_yount_idx")
				.on("users_pk1")
				.columns(["bookId"])
				.execute();

			const users = table({
				columns: {
					name: text(),
					sampleId: integer(),
				},
				indexes: [index(["sampleId"])],
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
							'renameColumn("bookId", "sampleId")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'renameColumn("sampleId", "bookId")',
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
			});
		});

		test<DbContext>("with indexes applied camel case", async (context) => {
			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users_pk1: [
					{
						from: "book_id",
						to: "sample_id",
					},
				],
			});

			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("users_pk1_0833bfb4_yount_idx")
				.on("users_pk1")
				.columns(["book_id"])
				.execute();

			const users = table({
				columns: {
					name: text(),
					sampleId: integer(),
				},
				indexes: [index(["sampleId"])],
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
							'renameColumn("book_id", "sample_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users_pk1")',
							'renameColumn("sample_id", "book_id")',
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
				expected,
				down: "same",
			});
		});

		test<DbContext>("with indexes not applied", async (context) => {
			vi.mocked(columnDiffPrompt).mockResolvedValue({
				users_pk1: [
					{
						from: "book_id",
						to: "bookId",
					},
				],
			});

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
							'await sql`create index "users_pk1_03cf58de_yount_idx" on "public"."users_pk1" ("bookId")`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pk1_03cf58de_yount_idx")',
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
			});
		});
	});

	describe("applied in remote", () => {
		test<DbContext>("with unique constraints with previous name applied", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addUniqueConstraint("users_fdbf03f9_yount_key", ["name"])
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.renameColumn("name", "fullName")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
				},
				constraints: {
					unique: [unique(["fullName"])],
				},
			});

			const dbSchema = schema({
				tables: {
					users: users,
				},
			});

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: [],
				down: "same",
			});
		});

		test<DbContext>("with unique constraints name applied", async (context) => {
			await context.kysely.schema
				.createTable("users6")
				.addColumn("fullName", "text")
				.addUniqueConstraint("users6_fdbf03f9_yount_key", ["fullName"])
				.execute();

			const users = table({
				columns: {
					fullName: text(),
				},
				constraints: {
					unique: [unique(["fullName"])],
				},
			});

			const dbSchema = schema({
				tables: {
					users6: users,
				},
			});

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: [],
				down: "same",
			});
		});

		test<DbContext>("with primary key from previous name applied", async (context) => {
			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.execute();

			await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_name_yount_pk PRIMARY KEY (name)`.execute(
				context.kysely,
			);

			await context.kysely.schema
				.alterTable("users_pk1")
				.renameColumn("name", "fullName")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
				},
				constraints: {
					primaryKey: primaryKey(["fullName"]),
				},
			});

			const dbSchema = schema({
				tables: {
					users_pk1: users,
				},
			});

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: [],
				down: "same",
			});
		});

		test<DbContext>("with primary key name applied", async (context) => {
			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("fullName", "text")
				.execute();

			await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_fullName_yount_pk PRIMARY KEY (\"fullName\")`.execute(
				context.kysely,
			);

			const users = table({
				columns: {
					fullName: text(),
				},
				constraints: {
					primaryKey: primaryKey(["fullName"]),
				},
			});

			const dbSchema = schema({
				tables: {
					users_pk1: users,
				},
			});

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: [],
				down: "same",
			});
		});

		test<DbContext>("with foreign key from previous name applied", async (context) => {
			await context.kysely.schema
				.createTable("books_pk1")
				.addColumn("id", "integer")
				.addPrimaryKeyConstraint("books_pk1_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.addForeignKeyConstraint(
					"users_pk1_66a7ed92_yount_fk",
					["book_id"],
					"books_pk1",
					["id"],
				)
				.execute();

			await context.kysely.schema
				.alterTable("users_pk1")
				.renameColumn("book_id", "bookId")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					name: text(),
					bookId: integer(),
				},
				constraints: {
					foreignKeys: [foreignKey(["bookId"], books, ["id"])],
				},
			});

			const dbSchema = schema({
				tables: {
					users_pk1: users,
					books_pk1: books,
				},
			});

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: [],
				down: "same",
			});
		});

		test<DbContext>("with foreign key name applied", async (context) => {
			await context.kysely.schema
				.createTable("books_pk1")
				.addColumn("id", "integer")
				.addPrimaryKeyConstraint("books_pk1_id_yount_pk", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("bookId", "integer")
				.addForeignKeyConstraint(
					"users_pk1_66a7ed92_yount_fk",
					["bookId"],
					"books_pk1",
					["id"],
				)
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					name: text(),
					bookId: integer(),
				},
				constraints: {
					foreignKeys: [foreignKey(["bookId"], books, ["id"])],
				},
			});

			const dbSchema = schema({
				tables: {
					users_pk1: users,
					books_pk1: books,
				},
			});

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: [],
				down: "same",
			});
		});

		test.skip<DbContext>("with indexes from previous name applied", async (context) => {
			await context.kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.createIndex("users_pk1_03cf58de_yount_idx")
				.on("users_pk1")
				.columns(["book_id"])
				.execute();

			await context.kysely.schema
				.alterTable("users_pk1")
				.renameColumn("book_id", "sample_id")
				.execute();

			const users = table({
				columns: {
					name: text(),
					sample_id: integer(),
				},
				indexes: [index(["sample_id"])],
			});

			const dbSchema = schema({
				tables: {
					users_pk1: users,
				},
			});

			const expected: string[] = [];

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected,
				down: "same",
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
				.createIndex("users_pk1_08bf5869_yount_idx")
				.on("users_pk1")
				.columns(["bookId"])
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

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: [],
				down: "same",
			});
		});

		test<DbContext>("change name", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("fullName", "text")
				.execute();

			const dbSchema = schema({
				tables: {
					users: table({
						columns: {
							fullName: text(),
						},
					}),
				},
			});

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: [],
				down: "same",
			});
		});

		test<DbContext>("change name and type", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("fullName", "varchar")
				.execute();

			const dbSchema = schema({
				tables: {
					users: table({
						columns: {
							fullName: varchar(),
						},
					}),
				},
			});

			await testChangesetAndMigrations({
				context,
				connector: { schemas: [dbSchema] },
				expected: [],
				down: "same",
			});
		});
	});
});
