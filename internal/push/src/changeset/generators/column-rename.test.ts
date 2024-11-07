import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { test } from "vitest";
import { assertSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";
import {
	columnRename,
	tableRename,
} from "~tests/__setup__/helpers/factories/renames.js";
import type { TestContext } from "~tests/__setup__/setup.js";

test<TestContext>("rename column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(`create table "public"."users" ("id" integer);`)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id2: integer(),
					},
				}),
			},
		}),
		renames: {
			tables: [],
			columns: {
				"public.users": [columnRename("public", "users", "id", "id2")],
			},
		},
		expectedQueries: [
			'alter table "public"."users" rename column "id" to "id2"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await refute.column("id", "integer", "public.users");
			await assert.column("id2", "integer", "public.users");
		},
	});
});

test<TestContext>("rename column camel case", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(`create table "public"."users" ("user_id" integer);`)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						anotherId: integer(),
					},
				}),
			},
		}),
		camelCase: true,
		renames: {
			tables: [],
			columns: {
				"public.users": [
					columnRename("public", "users", "user_id", "another_id"),
				],
			},
		},
		expectedQueries: [
			'alter table "public"."users" rename column "user_id" to "another_id"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await refute.column("id", "integer", "public.users");
			await assert.column("another_id", "integer", "public.users");
		},
	});
});

test<TestContext>("rename table and column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(`create table "public"."users" ("id" integer);`)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				accounts: table({
					columns: {
						id2: integer(),
					},
				}),
			},
		}),
		renames: {
			tables: [tableRename("public", "users", "accounts")],
			columns: {
				"public.accounts": [columnRename("public", "users", "id", "id2")],
			},
		},
		expectedQueries: [
			'alter table "public"."users" rename to "accounts"',
			'alter table "public"."accounts" rename column "id" to "id2"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await refute.column("id", "integer", "public.accounts");
			await assert.column("id2", "integer", "public.accounts");
		},
	});
});

test<TestContext>("rename table and column camel case", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(`create table "public"."users" ("user_id" integer);`)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				userAccounts: table({
					columns: {
						anotherId: integer(),
					},
				}),
			},
		}),
		camelCase: true,
		renames: {
			tables: [tableRename("public", "users", "user_accounts")],
			columns: {
				"public.user_accounts": [
					columnRename("public", "users", "user_id", "another_id"),
				],
			},
		},
		expectedQueries: [
			'alter table "public"."users" rename to "user_accounts"',
			'alter table "public"."user_accounts" rename column "user_id" to "another_id"',
		],
		assertDatabase: async ({ assert, refute }) => {
			await refute.column("id", "integer", "public.user_accounts");
			await assert.column("another_id", "integer", "public.user_accounts");
		},
	});
});
