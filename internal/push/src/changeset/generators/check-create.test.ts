/* eslint-disable max-lines */
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

test<TestContext>("add first check constraint", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					'create table "public"."users" ("id" integer generated always as identity not null, "count" integer)',
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
			'alter table "public"."users" add constraint "users_90030f07_monolayer_chk" check ("count" >= 0) not valid',
			'alter table "public"."users" validate constraint "users_90030f07_monolayer_chk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_90030f07_monolayer_chk", "public.users");
		},
	});
});

test<TestContext>("add first check constraints", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					'create table "public"."users" ("id" integer generated always as identity not null, "count" integer)',
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
						checks: [
							check(sql`${sql.ref("count")} >= 0`),
							check(sql`${sql.ref("count")} < 1000`),
						],
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" add constraint "users_90030f07_monolayer_chk" check ("count" >= 0) not valid',
			'alter table "public"."users" validate constraint "users_90030f07_monolayer_chk"',
			'alter table "public"."users" add constraint "users_7da0b891_monolayer_chk" check ("count" < 1000) not valid',
			'alter table "public"."users" validate constraint "users_7da0b891_monolayer_chk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_90030f07_monolayer_chk", "public.users");
			await assert.constraint("users_7da0b891_monolayer_chk", "public.users");
		},
	});
});

test<TestContext>("add additional check constraint", async (context) => {
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
					constraints: {
						checks: [
							check(sql`${sql.ref("count")} >= 0`),
							check(sql`${sql.ref("count")} < 1000`),
						],
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" add constraint "users_7da0b891_monolayer_chk" check ("count" < 1000) not valid',
			'alter table "public"."users" validate constraint "users_7da0b891_monolayer_chk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_90030f07_monolayer_chk", "public.users");
			await assert.constraint("users_7da0b891_monolayer_chk", "public.users");
		},
	});
});

test<TestContext>("add check constraints", async (context) => {
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
					constraints: {
						checks: [
							check(sql`${sql.ref("count")} >= 0`),
							check(sql`${sql.ref("count")} < 1000`),
							check(sql`${sql.ref("count")} < 10000`),
						],
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" add constraint "users_7da0b891_monolayer_chk" check ("count" < 1000) not valid',
			'alter table "public"."users" validate constraint "users_7da0b891_monolayer_chk"',
			'alter table "public"."users" add constraint "users_cca30d8e_monolayer_chk" check ("count" < 10000) not valid',
			'alter table "public"."users" validate constraint "users_cca30d8e_monolayer_chk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_90030f07_monolayer_chk", "public.users");
			await assert.constraint("users_7da0b891_monolayer_chk", "public.users");
			await assert.constraint("users_cca30d8e_monolayer_chk", "public.users");
		},
	});
});

test<TestContext>("add check constraint on renamed column", async (context) => {
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
								);`,
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
			'alter table "public"."users" add constraint "users_3a87c81c_monolayer_chk" check ("demo" > 0) not valid',
			'alter table "public"."users" validate constraint "users_3a87c81c_monolayer_chk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_3a87c81c_monolayer_chk", "public.users");
		},
	});
});

test<TestContext>("add check constraint on renamed table", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"name" text,
									"demo" integer
								);`,
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
					constraints: {
						checks: [check(sql`${sql.ref("demo")} > 0`)],
					},
				}),
			},
		}),
		renames: {
			tables: [tableRename("public", "users", "accounts")],
		},
		expectedQueries: [
			'alter table "public"."users" rename to "accounts"',
			'alter table "public"."accounts" add constraint "accounts_3a87c81c_monolayer_chk" check ("demo" > 0) not valid',
			'alter table "public"."accounts" validate constraint "accounts_3a87c81c_monolayer_chk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint(
				"accounts_3a87c81c_monolayer_chk",
				"public.accounts",
			);
		},
	});
});

test<TestContext>("add check constraint on renamed table and column", async (context) => {
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
								);`,
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
			'alter table "public"."accounts" add constraint "accounts_3a87c81c_monolayer_chk" check ("demo" > 0) not valid',
			'alter table "public"."accounts" validate constraint "accounts_3a87c81c_monolayer_chk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint(
				"accounts_3a87c81c_monolayer_chk",
				"public.accounts",
			);
		},
	});
});
