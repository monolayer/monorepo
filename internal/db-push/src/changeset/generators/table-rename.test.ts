import { check } from "@monorepo/pg/schema/check.js";
import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { text } from "@monorepo/pg/schema/column/data-types/text.js";
import { index } from "@monorepo/pg/schema/index.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { unique } from "@monorepo/pg/schema/unique.js";
import { sql } from "kysely";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

testSchemaPush("Rename table", {
	before: async (context) => {
		await sql
			.raw(
				`
						create table "public"."users" (
							"id" integer generated always as identity not null,
							"count" integer, "name" text not null, constraint "users_pkey" primary key ("id"),
							constraint "users_6938566b_monolayer_chk" check ("count" > 0)
						);
						alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique ("id");
						create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id");
						create index "users_e42f0227_monolayer_idx" on "public"."users" ("name");`,
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
					primaryKey: primaryKey(["id"]),
					unique: [unique(["id"])],
					checks: [check(sql`${sql.ref("count")} > 0`)],
				},
				indexes: [index(["id"]), index(["name"])],
			}),
		},
	}),
	renames: {
		tables: [
			{
				name: "",
				schema: "public",
				table: "users",
				from: "public.users",
				to: "public.accounts",
				type: "tableRename",
			},
		],
	},
	expectedQueries: [
		'alter table "public"."users" rename to "accounts"',
		"ALTER INDEX users_0c84fd75_monolayer_idx RENAME TO accounts_0c84fd75_monolayer_idx",
		"ALTER INDEX users_e42f0227_monolayer_idx RENAME TO accounts_e42f0227_monolayer_idx",
	],
	assertDatabase: async ({ assert, refute }) => {
		await refute.table("public.users");
		await assert.table("public.accounts");
		await assert.constraint("accounts_pkey", "public.accounts");
		await refute.constraint("users_pkey", "public.accounts");
		await assert.constraint(
			"accounts_acdd8fa3_monolayer_key",
			"public.accounts",
		);
		await refute.constraint("users_acdd8fa3_monolayer_key", "public.accounts");
		await assert.constraint(
			"accounts_6938566b_monolayer_chk",
			"public.accounts",
		);
		await refute.constraint("users_6938566b_monolayer_chk", "public.accounts");
		await assert.index("accounts_0c84fd75_monolayer_idx", "public.accounts");
		await refute.index("users_0c84fd75_monolayer_idx", "public.accounts");
		await assert.index("accounts_e42f0227_monolayer_idx", "public.accounts");
		await refute.index("users_e42f0227_monolayer_idx", "public.accounts");
	},
});

testSchemaPush("Rename table (camelCase)", {
	before: async (context) => {
		await sql
			.raw(
				`
						create table "public"."users" (
							"id" integer generated always as identity not null,
							"count" integer, "name" text not null, constraint "users_pkey" primary key ("id"),
							constraint "users_6938566b_monolayer_chk" check ("count" > 0)
						);
						alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique ("id");
						create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id");
						create index "users_e42f0227_monolayer_idx" on "public"."users" ("name");`,
			)
			.execute(context.dbClient);
	},
	schema: schema({
		tables: {
			userAccounts: table({
				columns: {
					id: integer().generatedAlwaysAsIdentity(),
					name: text().notNull(),
					count: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
					unique: [unique(["id"])],
					checks: [check(sql`${sql.ref("count")} > 0`)],
				},
				indexes: [index(["id"]), index(["name"])],
			}),
		},
	}),
	camelCase: true,
	renames: {
		tables: [
			{
				name: "",
				schema: "public",
				table: "users",
				from: "public.users",
				to: "public.user_accounts",
				type: "tableRename",
			},
		],
	},
	expectedQueries: [
		'alter table "public"."users" rename to "user_accounts"',
		"ALTER INDEX users_0c84fd75_monolayer_idx RENAME TO user_accounts_0c84fd75_monolayer_idx",
		"ALTER INDEX users_e42f0227_monolayer_idx RENAME TO user_accounts_e42f0227_monolayer_idx",
	],
	assertDatabase: async ({ assert, refute }) => {
		await refute.table("public.users");
		await assert.table("public.user_accounts");
		await assert.constraint("user_accounts_pkey", "public.user_accounts");
		await refute.constraint("users_pkey", "public.user_accounts");
		await assert.constraint(
			"user_accounts_acdd8fa3_monolayer_key",
			"public.user_accounts",
		);
		await refute.constraint(
			"users_acdd8fa3_monolayer_key",
			"public.user_accounts",
		);
		await assert.constraint(
			"user_accounts_6938566b_monolayer_chk",
			"public.user_accounts",
		);
		await refute.constraint(
			"users_6938566b_monolayer_chk",
			"public.user_accounts",
		);
		await assert.index(
			"user_accounts_0c84fd75_monolayer_idx",
			"public.user_accounts",
		);
		await refute.index("users_0c84fd75_monolayer_idx", "public.user_accounts");
		await assert.index(
			"user_accounts_e42f0227_monolayer_idx",
			"public.user_accounts",
		);
		await refute.index("users_e42f0227_monolayer_idx", "public.user_accounts");
	},
});
