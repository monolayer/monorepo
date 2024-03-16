/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { integer, text, timestamp, varchar } from "~/schema/pg_column.js";
import { pgDatabase } from "~/schema/pg_database.js";
import { extension } from "~/schema/pg_extension.js";
import { table } from "~/schema/pg_table.js";
import { trigger } from "~/schema/pg_trigger.js";
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

	test<DbContext>("add column default", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.execute();

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
				priority: 3005,
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
						'alterColumn("name", (col) => col.dropDefault())',
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

	test<DbContext>("drop column default", async (context) => {
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
						"await db.schema",
						'alterTable("users")',
						'alterColumn("name", (col) => col.dropDefault())',
						"execute();",
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

	test<DbContext>("add trigger", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))
			.addColumn("updatedAtTwo", "timestamp", (col) =>
				col.defaultTo(sql`now()`),
			)
			.execute();

		await sql`COMMENT ON COLUMN "users"."updatedAt" IS \'28a4dae0461e17af56e979c2095abfbe0bfc45fe9ca8abf3144338a518a1bb8f\'`.execute(
			context.kysely,
		);

		await sql`COMMENT ON COLUMN "users"."updatedAtTwo" IS \'28a4dae0461e17af56e979c2095abfbe0bfc45fe9ca8abf3144338a518a1bb8f\'`.execute(
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
		COMMENT ON TRIGGER foo_before_update_trg ON users IS '10989c272b6a6d0fd27c4c8374d3fa195f2f807743dc05c6862407641426841a';
		`.execute(context.kysely);

		const database = pgDatabase({
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
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updatedAtTwo');COMMENT ON TRIGGER foo_before_update_two_trg ON users IS '4127b96840bff9ed3b7a45a66674d6934fd5507e7999c946416d53122eb5f3c8';\`.execute(db);`,
					],
				],
				down: [
					[
						"await sql`DROP TRIGGER foo_before_update_two_trg ON users`.execute(db);",
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

	test<DbContext>("remove trigger", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))
			.addColumn("updatedAtTwo", "timestamp", (col) =>
				col.defaultTo(sql`now()`),
			)
			.execute();

		await sql`COMMENT ON COLUMN "users"."updatedAt" IS \'28a4dae0461e17af56e979c2095abfbe0bfc45fe9ca8abf3144338a518a1bb8f\'`.execute(
			context.kysely,
		);

		await sql`COMMENT ON COLUMN "users"."updatedAtTwo" IS \'28a4dae0461e17af56e979c2095abfbe0bfc45fe9ca8abf3144338a518a1bb8f\'`.execute(
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
			COMMENT ON TRIGGER foo_before_update_trg ON users IS '10989c272b6a6d0fd27c4c8374d3fa195f2f807743dc05c6862407641426841a';
		`.execute(context.kysely);

		await sql`
			CREATE OR REPLACE TRIGGER foo_before_update_two_trg
			BEFORE UPDATE ON users
			FOR EACH ROW
			EXECUTE FUNCTION moddatetime('updatedAtTwo');
			COMMENT ON TRIGGER foo_before_update_two_trg ON users IS '3893aa32f824766d1976e3892c630ab15d2f0ee02332085fcffabd1a29ef3e65';
			`.execute(context.kysely);

		const database = pgDatabase({
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
						"await sql`DROP TRIGGER foo_before_update_two_trg ON users`.execute(db);",
					],
				],
				down: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER foo_before_update_two_trg BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedAtTwo');COMMENT ON TRIGGER foo_before_update_two_trg ON users IS '3893aa32f824766d1976e3892c630ab15d2f0ee02332085fcffabd1a29ef3e65';\`.execute(db);`,
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
});
