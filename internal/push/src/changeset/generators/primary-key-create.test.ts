import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { describe } from "vitest";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

describe("Create primary key", () => {
	testSchemaPush("existing column", {
		before: async (context) => {
			sql`
				create table "public"."users" ("id" integer);
			`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				}),
			},
		}),
		expectedQueries: [
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("id")',
			'alter table "public"."users" add constraint "id_temporary_not_null_check_constraint" check ("id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "id_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("composite existing columns", {
		before: async (context) => {
			sql`
				create table "public"."users" ("id" integer, "id2" integer);
			`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
						id2: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id", "id2"]),
					},
				}),
			},
		}),
		expectedQueries: [
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("id", "id2")',
			'alter table "public"."users" add constraint "id_temporary_not_null_check_constraint" check ("id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "id2_temporary_not_null_check_constraint" check ("id2" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "id2_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."users" drop constraint "id2_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("composite existing column", {
		before: async (context) => {
			sql`
				create table "public"."users" ("id" integer);
			`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
						id2: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id", "id2"]),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" add column "id2" integer',
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("id", "id2")',
			'alter table "public"."users" add constraint "id_temporary_not_null_check_constraint" check ("id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "id2_temporary_not_null_check_constraint" check ("id2" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "id2_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."users" drop constraint "id2_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("existing column camel case", {
		before: async (context) => {
			sql`
				create table "public"."users" ("user_id" integer);
			`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						userId: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["userId"]),
					},
				}),
			},
		}),
		camelCase: true,
		expectedQueries: [
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("user_id")',
			'alter table "public"."users" add constraint "user_id_temporary_not_null_check_constraint" check ("user_id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "user_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "user_id_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("new column", {
		before: async (context) => {
			sql`
				create table "public"."users" ();
			`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" add column "id" integer',
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("id")',
			'alter table "public"."users" add constraint "id_temporary_not_null_check_constraint" check ("id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "id_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("new column camel case", {
		before: async (context) => {
			sql`
				create table "public"."users" ();
			`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						userId: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["userId"]),
					},
				}),
			},
		}),
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" add column "user_id" integer',
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("user_id")',
			'alter table "public"."users" add constraint "user_id_temporary_not_null_check_constraint" check ("user_id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "user_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "user_id_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("composite existing columns camel case", {
		before: async (context) => {
			sql`
				create table "public"."users" ("user_id" integer, "user_another_id" integer);
			`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						userId: integer(),
						userAnotherId: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["userId", "userAnotherId"]),
					},
				}),
			},
		}),
		camelCase: true,
		expectedQueries: [
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("user_another_id", "user_id")',
			'alter table "public"."users" add constraint "user_another_id_temporary_not_null_check_constraint" check ("user_another_id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "user_another_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "user_id_temporary_not_null_check_constraint" check ("user_id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "user_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "user_another_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" drop constraint "user_id_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("composite existing column camel case", {
		before: async (context) => {
			sql`
				create table "public"."users" ("user_id" integer);
			`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						user_id: integer(),
						user_another_id: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["user_id", "user_another_id"]),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" add column "user_another_id" integer',
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("user_another_id", "user_id")',
			'alter table "public"."users" add constraint "user_another_id_temporary_not_null_check_constraint" check ("user_another_id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "user_another_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "user_id_temporary_not_null_check_constraint" check ("user_id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "user_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "user_another_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" drop constraint "user_id_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});
});
