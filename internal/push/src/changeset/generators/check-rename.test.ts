import { check, integer, text } from "@monorepo/pg/api/schema.js";
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

test<TestContext>("rename check constraint when renaming table", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"count" integer, "name" text not null,
									constraint "users_6938566b_monolayer_chk" check ("count" > 0)
								);`,
				)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				accounts: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						name: text().notNull(),
						count: integer(),
					},
					constraints: {
						checks: [check(sql`${sql.ref("count")} > 0`)],
					},
				}),
			},
		}),
		renames: {
			tables: [tableRename("public", "users", "accounts")],
		},
		expectedQueries: ['alter table "public"."users" rename to "accounts"'],
		assertDatabase: async ({ assert, refute }) => {
			await assert.constraint(
				"accounts_6938566b_monolayer_chk",
				"public.accounts",
			);
			await refute.constraint(
				"users_6938566b_monolayer_chk",
				"public.accounts",
			);
		},
	});
});

test<TestContext>("rename check constraint when renaming column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"count" integer, "name" text not null,
									constraint "users_6938566b_monolayer_chk" check ("count" > 0)
								);`,
				)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						name: text().notNull(),
						demo: integer(),
					},
					constraints: {
						checks: [check(sql`${sql.ref("demo")} > 0`)],
					},
				}),
			},
		}),
		renames: {
			tables: [],
			columns: {
				"public.users": [columnRename("public", "users", "count", "demo")],
			},
		},
		expectedQueries: [
			'alter table "public"."users" rename column "count" to "demo"',
			'alter table "public"."users" RENAME CONSTRAINT "users_6938566b_monolayer_chk" TO "users_3a87c81c_monolayer_chk"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await assert.constraint("users_3a87c81c_monolayer_chk", "public.users");
			await refute.constraint("users_6938566b_monolayer_chk", "public.users");
		},
	});
});

test<TestContext>("rename check constraint when renaming table and column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"count" integer, "name" text not null,
									constraint "users_6938566b_monolayer_chk" check ("count" > 0)
								);`,
				)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				accounts: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						name: text().notNull(),
						demo: integer(),
					},
					constraints: {
						checks: [check(sql`${sql.ref("demo")} > 0`)],
					},
				}),
			},
		}),
		renames: {
			tables: [tableRename("public", "users", "accounts")],
			columns: {
				"public.accounts": [
					columnRename("public", "accounts", "count", "demo"),
				],
			},
		},
		expectedQueries: [
			'alter table "public"."users" rename to "accounts"',
			'alter table "public"."accounts" rename column "count" to "demo"',
			'alter table "public"."accounts" RENAME CONSTRAINT "users_6938566b_monolayer_chk" TO "accounts_3a87c81c_monolayer_chk"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await assert.constraint(
				"accounts_3a87c81c_monolayer_chk",
				"public.accounts",
			);
			await refute.constraint(
				"users_6938566b_monolayer_chk",
				"public.accounts",
			);
		},
	});
});
