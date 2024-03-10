import { afterEach, beforeEach, describe, test } from "vitest";
import { pgInteger, pgSerial, pgVarchar } from "~/database/schema/pg_column.js";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { pgForeignKey } from "~/database/schema/pg_foreign_key.js";
import { pgTable } from "~/database/schema/pg_table.js";
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

	test<DbContext>("add foreign keys", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_kinetic_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("name", "varchar")
			.execute();

		const books = pgTable({
			columns: {
				id: pgInteger(),
			},
			primaryKey: ["id"],
		});

		const users = pgTable({
			columns: {
				id: pgSerial(),
				book_id: pgInteger(),
				name: pgVarchar(),
			},
			foreignKeys: [
				pgForeignKey(["id"], books, ["id"])
					.updateRule("set null")
					.deleteRule("set null"),
			],
		});

		const database = pgDatabase({
			tables: {
				books,
				users,
			},
		});

		const expected = [
			{
				priority: 2002,
				tableName: "users",
				type: "createColumn",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						'addColumn("book_id", "integer")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropColumn("book_id")',
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
						'addForeignKeyConstraint("users_id_books_id_kinetic_fk", ["id"], "books", ["id"])',
						'onDelete("set null")',
						'onUpdate("set null")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropConstraint("users_id_books_id_kinetic_fk")',
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

	test<DbContext>("add multiple first foreign keys", async (context) => {
		await context.kysely.schema
			.createTable("old_books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("old_books")
			.addPrimaryKeyConstraint("old_books_id_kinetic_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_kinetic_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("name", "varchar")
			.execute();

		const books = pgTable({
			columns: {
				id: pgInteger(),
			},
			primaryKey: ["id"],
		});

		const old_books = pgTable({
			columns: {
				id: pgInteger(),
			},
			primaryKey: ["id"],
		});

		const users = pgTable({
			columns: {
				id: pgSerial(),
				book_id: pgInteger(),
				second_book_id: pgInteger(),
				name: pgVarchar(),
			},
			foreignKeys: [
				pgForeignKey(["id"], books, ["id"])
					.updateRule("set null")
					.deleteRule("set null"),
				pgForeignKey(["second_book_id"], old_books, ["id"])
					.updateRule("set null")
					.deleteRule("set null"),
			],
		});

		const database = pgDatabase({
			tables: {
				books,
				old_books,
				users,
			},
		});

		const expected = [
			{
				priority: 2002,
				tableName: "users",
				type: "createColumn",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						'addColumn("book_id", "integer")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropColumn("book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 2002,
				tableName: "users",
				type: "createColumn",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						'addColumn("second_book_id", "integer")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropColumn("second_book_id")',
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
						'addForeignKeyConstraint("users_id_books_id_kinetic_fk", ["id"], "books", ["id"])',
						'onDelete("set null")',
						'onUpdate("set null")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropConstraint("users_id_books_id_kinetic_fk")',
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
						'addForeignKeyConstraint("users_second_book_id_old_books_id_kinetic_fk", ["second_book_id"], "old_books", ["id"])',
						'onDelete("set null")',
						'onUpdate("set null")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropConstraint("users_second_book_id_old_books_id_kinetic_fk")',
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

	test<DbContext>("remove foreign keys", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_kinetic_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_book_id_books_id_kinetic_fk",
				["book_id"],
				"books",
				["id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const books = pgTable({
			columns: {
				id: pgInteger(),
			},
			primaryKey: ["id"],
		});

		const users = pgTable({
			columns: {
				id: pgSerial(),
				book_id: pgInteger(),
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
						'dropConstraint("users_book_id_books_id_kinetic_fk")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'addForeignKeyConstraint("users_book_id_books_id_kinetic_fk", ["book_id"], "books", ["id"])',
						'onDelete("set null")',
						'onUpdate("set null")',
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

	test<DbContext>("remove multiple foreign keys", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_kinetic_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("old_books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("old_books")
			.addPrimaryKeyConstraint("old_books_id_kinetic_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("book_id", "integer")
			.addColumn("old_book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_book_id_books_id_kinetic_fk",
				["book_id"],
				"books",
				["id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_old_book_id_old_books_id_kinetic_fk",
				["old_book_id"],
				"old_books",
				["id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const books = pgTable({
			columns: {
				id: pgInteger(),
			},
			primaryKey: ["id"],
		});

		const old_books = pgTable({
			columns: {
				id: pgInteger(),
			},
			primaryKey: ["id"],
		});

		const users = pgTable({
			columns: {
				id: pgSerial(),
				book_id: pgInteger(),
				old_book_id: pgInteger(),
			},
		});

		const database = pgDatabase({
			tables: {
				books,
				old_books,
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
						'dropConstraint("users_book_id_books_id_kinetic_fk")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'addForeignKeyConstraint("users_book_id_books_id_kinetic_fk", ["book_id"], "books", ["id"])',
						'onDelete("set null")',
						'onUpdate("set null")',
						"execute();",
					],
				],
			},
			{
				priority: 1003,
				tableName: "users",
				type: "dropConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropConstraint("users_old_book_id_old_books_id_kinetic_fk")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'addForeignKeyConstraint("users_old_book_id_old_books_id_kinetic_fk", ["old_book_id"], "old_books", ["id"])',
						'onDelete("set null")',
						'onUpdate("set null")',
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

	test<DbContext>("replace foreign key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_kinetic_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_book_id_books_id_kinetic_fk",
				["book_id"],
				"books",
				["id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const books = pgTable({
			columns: {
				id: pgInteger(),
			},
			primaryKey: ["id"],
		});

		const users = pgTable({
			columns: {
				id: pgSerial(),
				book_id: pgInteger(),
			},
			foreignKeys: [
				pgForeignKey(["id"], books, ["id"])
					.updateRule("cascade")
					.deleteRule("set null"),
			],
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
						'dropConstraint("users_book_id_books_id_kinetic_fk")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'addForeignKeyConstraint("users_book_id_books_id_kinetic_fk", ["book_id"], "books", ["id"])',
						'onDelete("set null")',
						'onUpdate("set null")',
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
						'addForeignKeyConstraint("users_id_books_id_kinetic_fk", ["id"], "books", ["id"])',
						'onDelete("set null")',
						'onUpdate("cascade")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropConstraint("users_id_books_id_kinetic_fk")',
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

	test<DbContext>("change foreign key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_kinetic_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_book_id_books_id_kinetic_fk",
				["book_id"],
				"books",
				["id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const books = pgTable({
			columns: {
				id: pgInteger(),
			},
			primaryKey: ["id"],
		});

		const users = pgTable({
			columns: {
				id: pgSerial(),
				book_id: pgInteger(),
			},
			foreignKeys: [
				pgForeignKey(["book_id"], books, ["id"])
					.updateRule("cascade")
					.deleteRule("set null"),
			],
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
						'dropConstraint("users_book_id_books_id_kinetic_fk")',
						"execute();",
					],
					[
						"await db.schema",
						'alterTable("users")',
						'addForeignKeyConstraint("users_book_id_books_id_kinetic_fk", ["book_id"], "books", ["id"])',
						'onDelete("set null")',
						'onUpdate("cascade")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropConstraint("users_book_id_books_id_kinetic_fk")',
						"execute();",
					],
					[
						"await db.schema",
						'alterTable("users")',
						'addForeignKeyConstraint("users_book_id_books_id_kinetic_fk", ["book_id"], "books", ["id"])',
						'onDelete("set null")',
						'onUpdate("set null")',
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
