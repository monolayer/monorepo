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
import { TestContext } from "~tests/__setup__/setup.js";

test<TestContext>("drop trigger", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`
          create extension "moddatetime";
          create table "public"."users" ("updatedAt" timestamp default now(), "updatedAtTwo" timestamp default now(), "id" integer);
          COMMENT ON COLUMN "public"."users"."updatedAt" IS \'28a4dae0\';
          COMMENT ON COLUMN "public"."users"."updatedAtTwo" IS \'28a4dae0\';
          CREATE OR REPLACE TRIGGER monolayer_trg_8659ae36\nBEFORE UPDATE ON "public"."users"\nFOR EACH ROW\nEXECUTE FUNCTION moddatetime("updatedAt");
          CREATE OR REPLACE TRIGGER monolayer_trg_7d730e02\nBEFORE UPDATE ON "public"."users"\nFOR EACH ROW\nEXECUTE FUNCTION moddatetime("updatedAtTwo");
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
						updatedAt: timestamp().default(sql`now()`),
						updatedAtTwo: timestamp().default(sql`now()`),
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
		expectedQueries: [
			'DROP TRIGGER monolayer_trg_7d730e02 ON "public"."users"',
		],
	});
});

test<TestContext>("drop all triggers", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`
          create extension "moddatetime";
          create table "public"."users" ("updatedAt" timestamp default now(), "updatedAtTwo" timestamp default now(), "id" integer);
          COMMENT ON COLUMN "public"."users"."updatedAt" IS \'28a4dae0\';
          COMMENT ON COLUMN "public"."users"."updatedAtTwo" IS \'28a4dae0\';
          CREATE OR REPLACE TRIGGER monolayer_trg_8659ae36\nBEFORE UPDATE ON "public"."users"\nFOR EACH ROW\nEXECUTE FUNCTION moddatetime("updatedAt");
          CREATE OR REPLACE TRIGGER monolayer_trg_7d730e02\nBEFORE UPDATE ON "public"."users"\nFOR EACH ROW\nEXECUTE FUNCTION moddatetime("updatedAtTwo");        `,
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
						updatedAt: timestamp().default(sql`now()`),
						updatedAtTwo: timestamp().default(sql`now()`),
					},
				}),
			},
		}),
		expectedQueries: [
			'DROP TRIGGER monolayer_trg_8659ae36 ON "public"."users"',
			'DROP TRIGGER monolayer_trg_7d730e02 ON "public"."users"',
		],
	});
});
