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

test<TestContext>("remove last check constraint", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`create table "public"."users" ("id" integer generated always as identity not null, "count" integer);
					 alter table "public"."users" add constraint "users_90030f07_monolayer_chk" check ("count" >= 0);
					`,
				)
				.execute(context.dbClient);
		},
		context,
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						count: integer(),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_90030f07_monolayer_chk"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_90030f07_monolayer_chk", "public.users");
		},
	});
});

test<TestContext>("remove last check constraints", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`create table "public"."users" ("id" integer generated always as identity not null, "count" integer);
					 alter table "public"."users" add constraint "users_90030f07_monolayer_chk" check ("count" >= 0);
					 alter table "public"."users" add constraint "users_cca30d8e_monolayer_chk" check ("count" < 10000);
					`,
				)
				.execute(context.dbClient);
		},
		context,
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						count: integer(),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_90030f07_monolayer_chk"',
			'alter table "public"."users" drop constraint "users_cca30d8e_monolayer_chk"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_90030f07_monolayer_chk", "public.users");
			await refute.constraint("users_cca30d8e_monolayer_chk", "public.users");
		},
	});
});

test<TestContext>("remove check constraint", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`create table "public"."users" ("id" integer generated always as identity not null, "count" integer);
					 alter table "public"."users" add constraint "users_90030f07_monolayer_chk" check ("count" >= 0);
					 alter table "public"."users" add constraint "users_cca30d8e_monolayer_chk" check ("count" < 10000);
					`,
				)
				.execute(context.dbClient);
		},
		context,
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						count: integer(),
					},
					constraints: {
						checks: [check(sql`${sql.ref("count")} >= 0`)],
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_cca30d8e_monolayer_chk"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await assert.constraint("users_90030f07_monolayer_chk", "public.users");
			await refute.constraint("users_cca30d8e_monolayer_chk", "public.users");
		},
	});
});

test<TestContext>("remove check constraints", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`create table "public"."users" ("id" integer generated always as identity not null, "count" integer);
					 alter table "public"."users" add constraint "users_90030f07_monolayer_chk" check ("count" >= 0);
					 alter table "public"."users" add constraint "users_7da0b891_monolayer_chk" check ("count" < 1000);
					 alter table "public"."users" add constraint "users_cca30d8e_monolayer_chk" check ("count" < 10000);
					`,
				)
				.execute(context.dbClient);
		},
		context,
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						count: integer(),
					},
					constraints: {
						checks: [check(sql`${sql.ref("count")} >= 0`)],
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_7da0b891_monolayer_chk"',
			'alter table "public"."users" drop constraint "users_cca30d8e_monolayer_chk"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await assert.constraint("users_90030f07_monolayer_chk", "public.users");
			await refute.constraint("users_7da0b891_monolayer_chk", "public.users");
			await refute.constraint("users_cca30d8e_monolayer_chk", "public.users");
		},
	});
});

test<TestContext>("drop check constraint on renamed column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"name" text,
									"count" integer
								);
								alter table "public"."users" add constraint "users_6938566b_monolayer_chk" check ("count" > 0);`,
				)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						name: text(),
						demo: integer(),
					},
					constraints: {},
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
			'alter table "public"."users" drop constraint "users_6938566b_monolayer_chk"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_6938566b_monolayer_chk", "public.users");
		},
	});
});

test<TestContext>("drop check constraints on renamed table", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"name" text,
									"count" integer
								);
								alter table "public"."users" add constraint "users_6938566b_monolayer_chk" check ("count" > 0);`,
				)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				accounts: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						name: text(),
						count: integer(),
					},
				}),
			},
		}),
		renames: {
			tables: [tableRename("public", "users", "accounts")],
			columns: {},
		},
		expectedQueries: [
			'alter table "public"."users" rename to "accounts"',
			'alter table "public"."accounts" drop constraint "accounts_6938566b_monolayer_chk"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await assert.table("public.accounts");
			await refute.table("public.users");
			await refute.constraint(
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

test<TestContext>("drop check constraints on renamed table and column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"name" text,
									"count" integer
								);
								alter table "public"."users" add constraint "users_6938566b_monolayer_chk" check ("count" > 0);`,
				)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				accounts: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						name: text(),
						demo: integer(),
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
			'alter table "public"."accounts" drop constraint "accounts_6938566b_monolayer_chk"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await assert.table("public.accounts");
			await refute.table("public.users");
			await refute.constraint(
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
