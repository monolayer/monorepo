import {
	extension,
	integer,
	timestamp,
	trigger,
} from "@monorepo/pg/api/schema.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { test } from "vitest";
import { assertSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";
import {
	columnRename,
	tableRename,
} from "~tests/__setup__/helpers/factories/renames.js";
import { TestContext } from "~tests/__setup__/setup.js";

test<TestContext>("rename trigger on table name change", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`
          create extension "moddatetime";
          create table "public"."users" ("updatedAt" timestamp default now(), "id" integer);
          COMMENT ON COLUMN "public"."users"."updatedAt" IS \'28a4dae0\';
					CREATE OR REPLACE TRIGGER monolayer_trg_8659ae36 BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION moddatetime("updatedAt");
          `,
				)
				.execute(context.dbClient);
		},
		context,
		extensions: [extension("moddatetime")],
		schema: schema({
			tables: {
				accounts: table({
					columns: {
						id: integer(),
						updatedAt: timestamp().default(sql`now()`),
					},
					triggers: [
						trigger({
							fireWhen: "before",
							events: ["update"],
							forEach: "row",
							function: {
								name: "moddatetime",
								args: [sql.ref("updatedAt")],
							},
						}),
					],
				}),
			},
		}),
		renames: {
			tables: [tableRename("public", "users", "accounts")],
		},
		expectedQueries: [
			'alter table "public"."users" rename to "accounts"',
			'ALTER TRIGGER "monolayer_trg_8659ae36" ON "public"."accounts" RENAME TO "monolayer_trg_8fd2c340"',
		],
	});
});

test<TestContext>("replace trigger on column name change", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`
          create extension "moddatetime";
          create table "public"."users" ("updatedAt" timestamp default now(), "id" integer);
          COMMENT ON COLUMN "public"."users"."updatedAt" IS \'28a4dae0\';
					CREATE OR REPLACE TRIGGER monolayer_trg_8659ae36 BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION moddatetime("updatedAt");
          `,
				)
				.execute(context.dbClient);
		},
		context,
		extensions: [extension("moddatetime")],
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
						updatedAtNew: timestamp().default(sql`now()`),
					},
					triggers: [
						trigger({
							fireWhen: "before",
							events: ["update"],
							forEach: "row",
							function: {
								name: "moddatetime",
								args: [sql.ref("updatedAtNew")],
							},
						}),
					],
				}),
			},
		}),
		renames: {
			tables: [],
			columns: {
				"public.users": [
					columnRename("public", "users", "updatedAt", "updatedAtNew"),
				],
			},
		},
		expectedQueries: [
			'alter table "public"."users" rename column "updatedAt" to "updatedAtNew"',
			'CREATE OR REPLACE TRIGGER monolayer_trg_0a0ff000\nBEFORE UPDATE ON "public"."users"\nFOR EACH ROW\nEXECUTE FUNCTION moddatetime("updatedAtNew")',
			'DROP TRIGGER monolayer_trg_8659ae36 ON "public"."users"',
		],
	});
});

test<TestContext>("replace trigger on table column name change", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`
          create extension "moddatetime";
          create table "public"."users" ("updatedAt" timestamp default now(), "id" integer);
          COMMENT ON COLUMN "public"."users"."updatedAt" IS \'28a4dae0\';
					CREATE OR REPLACE TRIGGER monolayer_trg_8659ae36 BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION moddatetime("updatedAt");
          `,
				)
				.execute(context.dbClient);
		},
		context,
		extensions: [extension("moddatetime")],
		schema: schema({
			tables: {
				accounts: table({
					columns: {
						id: integer(),
						updatedAtNew: timestamp().default(sql`now()`),
					},
					triggers: [
						trigger({
							fireWhen: "before",
							events: ["update"],
							forEach: "row",
							function: {
								name: "moddatetime",
								args: [sql.ref("updatedAtNew")],
							},
						}),
					],
				}),
			},
		}),
		renames: {
			tables: [tableRename("public", "users", "accounts")],
			columns: {
				"public.accounts": [
					columnRename("public", "users", "updatedAt", "updatedAtNew"),
				],
			},
		},
		expectedQueries: [
			'alter table "public"."users" rename to "accounts"',
			'alter table "public"."accounts" rename column "updatedAt" to "updatedAtNew"',
			'CREATE OR REPLACE TRIGGER monolayer_trg_e1068b15\nBEFORE UPDATE ON "public"."accounts"\nFOR EACH ROW\nEXECUTE FUNCTION moddatetime("updatedAtNew")',
			'DROP TRIGGER monolayer_trg_8659ae36 ON "public"."accounts"',
		],
	});
});
