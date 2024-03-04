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
				id: pgInteger().primaryKey(),
			},
		});

		const users = pgTable({
			columns: {
				id: pgSerial(),
				book_id: pgInteger(),
				name: pgVarchar(),
			},
			foreignKeys: [
				pgForeignKey(["id"], books, ["id"], {
					updateRule: "set null",
					deleteRule: "set null",
				}),
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
						'await sql`ALTER TABLE users ADD CONSTRAINT "users_id_books_id_kinetic_fk" FOREIGN KEY ("id") REFERENCES books ("id") ON DELETE SET NULL ON UPDATE SET NULL`.execute(db);',
					],
				],
				down: [
					[
						'await sql`ALTER TABLE users DROP CONSTRAINT "users_id_books_id_kinetic_fk"`.execute(db);',
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
				id: pgInteger().primaryKey(),
			},
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
						'await sql`ALTER TABLE users DROP CONSTRAINT "users_book_id_books_id_kinetic_fk"`.execute(db);',
					],
				],
				down: [
					[
						'await sql`ALTER TABLE users ADD CONSTRAINT "users_book_id_books_id_kinetic_fk" FOREIGN KEY ("book_id") REFERENCES books ("id") ON DELETE SET NULL ON UPDATE SET NULL`.execute(db);',
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
				id: pgInteger().primaryKey(),
			},
		});

		const users = pgTable({
			columns: {
				id: pgSerial(),
				book_id: pgInteger(),
			},
			foreignKeys: [
				pgForeignKey(["id"], books, ["id"], {
					updateRule: "cascade",
					deleteRule: "set null",
				}),
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
						'await sql`ALTER TABLE users DROP CONSTRAINT "users_book_id_books_id_kinetic_fk"`.execute(db);',
					],
				],
				down: [
					[
						'await sql`ALTER TABLE users ADD CONSTRAINT "users_book_id_books_id_kinetic_fk" FOREIGN KEY ("book_id") REFERENCES books ("id") ON DELETE SET NULL ON UPDATE SET NULL`.execute(db);',
					],
				],
			},
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					[
						'await sql`ALTER TABLE users ADD CONSTRAINT "users_id_books_id_kinetic_fk" FOREIGN KEY ("id") REFERENCES books ("id") ON DELETE SET NULL ON UPDATE CASCADE`.execute(db);',
					],
				],
				down: [
					[
						'await sql`ALTER TABLE users DROP CONSTRAINT "users_id_books_id_kinetic_fk"`.execute(db);',
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
				id: pgInteger().primaryKey(),
			},
		});

		const users = pgTable({
			columns: {
				id: pgSerial(),
				book_id: pgInteger(),
			},
			foreignKeys: [
				pgForeignKey(["book_id"], books, ["id"], {
					updateRule: "cascade",
					deleteRule: "set null",
				}),
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
						'await sql`ALTER TABLE users DROP CONSTRAINT "users_book_id_books_id_kinetic_fk", ADD CONSTRAINT "users_book_id_books_id_kinetic_fk" FOREIGN KEY ("book_id") REFERENCES books ("id") ON DELETE SET NULL ON UPDATE CASCADE`.execute(db);',
					],
				],
				down: [
					[
						'await sql`ALTER TABLE users DROP CONSTRAINT "users_book_id_books_id_kinetic_fk", ADD CONSTRAINT "users_book_id_books_id_kinetic_fk" FOREIGN KEY ("book_id") REFERENCES books ("id") ON DELETE SET NULL ON UPDATE SET NULL`.execute(db);',
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
