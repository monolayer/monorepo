/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { schema } from "~/schema/schema.js";
import { integer } from "~/schema/table/column/data-types/integer.js";
import { serial } from "~/schema/table/column/data-types/serial.js";
import { check } from "~/schema/table/constraints/check/check.js";
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

	test<DbContext>("add check constraints", async (context) => {
		const firstCheck = check(sql`${sql.ref("id")} > 50`);
		const secondCheck = check(sql`${sql.ref("id")} < 50000`);

		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("918b4271_yount_chk", sql`"id" > 50`)
			.execute();

		await sql`COMMENT ON CONSTRAINT "918b4271_yount_chk" ON "books" IS \'918b4271\'`.execute(
			context.kysely,
		);

		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				checks: [firstCheck, secondCheck],
			},
		});

		const dbSchema = schema({
			tables: {
				books,
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
						'addCheckConstraint("e37c55a5_yount_chk", sql`"id" < 50000`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON CONSTRAINT "e37c55a5_yount_chk" ON "public"."books" IS \'e37c55a5\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("e37c55a5_yount_chk")',
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

	test<DbContext>("add multiple first check constraints", async (context) => {
		const firstCheck = check(sql`${sql.ref("id")} > 50`);
		const secondCheck = check(sql`${sql.ref("id")} < 50000`);

		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				checks: [firstCheck, secondCheck],
			},
		});

		const dbSchema = schema({
			tables: {
				books,
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
						'addCheckConstraint("918b4271_yount_chk", sql`"id" > 50`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON CONSTRAINT "918b4271_yount_chk" ON "public"."books" IS \'918b4271\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("918b4271_yount_chk")',
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
						'addCheckConstraint("e37c55a5_yount_chk", sql`"id" < 50000`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON CONSTRAINT "e37c55a5_yount_chk" ON "public"."books" IS \'e37c55a5\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("e37c55a5_yount_chk")',
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

	test<DbContext>("remove check constraints", async (context) => {
		const firstCheck = check(sql`"id" > 5`);

		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("2f1f415e_yount_chk", sql`"id" > 5`)
			.execute();

		await sql`COMMENT ON CONSTRAINT "2f1f415e_yount_chk" ON "books" IS \'2f1f415e\'`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("e37c55a5_yount_chk", sql`"id" < 50000`)
			.execute();

		await sql`COMMENT ON CONSTRAINT "e37c55a5_yount_chk" ON "books" IS \'e37c55a5\'`.execute(
			context.kysely,
		);

		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				checks: [firstCheck],
			},
		});

		const dbSchema = schema({
			tables: {
				books,
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
						'dropConstraint("e37c55a5_yount_chk")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "e37c55a5_yount_chk" CHECK ((id < 50000))`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON CONSTRAINT "e37c55a5_yount_chk" ON "public"."books" IS \'e37c55a5\'`',
						"execute(db);",
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

	test<DbContext>("remove all check constraints from table", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("918b4271_yount_chk", sql`"id" < 50000`)
			.execute();

		await sql`COMMENT ON CONSTRAINT "918b4271_yount_chk" ON "books" IS \'918b4271\'`.execute(
			context.kysely,
		);

		const books = table({
			columns: {
				id: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				books,
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
						'dropConstraint("918b4271_yount_chk")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "918b4271_yount_chk" CHECK ((id < 50000))`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON CONSTRAINT "918b4271_yount_chk" ON "public"."books" IS \'918b4271\'`',
						"execute(db);",
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

	test<DbContext>("add check constraints across schemas", async (context) => {
		const users = table({
			columns: {
				id: serial(),
			},
			constraints: {
				checks: [check(sql`${sql.ref("id")} > 50`)],
			},
		});

		const dbSchema = schema({
			tables: {
				users,
			},
		});

		const usersSchema = schema({
			name: "users",
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 2001,
				tableName: "users",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
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
						'addCheckConstraint("918b4271_yount_chk", sql`"id" > 50`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON CONSTRAINT "918b4271_yount_chk" ON "public"."users" IS \'918b4271\'`',
						"execute(db);",
					],
				],
				down: [[]],
			},
			{
				priority: 0,
				tableName: "none",
				type: "createSchema",
				up: [
					['await sql`CREATE SCHEMA IF NOT EXISTS "users";`', "execute(db);"],
				],
				down: [],
			},
			{
				priority: 2001,
				tableName: "users",
				type: "createTable",
				up: [
					[
						'await db.withSchema("users").schema',
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("users").schema',
						'dropTable("users")',
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
						'await db.withSchema("users").schema',
						'alterTable("users")',
						'addCheckConstraint("918b4271_yount_chk", sql`"id" > 50`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON CONSTRAINT "918b4271_yount_chk" ON "users"."users" IS \'918b4271\'`',
						"execute(db);",
					],
				],
				down: [[]],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema, usersSchema] },
			expected,
			down: "same",
		});
	});
});
