import { afterEach, beforeEach, describe, test } from "vitest";
import { integer, serial, varchar } from "~/database/schema/pg_column.js";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { foreignKey } from "~/database/schema/pg_foreign_key.js";
import { pgTable } from "~/database/schema/pg_table.js";
import { unique } from "~/database/schema/pg_unique.js";
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
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("fullName", "varchar")
			.execute();

		const books = pgTable("books", {
			columns: {
				id: integer(),
			},
			uniqueConstraints: [unique("id", false)],
		});

		const users = pgTable("users", {
			columns: {
				id: serial(),
				fullName: varchar(),
			},
			uniqueConstraints: [unique(["id", "fullName"], true)],
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
					'await sql`ALTER TABLE books ADD CONSTRAINT "books_id_kinetic_key" UNIQUE NULLS NOT DISTINCT ("id")`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE books DROP CONSTRAINT "books_id_kinetic_key"`.execute(db);',
				],
			},
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_fullName_id_kinetic_key" UNIQUE NULLS DISTINCT ("fullName", "id")`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_fullName_id_kinetic_key"`.execute(db);',
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			reverseChangesetAfterDown: true,
		});
	});

	test<DbContext>("remove unique constraints", async (context) => {
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

		const books = pgTable("books", {
			columns: {
				id: integer(),
			},
			uniqueConstraints: [unique("id", false)],
		});

		const users = pgTable("users", {
			columns: {
				id: serial(),
				fullName: varchar(),
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
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_fullName_id_kinetic_key"`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_fullName_id_kinetic_key" UNIQUE NULLS DISTINCT ("fullName", "id")`.execute(db);',
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			reverseChangesetAfterDown: true,
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

		const books = pgTable("books", {
			columns: {
				id: integer(),
			},
			uniqueConstraints: [unique("id", false)],
		});

		const users = pgTable("users", {
			columns: {
				id: serial(),
				fullName: varchar(),
			},
			uniqueConstraints: [unique(["id"])],
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
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_fullName_id_kinetic_key"`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_fullName_id_kinetic_key" UNIQUE NULLS DISTINCT ("fullName", "id")`.execute(db);',
				],
			},
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_id_kinetic_key" UNIQUE NULLS DISTINCT ("id")`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_id_kinetic_key"`.execute(db);',
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			reverseChangesetAfterDown: true,
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

		const books = pgTable("books", {
			columns: {
				id: integer(),
			},
			uniqueConstraints: [unique("id", false)],
		});

		const users = pgTable("users", {
			columns: {
				id: serial(),
				fullName: varchar(),
			},
			uniqueConstraints: [unique(["id", "fullName"], false)],
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
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_fullName_id_kinetic_key", ADD CONSTRAINT "users_fullName_id_kinetic_key" UNIQUE NULLS NOT DISTINCT ("fullName", "id")`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_fullName_id_kinetic_key", ADD CONSTRAINT "users_fullName_id_kinetic_key" UNIQUE NULLS DISTINCT ("fullName", "id")`.execute(db);',
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			reverseChangesetAfterDown: true,
		});
	});
});
