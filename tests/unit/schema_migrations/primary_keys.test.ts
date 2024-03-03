import { afterEach, beforeEach, describe, test } from "vitest";
import { pgText } from "~/database/schema/pg_column.js";
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

		const users = pgTable({
			columns: {
				fullName: pgText().primaryKey(),
				name: pgText().primaryKey(),
			},
		});

		const books = pgTable({
			columns: {
				name: pgText().primaryKey(),
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
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_fullName_name_kinetic_pk" PRIMARY KEY ("fullName", "name")`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_fullName_name_kinetic_pk", ALTER COLUMN "fullName" DROP NOT NULL, ALTER COLUMN "name" DROP NOT NULL`.execute(db);',
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
			.addPrimaryKeyConstraint("users_fullName_name_kinetic_pk", [
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

		const users = pgTable({
			columns: {
				fullName: pgText(),
				name: pgText(),
			},
		});

		const books = pgTable({
			columns: {
				name: pgText(),
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
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_fullName_name_kinetic_pk", ALTER COLUMN "fullName" DROP NOT NULL, ALTER COLUMN "name" DROP NOT NULL`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_fullName_name_kinetic_pk" PRIMARY KEY ("fullName", "name")`.execute(db);',
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
			.addPrimaryKeyConstraint("users_fullName_name_kinetic_pk", [
				"name",
				"fullName",
			])
			.execute();

		const users = pgTable({
			columns: {
				fullName: pgText(),
				name: pgText().primaryKey(),
			},
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
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_fullName_name_kinetic_pk", ALTER COLUMN "fullName" DROP NOT NULL, ALTER COLUMN "name" DROP NOT NULL`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_fullName_name_kinetic_pk" PRIMARY KEY ("fullName", "name")`.execute(db);',
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
			.addPrimaryKeyConstraint("users_fullName_name_kinetic_pk", [
				"name",
				"fullName",
			])
			.execute();

		const users = pgTable({
			columns: {
				fullName: pgText().notNull(),
				name: pgText().primaryKey(),
			},
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
					'await sql`ALTER TABLE users DROP CONSTRAINT "users_fullName_name_kinetic_pk", ALTER COLUMN "name" DROP NOT NULL`.execute(db);',
				],
				down: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_fullName_name_kinetic_pk" PRIMARY KEY ("fullName", "name")`.execute(db);',
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

		const users = pgTable({
			columns: {
				name: pgText(),
				email: pgText().notNull().primaryKey(),
			},
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
