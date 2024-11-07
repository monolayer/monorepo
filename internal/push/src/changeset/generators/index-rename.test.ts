import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { index } from "@monorepo/pg/schema/index.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";
import {
	columnRename,
	tableRename,
} from "~tests/__setup__/helpers/factories/renames.js";

testSchemaPush("rename index on table rename", {
	before: async (context) => {
		await sql`
		  create table "public"."users" ("id" integer);
			create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id");
		`.execute(context.dbClient);
	},
	schema: () => {
		return schema({
			tables: {
				userAccounts: table({
					columns: {
						id: integer(),
					},
					indexes: [index(["id"])],
				}),
			},
		});
	},
	renames: {
		tables: [tableRename("public", "users", "userAccounts")],
	},
	expectedQueries: [
		'alter table "public"."users" rename to "userAccounts"',
		'ALTER INDEX "users_0c84fd75_monolayer_idx" RENAME TO "userAccounts_0c84fd75_monolayer_idx"',
	],
	assertDatabase: async ({ assert, refute }) => {
		assert.index("userAccounts_0c84fd75_monolayer_idx", "public.userAccounts");
		refute.index("users_0c84fd75_monolayer_idx", "public.userAccounts");
	},
});

testSchemaPush("rename index on table rename camel case", {
	before: async (context) => {
		await sql`
		  create table "public"."users" ("id" integer);
			create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id");
		`.execute(context.dbClient);
	},
	schema: () => {
		return schema({
			tables: {
				userAccounts: table({
					columns: {
						id: integer(),
					},
					indexes: [index(["id"])],
				}),
			},
		});
	},
	camelCase: true,
	renames: {
		tables: [tableRename("public", "users", "user_accounts")],
	},
	expectedQueries: [
		'alter table "public"."users" rename to "user_accounts"',
		'ALTER INDEX "users_0c84fd75_monolayer_idx" RENAME TO "user_accounts_0c84fd75_monolayer_idx"',
	],
	assertDatabase: async ({ assert, refute }) => {
		assert.index(
			"user_accounts_0c84fd75_monolayer_idx",
			"public.user_accounts",
		);
		refute.index("users_0c84fd75_monolayer_idx", "public.user_accounts");
	},
});

testSchemaPush("rename index on column rename", {
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
						userId: integer(),
					},
					indexes: [index(["userId"])],
				}),
			},
		});
	},
	renames: {
		tables: [],
		columns: {
			"public.users": [columnRename("public", "users", "id", "userId")],
		},
	},
	expectedQueries: [
		'alter table "public"."users" rename column "id" to "userId"',
		'ALTER INDEX "users_0c84fd75_monolayer_idx" RENAME TO "users_432a1385_monolayer_idx"',
	],
	assertDatabase: async ({ assert, refute }) => {
		assert.index("users_432a1385_monolayer_idx", "public.users");
		refute.index("users_0c84fd75_monolayer_idx", "public.users");
	},
});

testSchemaPush("rename index on column rename camel case", {
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
						userId: integer(),
					},
					indexes: [index(["userId"])],
				}),
			},
		});
	},
	camelCase: true,
	renames: {
		tables: [],
		columns: {
			"public.users": [columnRename("public", "users", "id", "user_id")],
		},
	},
	expectedQueries: [
		'alter table "public"."users" rename column "id" to "user_id"',
		'ALTER INDEX "users_0c84fd75_monolayer_idx" RENAME TO "users_95dde4ed_monolayer_idx"',
	],
	assertDatabase: async ({ assert, refute }) => {
		assert.index("users_95dde4ed_monolayer_idx", "public.users");
		refute.index("users_0c84fd75_monolayer_idx", "public.users");
	},
});

testSchemaPush("rename index on table column rename", {
	before: async (context) => {
		await sql`
		  create table "public"."users" ("id" integer);
			create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id");
		`.execute(context.dbClient);
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
	renames: {
		tables: [tableRename("public", "users", "userAccounts")],
		columns: {
			"public.userAccounts": [columnRename("public", "users", "id", "userId")],
		},
	},
	expectedQueries: [
		'alter table "public"."users" rename to "userAccounts"',
		'alter table "public"."userAccounts" rename column "id" to "userId"',
		'ALTER INDEX "users_0c84fd75_monolayer_idx" RENAME TO "userAccounts_432a1385_monolayer_idx"',
	],
	assertDatabase: async ({ assert, refute }) => {
		assert.index("userAccounts_432a1385_monolayer_idx", "public.userAccounts");
		refute.index("users_0c84fd75_monolayer_idx", "public.userAccounts");
	},
});

testSchemaPush("rename index on table column rename camel case", {
	before: async (context) => {
		await sql`
		  create table "public"."users" ("id" integer);
			create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id");
		`.execute(context.dbClient);
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
	renames: {
		tables: [tableRename("public", "users", "user_accounts")],
		columns: {
			"public.user_accounts": [
				columnRename("public", "users", "id", "user_id"),
			],
		},
	},
	expectedQueries: [
		'alter table "public"."users" rename to "user_accounts"',
		'alter table "public"."user_accounts" rename column "id" to "user_id"',
		'ALTER INDEX "users_0c84fd75_monolayer_idx" RENAME TO "user_accounts_95dde4ed_monolayer_idx"',
	],
	assertDatabase: async ({ assert, refute }) => {
		assert.index(
			"user_accounts_95dde4ed_monolayer_idx",
			"public.user_accounts",
		);
		refute.index("users_0c84fd75_monolayer_idx", "public.user_accounts");
	},
});
