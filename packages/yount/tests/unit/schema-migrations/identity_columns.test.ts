/* eslint-disable max-lines */
import { afterEach, beforeEach, describe, test } from "vitest";
import { schema } from "~/schema/schema.js";
import { integer } from "~/schema/table/column/data-types/integer.js";
import { table } from "~/schema/table/table.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration-success.js";
import { setUpContext, teardownContext } from "~tests/helpers/test-context.js";
import { type DbContext } from "~tests/setup/kysely.js";

describe("Identity columns", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("add", async (context) => {
		await context.kysely.schema.createTable("users").execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						count: integer().generatedByDefaultAsIdentity(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 2002,
				tableName: "users",
				type: "createColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("id", "integer", (col) => col.notNull().generatedAlwaysAsIdentity())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("id")',
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
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("count", "integer", (col) => col.notNull().generatedByDefaultAsIdentity())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("count")',
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

	test<DbContext>("remove", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer", (col) =>
				col.notNull().generatedAlwaysAsIdentity(),
			)
			.addColumn("count", "integer", (col) =>
				col.notNull().generatedByDefaultAsIdentity(),
			)
			.execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {},
				}),
			},
		});

		const expected = [
			{
				priority: 1005,
				tableName: "users",
				type: "dropColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("count")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("count", "integer", (col) => col.notNull().generatedByDefaultAsIdentity())',
						"execute();",
					],
				],
			},
			{
				priority: 1005,
				tableName: "users",
				type: "dropColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("id", "integer", (col) => col.notNull().generatedAlwaysAsIdentity())',
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

	test<DbContext>("change into", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("count", "integer")
			.execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						count: integer().generatedByDefaultAsIdentity(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 3008,
				tableName: "users",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("count", (col) => col.setNotNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("count", (col) => col.dropNotNull())',
						"execute();",
					],
				],
			},
			{
				priority: 3008,
				tableName: "users",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("id", (col) => col.setNotNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("id", (col) => col.dropNotNull())',
						"execute();",
					],
				],
			},
			{
				priority: 3009,
				tableName: "users",
				type: "changeColumn",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" ALTER COLUMN "count" ADD GENERATED BY DEFAULT AS IDENTITY`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" ALTER COLUMN "count" DROP IDENTITY`',
						"execute(db);",
					],
				],
			},
			{
				priority: 3009,
				tableName: "users",
				type: "changeColumn",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" ALTER COLUMN "id" DROP IDENTITY`',
						"execute(db);",
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

	test<DbContext>("change from", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer", (col) =>
				col.notNull().generatedAlwaysAsIdentity(),
			)
			.addColumn("count", "integer", (col) =>
				col.notNull().generatedByDefaultAsIdentity(),
			)
			.execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
						count: integer(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 3004,
				tableName: "users",
				type: "changeColumn",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" ALTER COLUMN "count" DROP IDENTITY`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" ALTER COLUMN "count" ADD GENERATED BY DEFAULT AS IDENTITY`',
						"execute(db);",
					],
				],
			},
			{
				priority: 3004,
				tableName: "users",
				type: "changeColumn",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" ALTER COLUMN "id" DROP IDENTITY`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY`',
						"execute(db);",
					],
				],
			},
			{
				priority: 3008,
				tableName: "users",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("count", (col) => col.dropNotNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("count", (col) => col.setNotNull())',
						"execute();",
					],
				],
			},
			{
				priority: 3008,
				tableName: "users",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("id", (col) => col.dropNotNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("id", (col) => col.setNotNull())',
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
