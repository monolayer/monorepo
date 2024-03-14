/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { integer, text, varchar } from "~/schema/pg_column.js";
import { pgDatabase } from "~/schema/pg_database.js";
import { table } from "~/schema/pg_table.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration_success.js";
import { setUpContext, teardownContext } from "~tests/helpers/test_context.js";
import { type DbContext } from "~tests/setup/kysely.js";

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

		const database = pgDatabase({
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
				priority: 2002,
				tableName: "teams",
				type: "createColumn",
				up: [
					[
						"await db.schema",
						'alterTable("teams")',
						'addColumn("location", "text")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("teams")',
						'dropColumn("location")',
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
						'addColumn("email", "text")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropColumn("email")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected: expected,
			down: "reverse",
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

		const database = pgDatabase({
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
				type: "dropColumn",
				up: [
					[
						"await db.schema",
						'alterTable("teams")',
						'dropColumn("location")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("teams")',
						'addColumn("location", "text")',
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
						"await db.schema",
						'alterTable("users")',
						'dropColumn("email")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'addColumn("email", "text")',
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
	test<DbContext>("change column type", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.execute();

		const database = pgDatabase({
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
				type: "changeColumn",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						'alterColumn("name", (col) => col.setDataType("varchar"))',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'alterColumn("name", (col) => col.setDataType("text"))',
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

	test<DbContext>("change column default", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text", (col) => col.defaultTo(sql`'foo'::text`))
			.execute();

		await sql`COMMENT ON COLUMN "users"."name" IS 'ae72411e1dc17562b8fb4a6b3c7d1624992dcd4b3fc77ed828606c24a286cf4c'`.execute(
			context.kysely,
		);

		const database = pgDatabase({
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
				type: "changeColumn",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						"alterColumn(\"name\", (col) => col.setDefault(sql`'bar'::text`))",
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "users"."name" IS \'3aacbad971115c7afe985010204f7608c87986137124ed4732b058c685e67d0e\'`.execute(db);',
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						"alterColumn(\"name\", (col) => col.setDefault(sql`'foo'::text`))",
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "users"."name" IS \'ae72411e1dc17562b8fb4a6b3c7d1624992dcd4b3fc77ed828606c24a286cf4c\'`.execute(db);',
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

	test<DbContext>("change column nullable", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text", (col) => col.notNull())
			.addColumn("email", "text")
			.execute();

		const database = pgDatabase({
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
				type: "changeColumn",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						'alterColumn("email", (col) => col.setNotNull())',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'alterColumn("email", (col) => col.dropNotNull())',
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
						"await db.schema",
						'alterTable("users")',
						'alterColumn("name", (col) => col.dropNotNull())',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'alterColumn("name", (col) => col.setNotNull())',
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

	test<DbContext>("multiple changes on column", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text", (col) => col.defaultTo(sql`'foo'::text`))
			.execute();

		await sql`COMMENT ON COLUMN "users"."name" IS 'ae72411e1dc17562b8fb4a6b3c7d1624992dcd4b3fc77ed828606c24a286cf4c'`.execute(
			context.kysely,
		);

		const database = pgDatabase({
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
						"await db.schema",
						'alterTable("users")',
						'alterColumn("name", (col) => col.setDataType("text"))',
						"execute();",
					],
				],
				priority: 3001,
				tableName: "users",
				type: "changeColumn",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						'alterColumn("name", (col) => col.setDataType("varchar"))',
						"execute();",
					],
				],
			},
			{
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						"alterColumn(\"name\", (col) => col.setDefault(sql`'foo'::text`))",
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "users"."name" IS \'ae72411e1dc17562b8fb4a6b3c7d1624992dcd4b3fc77ed828606c24a286cf4c\'`.execute(db);',
					],
				],
				priority: 3007,
				tableName: "users",
				type: "changeColumn",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						"alterColumn(\"name\", (col) => col.setDefault(sql`'foo'::character varying`))",
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "users"."name" IS \'2bc6768278e7f14b6f18480c616c1687a575d330a2e8e471a48bede1a90d5720\'`.execute(db);',
					],
				],
			},
			{
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'alterColumn("name", (col) => col.dropNotNull())',
						"execute();",
					],
				],
				priority: 3008,
				tableName: "users",
				type: "changeColumn",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						'alterColumn("name", (col) => col.setNotNull())',
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
