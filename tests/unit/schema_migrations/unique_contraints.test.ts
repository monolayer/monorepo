/* eslint-disable max-lines */
import { afterEach, beforeEach, describe, test } from "vitest";
import { pgInteger, pgSerial, pgVarchar } from "~/schema/pg_column.js";
import { pgDatabase } from "~/schema/pg_database.js";
import { pgTable } from "~/schema/pg_table.js";
import { pgUnique } from "~/schema/pg_unique.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration_success.js";
import { type DbContext } from "~tests/setup.js";
import { setUpContext, teardownContext } from "../../helpers/test_context.js";

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

		const books = pgTable({
			columns: {
				id: pgInteger(),
				name: pgVarchar(),
			},
			constraints: {
				unique: [pgUnique(["id"]).nullsNotDistinct(), pgUnique(["name"])],
			},
		});

		const users = pgTable({
			columns: {
				id: pgSerial(),
				fullName: pgVarchar(),
			},
			constraints: {
				unique: [pgUnique(["id", "fullName"])],
			},
		});

		const database = pgDatabase({
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
						"await db.schema",
						'alterTable("books")',
						'addUniqueConstraint("books_id_kinetic_key", ["id"], (col) => col.nullsNotDistinct())',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("books")',
						'dropConstraint("books_id_kinetic_key")',
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
						"await db.schema",
						'alterTable("books")',
						'addUniqueConstraint("books_name_kinetic_key", ["name"])',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("books")',
						'dropConstraint("books_name_kinetic_key")',
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
						"await db.schema",
						'alterTable("users")',
						'addUniqueConstraint("users_fullName_id_kinetic_key", ["fullName", "id"])',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropConstraint("users_fullName_id_kinetic_key")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
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
			.addUniqueConstraint("books_id_kinetic_key", ["id"], (uc) =>
				uc.nullsNotDistinct(),
			)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_name_kinetic_key", ["name"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("fullName", "varchar")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addUniqueConstraint("users_fullName_id_kinetic_key", ["id", "fullName"])
			.execute();

		const books = pgTable({
			columns: {
				id: pgInteger(),
				name: pgVarchar(),
			},
		});

		const users = pgTable({
			columns: {
				id: pgSerial(),
				fullName: pgVarchar(),
			},
			constraints: {
				unique: [pgUnique(["fullName", "id"])],
			},
		});

		const database = pgDatabase({
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
						"await db.schema",
						'alterTable("books")',
						'dropConstraint("books_id_kinetic_key")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("books")',
						'addUniqueConstraint("books_id_kinetic_key", ["id"], (col) => col.nullsNotDistinct())',
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
						"await db.schema",
						'alterTable("books")',
						'dropConstraint("books_name_kinetic_key")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("books")',
						'addUniqueConstraint("books_name_kinetic_key", ["name"])',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
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
			.addUniqueConstraint("books_id_kinetic_key", ["id"], (uc) =>
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
			.addUniqueConstraint("users_fullName_id_kinetic_key", ["id", "fullName"])
			.execute();

		const books = pgTable({
			columns: {
				id: pgInteger(),
			},
			constraints: {
				unique: [pgUnique(["id"]).nullsNotDistinct()],
			},
		});

		const users = pgTable({
			columns: {
				id: pgSerial(),
				fullName: pgVarchar(),
			},
			constraints: {
				unique: [pgUnique(["id"])],
			},
		});

		const database = pgDatabase({
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
						"await db.schema",
						'alterTable("users")',
						'dropConstraint("users_fullName_id_kinetic_key")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'addUniqueConstraint("users_fullName_id_kinetic_key", ["fullName", "id"])',
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
						"await db.schema",
						'alterTable("users")',
						'addUniqueConstraint("users_id_kinetic_key", ["id"])',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropConstraint("users_id_kinetic_key")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
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
			.addUniqueConstraint("books_id_kinetic_key", ["id"], (uc) =>
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
			.addUniqueConstraint("users_fullName_id_kinetic_key", ["id", "fullName"])
			.execute();

		const books = pgTable({
			columns: {
				id: pgInteger(),
			},
			constraints: {
				unique: [pgUnique(["id"]).nullsNotDistinct()],
			},
		});

		const users = pgTable({
			columns: {
				id: pgSerial(),
				fullName: pgVarchar(),
			},
			constraints: {
				unique: [pgUnique(["id", "fullName"]).nullsNotDistinct()],
			},
		});

		const database = pgDatabase({
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
						"await db.schema",
						'alterTable("users")',
						'dropConstraint("users_fullName_id_kinetic_key")',
						"execute();",
					],
					[
						"await db.schema",
						'alterTable("users")',
						'addUniqueConstraint("users_fullName_id_kinetic_key", ["fullName", "id"], (col) => col.nullsNotDistinct())',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropConstraint("users_fullName_id_kinetic_key")',
						"execute();",
					],
					[
						"await db.schema",
						'alterTable("users")',
						'addUniqueConstraint("users_fullName_id_kinetic_key", ["fullName", "id"])',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});
});
