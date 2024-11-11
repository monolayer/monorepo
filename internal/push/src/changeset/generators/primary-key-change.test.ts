/* eslint-disable max-lines */
import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { describe } from "vitest";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

describe("Change primary key", () => {
	testSchemaPush("drop not null", {
		before: async (context) => {
			sql`
			create table "public"."users" ("id" integer, "id2" integer);
			alter table "public"."users" add constraint "users_pkey" primary key ("id");
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
						primaryKey: primaryKey(["id2"]),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_pkey"',
			'alter table "public"."users" alter column "id" drop not null',
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("id2")',
			'alter table "public"."users" add constraint "id2_temporary_not_null_check_constraint" check ("id2" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "id2_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "id2_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("existing column - drop not null - camel case", {
		before: async (context) => {
			sql`
			create table "public"."users" ("user_id" integer, "another_id" integer);
			alter table "public"."users" add constraint "users_pkey" primary key ("user_id");
		`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						userId: integer(),
						anotherId: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["anotherId"]),
					},
				}),
			},
		}),
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_pkey"',
			'alter table "public"."users" alter column "user_id" drop not null',
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("another_id")',
			'alter table "public"."users" add constraint "another_id_temporary_not_null_check_constraint" check ("another_id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "another_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "another_id_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("existing column - maintain not null", {
		before: async (context) => {
			sql`
			create table "public"."users" ("id" integer, "id2" integer);
			alter table "public"."users" add constraint "users_pkey" primary key ("id");
		`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer().notNull(),
						id2: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id2"]),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_pkey"',
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("id2")',
			'alter table "public"."users" add constraint "id2_temporary_not_null_check_constraint" check ("id2" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "id2_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "id2_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("existing column - maintain not null - camel case", {
		before: async (context) => {
			sql`
			create table "public"."users" ("user_id" integer, "another_id" integer);
			alter table "public"."users" add constraint "users_pkey" primary key ("user_id");
		`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						userId: integer().notNull(),
						anotherId: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["anotherId"]),
					},
				}),
			},
		}),
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_pkey"',
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("another_id")',
			'alter table "public"."users" add constraint "another_id_temporary_not_null_check_constraint" check ("another_id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "another_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "another_id_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("new column - drop not null", {
		before: async (context) => {
			sql`
			create table "public"."users" ("id" integer);
			alter table "public"."users" add constraint "users_pkey" primary key ("id");
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
						primaryKey: primaryKey(["id2"]),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" add column "id2" integer',
			'alter table "public"."users" drop constraint "users_pkey"',
			'alter table "public"."users" alter column "id" drop not null',
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("id2")',
			'alter table "public"."users" add constraint "id2_temporary_not_null_check_constraint" check ("id2" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "id2_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "id2_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("new column - drop not null - camel case", {
		before: async (context) => {
			sql`
			create table "public"."users" ("user_id" integer);
			alter table "public"."users" add constraint "users_pkey" primary key ("user_id");
		`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						userId: integer(),
						anotherId: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["anotherId"]),
					},
				}),
			},
		}),
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" add column "another_id" integer',
			'alter table "public"."users" drop constraint "users_pkey"',
			'alter table "public"."users" alter column "user_id" drop not null',
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("another_id")',
			'alter table "public"."users" add constraint "another_id_temporary_not_null_check_constraint" check ("another_id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "another_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "another_id_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("new column - maintain not null", {
		before: async (context) => {
			sql`
			create table "public"."users" ("id" integer);
			alter table "public"."users" add constraint "users_pkey" primary key ("id");
		`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer().notNull(),
						id2: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id2"]),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" add column "id2" integer',
			'alter table "public"."users" drop constraint "users_pkey"',
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("id2")',
			'alter table "public"."users" add constraint "id2_temporary_not_null_check_constraint" check ("id2" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "id2_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "id2_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("new column - maintain not null - camel case", {
		before: async (context) => {
			sql`
			create table "public"."users" ("user_id" integer);
			alter table "public"."users" add constraint "users_pkey" primary key ("user_id");
		`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						userId: integer().notNull(),
						anotherId: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["anotherId"]),
					},
				}),
			},
		}),
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" add column "another_id" integer',
			'alter table "public"."users" drop constraint "users_pkey"',
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("another_id")',
			'alter table "public"."users" add constraint "another_id_temporary_not_null_check_constraint" check ("another_id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "another_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "another_id_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("new not null column - maintain not null", {
		before: async (context) => {
			sql`
			create table "public"."users" ("id" integer);
			alter table "public"."users" add constraint "users_pkey" primary key ("id");
		`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer().notNull(),
						id2: integer().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id2"]),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" add column "id2" integer',
			'alter table "public"."users" add constraint "temporary_not_null_check_constraint_public_users_id2" check ("id2" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "temporary_not_null_check_constraint_public_users_id2"',
			'alter table "public"."users" alter column "id2" set not null',
			'alter table "public"."users" drop constraint "temporary_not_null_check_constraint_public_users_id2"',
			'alter table "public"."users" drop constraint "users_pkey"',
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("id2")',
			'alter table "public"."users" add constraint "id2_temporary_not_null_check_constraint" check ("id2" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "id2_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "id2_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("new not null column - maintain not null, camel case", {
		before: async (context) => {
			sql`
			create table "public"."users" ("user_id" integer);
			alter table "public"."users" add constraint "users_pkey" primary key ("user_id");
		`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						userId: integer().notNull(),
						anotherId: integer().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["anotherId"]),
					},
				}),
			},
		}),
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" add column "another_id" integer',
			'alter table "public"."users" add constraint "temporary_not_null_check_constraint_public_users_another_id" check ("another_id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "temporary_not_null_check_constraint_public_users_another_id"',
			'alter table "public"."users" alter column "another_id" set not null',
			'alter table "public"."users" drop constraint "temporary_not_null_check_constraint_public_users_another_id"',
			'alter table "public"."users" drop constraint "users_pkey"',
			'create unique index concurrently "users_pkey_idx" on "public"."users" ("another_id")',
			'alter table "public"."users" add constraint "another_id_temporary_not_null_check_constraint" check ("another_id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "another_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"',
			'alter table "public"."users" drop constraint "another_id_temporary_not_null_check_constraint"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_pkey", "public.users");
		},
	});
});
