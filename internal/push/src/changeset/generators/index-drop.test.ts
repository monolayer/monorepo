import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { text } from "@monorepo/pg/schema/column/data-types/text.js";
import { index } from "@monorepo/pg/schema/index.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

testSchemaPush("drop first index", {
	before: async (context) => {
		await sql`
		  create table "public"."users" ("id" integer);
			create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id");
		`.execute(context.dbClient);
	},
	schema: () => {
		return schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
					},
				}),
			},
		});
	},
	expectedQueries: [
		'drop index if exists "public"."users_0c84fd75_monolayer_idx"',
	],
	assertDatabase: async ({ refute }) => {
		refute.index("users_0c84fd75_monolayer_idx", "public.users");
	},
});

testSchemaPush("drop first index camel case", {
	before: async (context) => {
		await sql`
				create table "public"."user_accounts" ("user_id" integer);
				create index "user_accounts_95dde4ed_monolayer_idx" on "public"."user_accounts" ("user_id");
			`.execute(context.dbClient);
	},
	schema: () => {
		return schema({
			tables: {
				userAccounts: table({
					columns: {
						userId: integer(),
					},
				}),
			},
		});
	},
	camelCase: true,
	expectedQueries: [
		'drop index if exists "public"."user_accounts_95dde4ed_monolayer_idx"',
	],
	assertDatabase: async ({ refute }) => {
		refute.index("user_accounts_95dde4ed_monolayer_idx", "public.users");
	},
});

testSchemaPush("drop all indexes", {
	before: async (context) => {
		await sql`
				create table "public"."users" ("id" integer, "email" text);
				create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id");
				create index "users_cf8cf26f_monolayer_idx" on "public"."users" ("email");
			`.execute(context.dbClient);
	},
	schema: () => {
		return schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
						email: text(),
					},
				}),
			},
		});
	},
	expectedQueries: [
		'drop index if exists "public"."users_0c84fd75_monolayer_idx"',
		'drop index if exists "public"."users_cf8cf26f_monolayer_idx"',
	],
	assertDatabase: async ({ assert }) => {
		assert.index("users_0c84fd75_monolayer_idx", "public.users");
		assert.index("users_cf8cf26f_monolayer_idx", "public.users");
	},
});

testSchemaPush("drop indexes", {
	before: async (context) => {
		await sql`
				create table "public"."users" ("id" integer, "email" text, "name" text);
				create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id");
				create index "users_e42f0227_monolayer_idx" on "public"."users" ("name");
				create index "users_cf8cf26f_monolayer_idx" on "public"."users" ("email");
				`.execute(context.dbClient);
	},
	schema: () => {
		return schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
						email: text(),
						name: text(),
					},
					indexes: [index(["id"])],
				}),
			},
		});
	},
	expectedQueries: [
		'drop index if exists "public"."users_cf8cf26f_monolayer_idx"',
		'drop index if exists "public"."users_e42f0227_monolayer_idx"',
	],
	assertDatabase: async ({ assert }) => {
		assert.index("users_cf8cf26f_monolayer_idx", "public.users");
		assert.index("users_e42f0227_monolayer_idx", "public.users");
	},
});
