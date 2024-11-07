import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { text } from "@monorepo/pg/schema/column/data-types/text.js";
import { index } from "@monorepo/pg/schema/index.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

testSchemaPush("create first index", {
	before: async (context) => {
		await sql`
				create table "public"."users" ("id" integer);`.execute(context.dbClient);
	},
	schema: () => {
		return schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
					},
					indexes: [index(["id"])],
				}),
			},
		});
	},
	expectedQueries: [
		'create index concurrently "users_0c84fd75_monolayer_idx" on "public"."users" ("id")',
	],
	assertDatabase: async ({ assert }) => {
		assert.index("users_0c84fd75_monolayer_idx", "public.users");
	},
});

testSchemaPush("create first index camel case", {
	before: async (context) => {
		await sql`
				create table "public"."user_accounts" ("user_id" integer);`.execute(
			context.dbClient,
		);
	},
	schema: () => {
		return schema({
			tables: {
				userAccounts: table({
					columns: {
						userId: integer(),
					},
					indexes: [index(["userId"])],
				}),
			},
		});
	},
	camelCase: true,
	expectedQueries: [
		'create index concurrently "user_accounts_95dde4ed_monolayer_idx" on "public"."user_accounts" ("user_id")',
	],
	assertDatabase: async ({ assert }) => {
		assert.index("user_accounts_95dde4ed_monolayer_idx", "public.users");
	},
});

testSchemaPush("create multiple first indexes", {
	before: async (context) => {
		await sql`
				create table "public"."users" ("id" integer, "email" text);`.execute(
			context.dbClient,
		);
	},
	schema: () => {
		return schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
						email: text(),
					},
					indexes: [index(["id"]), index(["email"])],
				}),
			},
		});
	},
	expectedQueries: [
		'create index concurrently "users_0c84fd75_monolayer_idx" on "public"."users" ("id")',
		'create index concurrently "users_cf8cf26f_monolayer_idx" on "public"."users" ("email")',
	],
	assertDatabase: async ({ assert }) => {
		assert.index("users_0c84fd75_monolayer_idx", "public.users");
	},
});

testSchemaPush("add indexes", {
	before: async (context) => {
		await sql`
				create table "public"."users" ("id" integer, "email" text, "name" text);
				create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id");
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
					indexes: [index(["id"]), index(["name"]), index(["email"])],
				}),
			},
		});
	},
	expectedQueries: [
		'create index concurrently "users_e42f0227_monolayer_idx" on "public"."users" ("name")',
		'create index concurrently "users_cf8cf26f_monolayer_idx" on "public"."users" ("email")',
	],
	assertDatabase: async ({ assert }) => {
		assert.index("users_e42f0227_monolayer_idx", "public.users");
		assert.index("users_cf8cf26f_monolayer_idx", "public.users");
	},
});

testSchemaPush("create complex index", {
	before: async (context) => {
		await sql`
			create table "public"."users" ("age" integer, "city" text, "id" integer);
		`.execute(context.dbClient);
	},
	schema: () => {
		return schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
						city: text(),
						age: integer(),
					},
					indexes: [
						index(["id"])
							.where("id", ">", "100")
							.where((eb) =>
								eb.and([
									eb(sql.ref("city"), "=", "Barcelona"),
									eb(sql.ref("age"), ">=", 18),
								]),
							),
					],
				}),
			},
		});
	},
	expectedQueries: [
		'create index concurrently "users_348d15c5_monolayer_idx" on "public"."users" ("id") where "id" > \'100\' and ("city" = \'Barcelona\' and "age" >= 18)',
	],
	assertDatabase: async ({ assert }) => {
		assert.index("users_348d15c5_monolayer_idx", "public.users");
	},
});
