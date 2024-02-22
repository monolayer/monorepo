import { afterEach, beforeEach, describe, test } from "vitest";
import { text } from "~/database/schema/pg_column.js";
import { pgDatabase } from "~/database/schema/pg_database.js";
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

	test<DbContext>("add primary keys", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("fullName", "text")
			.execute();

		await context.kysely.schema
			.createTable("books")
			.addColumn("name", "text")
			.execute();

		const users = pgTable("users", {
			columns: {
				fullName: text(),
				name: text(),
			},
			primaryKey: ["name", "fullName"],
		});

		const books = pgTable("books", {
			columns: {
				name: text(),
			},
			primaryKey: ["name"],
		});

		const database = pgDatabase({
			tables: {
				users,
				books,
			},
		});

		const expected = [
			{
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_name_fullName_kinetic_pk" PRIMARY KEY ("name", "fullName")`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_name_fullName_kinetic_pk", ALTER COLUMN "name" DROP NOT NULL, ALTER COLUMN "fullName" DROP NOT NULL`.execute(db);',
				],
			},
			{
				priority: 4001,
				tableName: "books",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE books ADD CONSTRAINT "books_name_kinetic_pk" PRIMARY KEY ("name")`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE books DROP CONSTRAINT "books_name_kinetic_pk", ALTER COLUMN "name" DROP NOT NULL`.execute(db);',
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

	test<DbContext>("remove primary keys", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("fullName", "text")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addPrimaryKeyConstraint("users_name_fullName_kinetic_pk", [
				"name",
				"fullName",
			])
			.execute();

		await context.kysely.schema
			.createTable("books")
			.addColumn("name", "text")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_name_kinetic_pk", ["name"])
			.execute();

		const users = pgTable("users", {
			columns: {
				fullName: text(),
				name: text(),
			},
		});

		const books = pgTable("books", {
			columns: {
				name: text(),
			},
		});

		const database = pgDatabase({
			tables: {
				users,
				books,
			},
		});

		const expected = [
			{
				priority: 1004,
				tableName: "books",
				type: "dropPrimaryKey",
				up: [
					'await sql`ALTER TABLE books DROP CONSTRAINT "books_name_kinetic_pk", ALTER COLUMN "name" DROP NOT NULL`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE books ADD CONSTRAINT "books_name_kinetic_pk" PRIMARY KEY ("name")`.execute(db);',
				],
			},
			{
				priority: 1004,
				tableName: "users",
				type: "dropPrimaryKey",
				up: [
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_name_fullName_kinetic_pk", ALTER COLUMN "name" DROP NOT NULL, ALTER COLUMN "fullName" DROP NOT NULL`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_name_fullName_kinetic_pk" PRIMARY KEY ("name", "fullName")`.execute(db);',
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

	test<DbContext>("change primary key", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("fullName", "text")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addPrimaryKeyConstraint("users_name_fullName_kinetic_pk", [
				"name",
				"fullName",
			])
			.execute();

		const users = pgTable("users", {
			columns: {
				fullName: text(),
				name: text(),
			},
			primaryKey: ["name"],
		});

		const database = pgDatabase({
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 1004,
				tableName: "users",
				type: "dropPrimaryKey",
				up: [
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_name_fullName_kinetic_pk", ALTER COLUMN "name" DROP NOT NULL, ALTER COLUMN "fullName" DROP NOT NULL`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_name_fullName_kinetic_pk" PRIMARY KEY ("name", "fullName")`.execute(db);',
				],
			},
			{
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_name_kinetic_pk" PRIMARY KEY ("name")`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_name_kinetic_pk", ALTER COLUMN "name" DROP NOT NULL`.execute(db);',
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

	test<DbContext>("change a primary key and notNull on affected columns does not remove not null constraint", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("fullName", "text")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addPrimaryKeyConstraint("users_name_fullName_kinetic_pk", [
				"name",
				"fullName",
			])
			.execute();

		const users = pgTable("users", {
			columns: {
				fullName: text().notNull(),
				name: text(),
			},
			primaryKey: ["name"],
		});

		const database = pgDatabase({
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 1004,
				tableName: "users",
				type: "dropPrimaryKey",
				up: [
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_name_fullName_kinetic_pk", ALTER COLUMN "name" DROP NOT NULL`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_name_fullName_kinetic_pk" PRIMARY KEY ("name", "fullName")`.execute(db);',
				],
			},
			{
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_name_kinetic_pk" PRIMARY KEY ("name")`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_name_kinetic_pk", ALTER COLUMN "name" DROP NOT NULL`.execute(db);',
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

	test<DbContext>("change a primary key drops not null on affected columns with explicit notNull in new primary key", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("email", "text")
			.addColumn("name", "text")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addPrimaryKeyConstraint("users_name_kinetic_pk", ["name"])
			.execute();

		const users = pgTable("users", {
			columns: {
				name: text(),
				email: text().notNull(),
			},
			primaryKey: ["email"],
		});

		const database = pgDatabase({
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 1004,
				tableName: "users",
				type: "dropPrimaryKey",
				up: [
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_name_kinetic_pk", ALTER COLUMN "name" DROP NOT NULL`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_name_kinetic_pk" PRIMARY KEY ("name")`.execute(db);',
				],
			},
			{
				priority: 3008,
				tableName: "users",
				type: "changeColumn",
				up: [
					"await db.schema",
					'alterTable("users")',
					'alterColumn("email", (col) => col.setNotNull())',
					"execute();",
				],
				down: [
					"await db.schema",
					'alterTable("users")',
					'alterColumn("email", (col) => col.dropNotNull())',
					"execute();",
				],
			},
			{
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_email_kinetic_pk" PRIMARY KEY ("email")`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_email_kinetic_pk"`.execute(db);',
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
