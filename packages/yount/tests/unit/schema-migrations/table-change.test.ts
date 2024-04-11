/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { extension } from "~/schema/extension/extension.js";
import { schema } from "~/schema/schema.js";
import { varchar } from "~/schema/table/column/data-types/character-varying.js";
import { integer } from "~/schema/table/column/data-types/integer.js";
import { text } from "~/schema/table/column/data-types/text.js";
import { timestamp } from "~/schema/table/column/data-types/timestamp.js";
import { table } from "~/schema/table/table.js";
import { trigger } from "~/schema/table/trigger/trigger.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration-success.js";
import { setUpContext, teardownContext } from "~tests/helpers/test-context.js";
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
				priority: 2002,
				tableName: "teams",
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
				priority: 2002,
				tableName: "users",
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
			connector: { schemas: [dbSchema] },
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
				type: "dropColumn",
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
				type: "dropColumn",
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
			connector: { schemas: [dbSchema] },
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
			connector: { schemas: [dbSchema] },
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
			connector: { schemas: [dbSchema] },
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
			connector: { schemas: [dbSchema] },
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
			connector: { schemas: [dbSchema] },
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
			connector: { schemas: [dbSchema] },
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
			connector: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("add trigger", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))
			.addColumn("updatedAtTwo", "timestamp", (col) =>
				col.defaultTo(sql`now()`),
			)
			.execute();

		await sql`COMMENT ON COLUMN "users"."updatedAt" IS \'28a4dae0\'`.execute(
			context.kysely,
		);

		await sql`COMMENT ON COLUMN "users"."updatedAtTwo" IS \'28a4dae0\'`.execute(
			context.kysely,
		);

		await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(
			context.kysely,
		);

		await sql`
		CREATE OR REPLACE TRIGGER foo_before_update_trg
		BEFORE UPDATE ON users
		FOR EACH ROW
		EXECUTE FUNCTION moddatetime(updatedAt);
		COMMENT ON TRIGGER foo_before_update_trg ON users IS 'b97b23ad';
		`.execute(context.kysely);

		const dbSchema = schema({
			extensions: [extension("moddatetime")],
			tables: {
				users: table({
					columns: {
						name: text(),
						updatedAt: timestamp().default(sql`now()`),
						updatedAtTwo: timestamp().default(sql`now()`),
					},
					triggers: {
						foo_before_update: trigger()
							.fireWhen("before")
							.events(["update"])
							.forEach("row")
							.function("moddatetime", [{ column: "updatedAt" }]),
						foo_before_update_two: trigger()
							.fireWhen("before")
							.events(["update"])
							.forEach("row")
							.function("moddatetime", [{ column: "updatedAtTwo" }]),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 4004,
				tableName: "users",
				type: "createTrigger",
				up: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER foo_before_update_two_trg
BEFORE UPDATE ON "public"."users"
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updatedAtTwo')\``,
						`execute(db);`,
					],
					[
						`await sql\`COMMENT ON TRIGGER foo_before_update_two_trg ON "public"."users" IS '20c3fd54'\``,
						`execute(db);`,
					],
				],
				down: [
					[
						'await sql`DROP TRIGGER foo_before_update_two_trg ON "public"."users"`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
		});
	});

	test<DbContext>("remove trigger", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))
			.addColumn("updatedAtTwo", "timestamp", (col) =>
				col.defaultTo(sql`now()`),
			)
			.execute();

		await sql`COMMENT ON COLUMN "users"."updatedAt" IS \'28a4dae0\'`.execute(
			context.kysely,
		);

		await sql`COMMENT ON COLUMN "users"."updatedAtTwo" IS \'28a4dae0\'`.execute(
			context.kysely,
		);

		await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(
			context.kysely,
		);

		await sql`
			CREATE OR REPLACE TRIGGER foo_before_update_trg
			BEFORE UPDATE ON users
			FOR EACH ROW
			EXECUTE FUNCTION moddatetime('updatedAt');
			COMMENT ON TRIGGER foo_before_update_trg ON users IS 'b97b23ad';
		`.execute(context.kysely);

		await sql`
			CREATE OR REPLACE TRIGGER foo_before_update_two_trg
			BEFORE UPDATE ON users
			FOR EACH ROW
			EXECUTE FUNCTION moddatetime('updatedAtTwo');
			COMMENT ON TRIGGER foo_before_update_two_trg ON users IS '3893aa32';
			`.execute(context.kysely);

		const dbSchema = schema({
			extensions: [extension("moddatetime")],
			tables: {
				users: table({
					columns: {
						name: text(),
						updatedAt: timestamp().default(sql`now()`),
						updatedAtTwo: timestamp().default(sql`now()`),
					},
					triggers: {
						foo_before_update: trigger()
							.fireWhen("before")
							.events(["update"])
							.forEach("row")
							.function("moddatetime", [{ column: "updatedAt" }]),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 1001,
				tableName: "users",
				type: "dropTrigger",
				up: [
					[
						'await sql`DROP TRIGGER foo_before_update_two_trg ON "public"."users"`',
						"execute(db);",
					],
				],
				down: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER foo_before_update_two_trg BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedAtTwo')\``,
						`execute(db);`,
					],
					[
						`await sql\`COMMENT ON TRIGGER foo_before_update_two_trg ON "public"."users" IS '3893aa32'\``,
						`execute(db);`,
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
		});
	});
});
