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

test<TestContext>("add not null to column", async (context) => {
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
						id: integer().notNull(),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" add constraint "temporary_not_null_check_constraint_public_users_id" check ("id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "temporary_not_null_check_constraint_public_users_id"',
			'alter table "public"."users" alter column "id" set not null',
			'alter table "public"."users" drop constraint "temporary_not_null_check_constraint_public_users_id"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.columnNullable("id", "public.users");
		},
	});
});

test<TestContext>("drop not null from column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(`create table "public"."users" ("id" integer not null);`)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" alter column "id" drop not null',
		],
		assertDatabase: async ({ assert }) => {
			await assert.columnNullable("id", "public.users");
		},
	});
});
test<TestContext>("add not null to renamed column", async (context) => {
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
						id2: integer().notNull(),
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
			'alter table "public"."users" add constraint "temporary_not_null_check_constraint_public_users_id2" check ("id2" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "temporary_not_null_check_constraint_public_users_id2"',
			'alter table "public"."users" alter column "id2" set not null',
			'alter table "public"."users" drop constraint "temporary_not_null_check_constraint_public_users_id2"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.columnNullable("id2", "public.users");
		},
	});
});

test<TestContext>("add not null to column, renamed table and column", async (context) => {
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
						id2: integer().notNull(),
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
			'alter table "public"."accounts" add constraint "temporary_not_null_check_constraint_public_accounts_id2" check ("id2" IS NOT NULL) not valid',
			'alter table "public"."accounts" validate constraint "temporary_not_null_check_constraint_public_accounts_id2"',
			'alter table "public"."accounts" alter column "id2" set not null',
			'alter table "public"."accounts" drop constraint "temporary_not_null_check_constraint_public_accounts_id2"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.columnNullable("id2", "public.accounts");
		},
	});
});
