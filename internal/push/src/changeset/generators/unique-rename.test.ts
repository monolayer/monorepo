import { integer, text, unique } from "@monorepo/pg/api/schema.js";
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

test<TestContext>("rename unique constraint when renaming table", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"count" integer, "name" text not null,
									constraint "users_d0c857aa_monolayer_key" unique ("count")
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
						unique: [unique(["count"])],
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
				"accounts_d0c857aa_monolayer_key",
				"public.accounts",
			);
			await refute.constraint(
				"users_d0c857aa_monolayer_key",
				"public.accounts",
			);
		},
	});
});

test<TestContext>("rename unique constraint when renaming column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"count" integer, "name" text not null,
									constraint "users_d0c857aa_monolayer_key" unique ("count")
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
						unique: [unique(["demo"])],
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
			'ALTER TABLE "public"."users" RENAME CONSTRAINT "users_d0c857aa_monolayer_key" TO "users_193a876e_monolayer_key"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await assert.constraint("users_193a876e_monolayer_key", "public.users");
			await refute.constraint("users_d0c857aa_monolayer_key", "public.users");
		},
	});
});

test<TestContext>("rename unique constraint when renaming table and column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"count" integer, "name" text not null,
									constraint "users_d0c857aa_monolayer_key" unique ("count")
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
						unique: [unique(["demo"])],
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
			'ALTER TABLE "public"."accounts" RENAME CONSTRAINT "users_d0c857aa_monolayer_key" TO "accounts_193a876e_monolayer_key"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await assert.constraint(
				"accounts_193a876e_monolayer_key",
				"public.accounts",
			);
			await refute.constraint(
				"users_d0c857aa_monolayer_key",
				"public.accounts",
			);
		},
	});
});
