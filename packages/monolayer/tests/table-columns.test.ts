/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { varchar } from "~/database/schema/table/column/data-types/character-varying.js";
import { integer } from "~/database/schema/table/column/data-types/integer.js";
import { text } from "~/database/schema/table/column/data-types/text.js";
import { table } from "~/database/schema/table/table.js";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("Table change migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("add columns", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.execute();

		await context.kysely.schema
			.createTable("teams")
			.addColumn("id", "integer")
			.execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						name: text(),
						email: text(),
					},
				}),
				teams: table({
					columns: {
						id: integer(),
						location: text(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 2003,
				tableName: "teams",
				currentTableName: "teams",
				schemaName: "public",
				type: "createColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("teams")',
						'addColumn("location", "text")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("teams")',
						'dropColumn("location")',
						"execute();",
					],
				],
			},
			{
				priority: 2003,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("email", "text")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("email")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
		});
	});

	test<DbContext>("remove columns", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("email", "text")
			.execute();

		await context.kysely.schema
			.createTable("teams")
			.addColumn("id", "integer")
			.addColumn("location", "text")
			.execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						name: text(),
					},
				}),
				teams: table({
					columns: {
						id: integer(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 1005,
				tableName: "teams",
				currentTableName: "teams",
				schemaName: "public",
				type: "dropColumn",
				warnings: [
					{
						code: "D003",
						column: "location",
						schema: "public",
						table: "teams",
						type: "destructive",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("teams")',
						'dropColumn("location")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("teams")',
						'addColumn("location", "text")',
						"execute();",
					],
				],
			},
			{
				priority: 1005,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "dropColumn",
				warnings: [
					{
						code: "D003",
						column: "email",
						schema: "public",
						table: "users",
						type: "destructive",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("email")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("email", "text")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("change column type", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						name: varchar(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 3001,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("name", (col) => col.setDataType(sql`character varying`))',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("name", (col) => col.setDataType(sql`text`))',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("change column default", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text", (col) => col.defaultTo(sql`'foo'::text`))
			.execute();

		await sql`COMMENT ON COLUMN "users"."name" IS 'ae72411e'`.execute(
			context.kysely,
		);

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						name: text().default("bar"),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 3007,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						"alterColumn(\"name\", (col) => col.setDefault(sql`'bar'::text`))",
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."name" IS \'3aacbad9\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						"alterColumn(\"name\", (col) => col.setDefault(sql`'foo'::text`))",
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."name" IS \'ae72411e\'`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("add column default", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						name: text().default("bar"),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 3005,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						"alterColumn(\"name\", (col) => col.setDefault(sql`'bar'::text`))",
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."name" IS \'3aacbad9\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("name", (col) => col.dropDefault())',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("drop column default", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text", (col) => col.defaultTo(sql`'foo'::text`))
			.execute();

		await sql`COMMENT ON COLUMN "users"."name" IS 'ae72411e'`.execute(
			context.kysely,
		);

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						name: text(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 3006,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("name", (col) => col.dropDefault())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						"alterColumn(\"name\", (col) => col.setDefault(sql`'foo'::text`))",
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."name" IS \'ae72411e\'`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("change column nullable", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text", (col) => col.notNull())
			.addColumn("email", "text")
			.execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						name: text(),
						email: text().notNull(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 3008,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("email", (col) => col.setNotNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("email", (col) => col.dropNotNull())',
						"execute();",
					],
				],
			},
			{
				priority: 3008,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("name", (col) => col.dropNotNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("name", (col) => col.setNotNull())',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("multiple changes on column", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text", (col) => col.defaultTo(sql`'foo'::text`))
			.execute();

		await sql`COMMENT ON COLUMN "users"."name" IS 'ae72411e'`.execute(
			context.kysely,
		);

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						name: varchar().default("foo").notNull(),
					},
				}),
			},
		});

		const expected = [
			{
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("name", (col) => col.setDataType(sql`text`))',
						"execute();",
					],
				],
				priority: 3001,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("name", (col) => col.setDataType(sql`character varying`))',
						"execute();",
					],
				],
			},
			{
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						"alterColumn(\"name\", (col) => col.setDefault(sql`'foo'::text`))",
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."name" IS \'ae72411e\'`',
						"execute(db);",
					],
				],
				priority: 3007,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						"alterColumn(\"name\", (col) => col.setDefault(sql`'foo'::character varying`))",
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."name" IS \'2bc67682\'`',
						"execute(db);",
					],
				],
			},
			{
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("name", (col) => col.dropNotNull())',
						"execute();",
					],
				],
				priority: 3008,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("name", (col) => col.setNotNull())',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});
});
