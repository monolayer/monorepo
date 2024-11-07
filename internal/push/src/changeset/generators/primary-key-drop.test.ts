import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { describe } from "vitest";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

describe("Drop primary key", () => {
	testSchemaPush("remove not null", {
		before: async (context) => {
			sql`
			create table "public"."users" ("id" integer, constraint "users_pkey" primary key ("id"));
		`.execute(context.dbClient);
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
			'alter table "public"."users" drop constraint "users_pkey"',
			'alter table "public"."users" alter column "id" drop not null',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("maintain not null", {
		before: async (context) => {
			sql`
			create table "public"."users" ("id" integer, constraint "users_pkey" primary key ("id"));
		`.execute(context.dbClient);
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
			'alter table "public"."users" drop constraint "users_pkey"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("column drop", {
		before: async (context) => {
			sql`
			create table "public"."users" ("id" integer, constraint "users_pkey" primary key ("id"));
		`.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({}),
			},
		}),
		expectedQueries: ['alter table "public"."users" drop column "id"'],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("composite column drop - drop not null", {
		before: async (context) => {
			sql`
			create table "public"."users" ("id" integer, "id2" integer, constraint "users_pkey" primary key ("id", "id2"));
		`.execute(context.dbClient);
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
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_pkey"',
			'alter table "public"."users" alter column "id2" drop not null',
			'alter table "public"."users" drop column "id"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_pkey", "public.users");
		},
	});

	testSchemaPush("composite drop column - maintain not null", {
		before: async (context) => {
			sql`
			create table "public"."users" ("id" integer, "id2" integer, constraint "users_pkey" primary key ("id", "id2"));
		`.execute(context.dbClient);
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
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_pkey"',
			'alter table "public"."users" drop column "id"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_pkey", "public.users");
		},
	});
});
