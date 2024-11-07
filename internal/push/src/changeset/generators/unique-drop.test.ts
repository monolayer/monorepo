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

test<TestContext>("remove last unique constraint", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`
					create table "public"."users" ("id" integer generated always as identity not null, "count" integer);
					alter table "public"."users" add constraint "users_d0c857aa_monolayer_key" unique ("count");`,
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
			'alter table "public"."users" drop constraint if exists "users_d0c857aa_monolayer_key"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_d0c857aa_monolayer_key", "public.users");
		},
	});
});

test<TestContext>("remove last unique constraints", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`
					create table "public"."users" ("id" integer generated always as identity not null, "count" integer);
          alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique ("id");
					alter table "public"."users" add constraint "users_d0c857aa_monolayer_key" unique ("count");`,
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
			'alter table "public"."users" drop constraint if exists "users_acdd8fa3_monolayer_key"',
			'alter table "public"."users" drop constraint if exists "users_d0c857aa_monolayer_key"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_acdd8fa3_monolayer_key", "public.users");
			await refute.constraint("users_d0c857aa_monolayer_key", "public.users");
		},
	});
});

test<TestContext>("remove unique constraint", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`
					create table "public"."users" ("id" integer generated always as identity not null, "count" integer);
          alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique ("id");
					alter table "public"."users" add constraint "users_d0c857aa_monolayer_key" unique ("count");`,
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
						unique: [unique(["count"])],
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" drop constraint if exists "users_acdd8fa3_monolayer_key"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await refute.constraint("users_acdd8fa3_monolayer_key", "public.users");
			await assert.constraint("users_d0c857aa_monolayer_key", "public.users");
		},
	});
});

// users_f368ca51_monolayer_key
test<TestContext>("remove unique constraints", async (context) => {
	await assertSchemaPush({
		before: async (context) => {
			await sql
				.raw(
					`create table "public"."users" (
						"id" integer generated always as identity not null,
						"email" text,
						"count" integer
					);
  				 alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique ("id");
					 alter table "public"."users" add constraint "users_f368ca51_monolayer_key" unique ("email");
					 alter table "public"."users" add constraint "users_d0c857aa_monolayer_key" unique ("count")`,
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
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" drop constraint if exists "users_acdd8fa3_monolayer_key"',
			'alter table "public"."users" drop constraint if exists "users_d0c857aa_monolayer_key"',
			'alter table "public"."users" drop constraint if exists "users_f368ca51_monolayer_key"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_acdd8fa3_monolayer_key", "public.users");
			await refute.constraint("users_f368ca51_monolayer_key", "public.users");
			await refute.constraint("users_d0c857aa_monolayer_key", "public.users");
		},
	});
});

test<TestContext>("drop unique constraint on renamed column", async (context) => {
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
					 alter table "public"."users" add constraint "users_d0c857aa_monolayer_key" unique ("count")`,
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
			'alter table "public"."users" drop constraint if exists "users_d0c857aa_monolayer_key"',
			'alter table "public"."users" rename column "count" to "demo"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_d0c857aa_monolayer_key", "public.users");
		},
	});
});

test<TestContext>("drop unique constraints on renamed table", async (context) => {
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
            alter table "public"."users" add constraint "users_d0c857aa_monolayer_key" unique ("count");
						alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique ("id");`,
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
			'alter table "public"."users" drop constraint if exists "users_acdd8fa3_monolayer_key"',
			'alter table "public"."users" drop constraint if exists "users_d0c857aa_monolayer_key"',
			'alter table "public"."users" rename to "accounts"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await assert.table("public.accounts");
			await refute.table("public.users");
			await refute.constraint(
				"users_acdd8fa3_monolayer_key",
				"public.accounts",
			);
			await refute.constraint(
				"users_d0c857aa_monolayer_key",
				"public.accounts",
			);
		},
	});
});

test<TestContext>("drop unique constraints on renamed table and column", async (context) => {
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
            alter table "public"."users" add constraint "users_d0c857aa_monolayer_key" unique ("count");
						alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique ("id");`,
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
			'alter table "public"."users" drop constraint if exists "users_acdd8fa3_monolayer_key"',
			'alter table "public"."users" drop constraint if exists "users_d0c857aa_monolayer_key"',
			'alter table "public"."users" rename to "accounts"',
			'alter table "public"."accounts" rename column "count" to "demo"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await assert.table("public.accounts");
			await refute.table("public.users");
			await refute.constraint(
				"users_acdd8fa3_monolayer_key",
				"public.accounts",
			);
			await refute.constraint(
				"users_d0c857aa_monolayer_key",
				"public.accounts",
			);
		},
	});
});
