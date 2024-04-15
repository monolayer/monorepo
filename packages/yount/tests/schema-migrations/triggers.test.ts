import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { extension } from "~/database/extension/extension.js";
import { schema } from "~/database/schema/schema.js";
import { integer } from "~/database/schema/table/column/data-types/integer.js";
import { timestamp } from "~/database/schema/table/column/data-types/timestamp.js";
import { table } from "~/database/schema/table/table.js";
import { trigger } from "~/database/schema/table/trigger/trigger.js";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "../__setup__/helpers/test-context.js";

describe("Database migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("add trigger", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("updatedAt", "timestamp", (col) =>
				col.defaultTo(sql`CURRENT_TIMESTAMP`),
			)
			.execute();

		await sql`COMMENT ON COLUMN "users"."updatedAt" IS '9ff7b5b7'`.execute(
			context.kysely,
		);

		const users = table({
			columns: {
				id: integer(),
				updatedAt: timestamp().default(sql`CURRENT_TIMESTAMP`),
			},
			triggers: {
				foo_before_update: trigger()
					.fireWhen("before")
					.events(["update"])
					.forEach("row")
					.function("moddatetime", [{ column: "updatedAt" }]),
				foo_after_update: trigger()
					.fireWhen("after")
					.events(["update"])
					.forEach("row")
					.function("moddatetime", [{ column: "updatedAt" }]),
			},
		});

		const dbSchema = schema({
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 0,
				tableName: "none",
				type: "createExtension",
				up: [
					[
						"await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`",
						"execute(db);",
					],
				],
				down: [
					["await sql`DROP EXTENSION IF EXISTS moddatetime;`", "execute(db);"],
				],
			},
			{
				priority: 4004,
				tableName: "users",
				type: "createTrigger",
				up: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER foo_before_update_trg
BEFORE UPDATE ON "public"."users"
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updatedAt')\``,
						`execute(db);`,
					],
					[
						`await sql\`COMMENT ON TRIGGER foo_before_update_trg ON "public"."users" IS 'b97b23ad';\``,
						`execute(db);`,
					],
				],
				down: [
					[
						'await sql`DROP TRIGGER foo_before_update_trg ON "public"."users"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 4004,
				tableName: "users",
				type: "createTrigger",
				up: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER foo_after_update_trg
AFTER UPDATE ON "public"."users"
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updatedAt')\``,
						`execute(db);`,
					],
					[
						`await sql\`COMMENT ON TRIGGER foo_after_update_trg ON "public"."users" IS '289c6ee1';\``,
						`execute(db);`,
					],
				],
				down: [
					[
						'await sql`DROP TRIGGER foo_after_update_trg ON "public"."users"`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				extensions: [extension("moddatetime")],
			},
			expected,
			down: "same",
		});
	});

	test<DbContext>("drop trigger", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))
			.execute();

		await sql`COMMENT ON COLUMN "users"."updatedAt" IS '28a4dae0'`.execute(
			context.kysely,
		);

		await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(
			context.kysely,
		);

		await sql`CREATE OR REPLACE TRIGGER foo_before_update_trg
								BEFORE UPDATE ON users
								FOR EACH ROW
								EXECUTE FUNCTION moddatetime(updatedAt);
								COMMENT ON TRIGGER foo_before_update_trg ON users IS 'c2304485eb6b41782bcb408b5118bc67aca3fae9eb9210ad78ce93ddbf438f67';`.execute(
			context.kysely,
		);

		await sql`CREATE OR REPLACE TRIGGER foo_after_update_trg
								AFTER UPDATE ON users
								FOR EACH ROW
								EXECUTE FUNCTION moddatetime(updatedAt);
								COMMENT ON TRIGGER foo_after_update_trg ON users IS '9463c7cd1a3fb577535fade640246675d0ac4097b6ed86ae9452363b82e43b0f';`.execute(
			context.kysely,
		);

		const users = table({
			columns: {
				id: integer(),
				updatedAt: timestamp().default(sql`now()`),
			},
		});

		const dbSchema = schema({
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 1001,
				tableName: "users",
				type: "dropTrigger",
				up: [
					[
						'await sql`DROP TRIGGER foo_before_update_trg ON "public"."users"`',
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`CREATE OR REPLACE TRIGGER foo_before_update_trg BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedat')`",
						"execute(db);",
					],
					[
						'await sql`COMMENT ON TRIGGER foo_before_update_trg ON "public"."users" IS \'c2304485eb6b41782bcb408b5118bc67aca3fae9eb9210ad78ce93ddbf438f67\'`',
						"execute(db);",
					],
				],
			},
			{
				priority: 1001,
				tableName: "users",
				type: "dropTrigger",
				up: [
					[
						'await sql`DROP TRIGGER foo_after_update_trg ON "public"."users"`',
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`CREATE OR REPLACE TRIGGER foo_after_update_trg AFTER UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedat')`",
						"execute(db);",
					],
					[
						'await sql`COMMENT ON TRIGGER foo_after_update_trg ON "public"."users" IS \'9463c7cd1a3fb577535fade640246675d0ac4097b6ed86ae9452363b82e43b0f\'`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				extensions: [extension("moddatetime")],
			},
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("change trigger", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))
			.execute();

		await sql`COMMENT ON COLUMN "users"."updatedAt" IS '28a4dae0'`.execute(
			context.kysely,
		);

		await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(
			context.kysely,
		);

		await sql`CREATE OR REPLACE TRIGGER foo_before_update_trg
								BEFORE UPDATE ON users
								FOR EACH ROW
								EXECUTE FUNCTION moddatetime(updatedAt);
								COMMENT ON TRIGGER foo_before_update_trg ON users IS 'c2304485eb6b41782bcb408b5118bc67aca3fae9eb9210ad78ce93ddbf438f67';`.execute(
			context.kysely,
		);

		const users = table({
			columns: {
				id: integer(),
				updatedAt: timestamp().default(sql`now()`),
			},
			triggers: {
				foo_before_update: trigger()
					.fireWhen("after")
					.events(["update"])
					.forEach("row")
					.function("moddatetime", [{ column: "updatedAt" }]),
			},
		});

		const dbSchema = schema({
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 5003,
				tableName: "users",
				type: "updateTrigger",
				up: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER foo_before_update_trg
AFTER UPDATE ON "public"."users"
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updatedAt')\``,
						`execute(db);`,
					],
					[
						`await sql\`COMMENT ON TRIGGER foo_before_update_trg ON "public"."users" IS 'd52067a3'\``,
						`execute(db);`,
					],
				],
				down: [
					[
						"await sql`CREATE OR REPLACE TRIGGER foo_before_update_trg BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedat')`",
						"execute(db);",
					],
					[
						'await sql`COMMENT ON TRIGGER foo_before_update_trg ON "public"."users" IS \'c2304485eb6b41782bcb408b5118bc67aca3fae9eb9210ad78ce93ddbf438f67\'`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				extensions: [extension("moddatetime")],
			},
			expected,
			down: "same",
		});
	});
});