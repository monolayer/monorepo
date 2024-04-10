/* eslint-disable max-lines */
import { afterEach, beforeEach, describe, test } from "vitest";
import { schema } from "~/schema/schema.js";
import { varchar } from "~/schema/table/column/data-types/character-varying.js";
import { integer } from "~/schema/table/column/data-types/integer.js";
import { serial } from "~/schema/table/column/data-types/serial.js";
import { unique } from "~/schema/table/constraints/unique/unique.js";
import { table } from "~/schema/table/table.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration-success.js";
import { type DbContext } from "~tests/setup/kysely.js";
import { setUpContext, teardownContext } from "../../helpers/test-context.js";

describe("Database migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("add unique constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("name", "varchar")
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("fullName", "varchar")
			.execute();

		const books = table({
			columns: {
				id: integer(),
				name: varchar(),
			},
			constraints: {
				unique: [unique(["id"]).nullsNotDistinct(), unique(["name"])],
			},
		});

		const users = table({
			columns: {
				id: serial(),
				fullName: varchar(),
			},
			constraints: {
				unique: [unique(["id", "fullName"])],
			},
		});

		const dbSchema = schema({
			tables: {
				books,
				users,
			},
		});

		const expected = [
			{
				priority: 4002,
				tableName: "books",
				type: "createConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_id_yount_key", ["id"], (col) => col.nullsNotDistinct())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_id_yount_key")',
						"execute();",
					],
				],
			},
			{
				priority: 4002,
				tableName: "books",
				type: "createConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_name_yount_key", ["name"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_name_yount_key")',
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
						'addUniqueConstraint("users_fullName_id_yount_key", ["fullName", "id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_fullName_id_yount_key")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database: dbSchema,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("remove unique constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("name", "varchar")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_id_yount_key", ["id"], (uc) =>
				uc.nullsNotDistinct(),
			)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_name_yount_key", ["name"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("fullName", "varchar")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addUniqueConstraint("users_fullName_id_yount_key", ["id", "fullName"])
			.execute();

		const books = table({
			columns: {
				id: integer(),
				name: varchar(),
			},
		});

		const users = table({
			columns: {
				id: serial(),
				fullName: varchar(),
			},
			constraints: {
				unique: [unique(["fullName", "id"])],
			},
		});

		const dbSchema = schema({
			tables: {
				books,
				users,
			},
		});

		const expected = [
			{
				priority: 1003,
				tableName: "books",
				type: "dropConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_id_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_id_yount_key", ["id"], (col) => col.nullsNotDistinct())',
						"execute();",
					],
				],
			},
			{
				priority: 1003,
				tableName: "books",
				type: "dropConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_name_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_name_yount_key", ["name"])',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database: dbSchema,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("replace unique constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_id_yount_key", ["id"], (uc) =>
				uc.nullsNotDistinct(),
			)
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("fullName", "varchar")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addUniqueConstraint("users_fullName_id_yount_key", ["id", "fullName"])
			.execute();

		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				unique: [unique(["id"]).nullsNotDistinct()],
			},
		});

		const users = table({
			columns: {
				id: serial(),
				fullName: varchar(),
			},
			constraints: {
				unique: [unique(["id"])],
			},
		});

		const dbSchema = schema({
			tables: {
				books,
				users,
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
						'dropConstraint("users_fullName_id_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addUniqueConstraint("users_fullName_id_yount_key", ["fullName", "id"])',
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
						'addUniqueConstraint("users_id_yount_key", ["id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_id_yount_key")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database: dbSchema,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("change unique constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_id_yount_key", ["id"], (uc) =>
				uc.nullsNotDistinct(),
			)
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("fullName", "varchar")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addUniqueConstraint("users_fullName_id_yount_key", ["id", "fullName"])
			.execute();

		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				unique: [unique(["id"]).nullsNotDistinct()],
			},
		});

		const users = table({
			columns: {
				id: serial(),
				fullName: varchar(),
			},
			constraints: {
				unique: [unique(["id", "fullName"]).nullsNotDistinct()],
			},
		});

		const dbSchema = schema({
			tables: {
				books,
				users,
			},
		});

		const expected = [
			{
				priority: 5002,
				tableName: "users",
				type: "changeConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_fullName_id_yount_key")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addUniqueConstraint("users_fullName_id_yount_key", ["fullName", "id"], (col) => col.nullsNotDistinct())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_fullName_id_yount_key")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addUniqueConstraint("users_fullName_id_yount_key", ["fullName", "id"])',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database: dbSchema,
			expected,
			down: "reverse",
		});
	});
});
