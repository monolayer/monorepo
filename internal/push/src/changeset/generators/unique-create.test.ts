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

test<TestContext>("add first unique constraint", async (context) => {
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
						unique: [unique(["id"])],
					},
				}),
			},
		}),
		expectedQueries: [
			'create unique index concurrently "users_acdd8fa3_monolayer_key_monolayer_uc_idx" on "public"."users" ("id") ',
			'alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique using index "users_acdd8fa3_monolayer_key_monolayer_uc_idx"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_acdd8fa3_monolayer_key", "public.users");
		},
	});
});

test<TestContext>("add first unique constraints", async (context) => {
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
						unique: [unique(["id"]), unique(["count"])],
					},
				}),
			},
		}),
		expectedQueries: [
			'create unique index concurrently "users_acdd8fa3_monolayer_key_monolayer_uc_idx" on "public"."users" ("id") ',
			'alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique using index "users_acdd8fa3_monolayer_key_monolayer_uc_idx"',
			'create unique index concurrently "users_d0c857aa_monolayer_key_monolayer_uc_idx" on "public"."users" ("count") ',
			'alter table "public"."users" add constraint "users_d0c857aa_monolayer_key" unique using index "users_d0c857aa_monolayer_key_monolayer_uc_idx"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_d0c857aa_monolayer_key", "public.users");
			await assert.constraint("users_acdd8fa3_monolayer_key", "public.users");
		},
	});
});

test<TestContext>("add additional unique constraint", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`create table "public"."users" ("id" integer generated always as identity not null, "count" integer);
					 alter table "public"."users" add constraint "users_d0c857aa_monolayer_key" unique ("count");
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
						unique: [unique(["id"]), unique(["count"])],
					},
				}),
			},
		}),
		expectedQueries: [
			'create unique index concurrently "users_acdd8fa3_monolayer_key_monolayer_uc_idx" on "public"."users" ("id") ',
			'alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique using index "users_acdd8fa3_monolayer_key_monolayer_uc_idx"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_acdd8fa3_monolayer_key", "public.users");
			await assert.constraint("users_d0c857aa_monolayer_key", "public.users");
		},
	});
});

test<TestContext>("add unique constraints", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`create table "public"."users" ("id" integer generated always as identity not null, "count" integer, "email" text);
					 alter table "public"."users" add constraint "users_d0c857aa_monolayer_key" unique ("count");
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
						email: text(),
					},
					constraints: {
						unique: [unique(["id"]), unique(["count"]), unique(["email"])],
					},
				}),
			},
		}),
		expectedQueries: [
			'create unique index concurrently "users_acdd8fa3_monolayer_key_monolayer_uc_idx" on "public"."users" ("id") ',
			'alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique using index "users_acdd8fa3_monolayer_key_monolayer_uc_idx"',
			'create unique index concurrently "users_f368ca51_monolayer_key_monolayer_uc_idx" on "public"."users" ("email") ',
			'alter table "public"."users" add constraint "users_f368ca51_monolayer_key" unique using index "users_f368ca51_monolayer_key_monolayer_uc_idx"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_acdd8fa3_monolayer_key", "public.users");
			await assert.constraint("users_d0c857aa_monolayer_key", "public.users");
			await assert.constraint("users_f368ca51_monolayer_key", "public.users");
		},
	});
});

test<TestContext>("add unique constraint on renamed column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"name" text,
									"email" text
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
						demo: text(),
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
				"public.users": [columnRename("public", "users", "email", "demo")],
			},
		},
		expectedQueries: [
			'alter table "public"."users" rename column "email" to "demo"',
			'create unique index concurrently "users_f368ca51_monolayer_key_monolayer_uc_idx" on "public"."users" ("demo") ',
			'alter table "public"."users" add constraint "users_f368ca51_monolayer_key" unique using index "users_f368ca51_monolayer_key_monolayer_uc_idx"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_f368ca51_monolayer_key", "public.users");
		},
	});
});

test<TestContext>("add unique constraint on renamed table", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"name" text,
									"email" text
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
						email: text(),
					},
					constraints: {
						unique: [unique(["email"])],
					},
				}),
			},
		}),
		renames: {
			tables: [tableRename("public", "users", "accounts")],
		},
		expectedQueries: [
			'alter table "public"."users" rename to "accounts"',
			'create unique index concurrently "accounts_f368ca51_monolayer_key_monolayer_uc_idx" on "public"."accounts" ("email") ',
			'alter table "public"."accounts" add constraint "accounts_f368ca51_monolayer_key" unique using index "accounts_f368ca51_monolayer_key_monolayer_uc_idx"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint(
				"accounts_f368ca51_monolayer_key",
				"public.accounts",
			);
		},
	});
});

test<TestContext>("add unique constraint on renamed table and column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"name" text,
									"email" text
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
						demo: text(),
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
					columnRename("public", "accounts", "email", "demo"),
				],
			},
		},
		expectedQueries: [
			'alter table "public"."users" rename to "accounts"',
			'alter table "public"."accounts" rename column "email" to "demo"',
			'create unique index concurrently "accounts_f368ca51_monolayer_key_monolayer_uc_idx" on "public"."accounts" ("demo") ',
			'alter table "public"."accounts" add constraint "accounts_f368ca51_monolayer_key" unique using index "accounts_f368ca51_monolayer_key_monolayer_uc_idx"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint(
				"accounts_f368ca51_monolayer_key",
				"public.accounts",
			);
		},
	});
});
