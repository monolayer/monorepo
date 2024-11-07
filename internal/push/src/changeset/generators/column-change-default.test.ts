import { text } from "@monorepo/pg/api/schema.js";
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

test<TestContext>("add column default", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"count" integer,
									"email" text
								);`,
				)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						count: integer().default(0),
						email: text().default("n@example.com"),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" alter column "count" set default 0',
			'COMMENT ON COLUMN "public"."users"."count" IS \'5feceb66\'',
			'alter table "public"."users" alter column "email" set default \'n@example.com\'::text',
			'COMMENT ON COLUMN "public"."users"."email" IS \'d432e158\'',
		],
		assertDatabase: async ({ assert, refute }) => {
			await assert.columnDefault("count", "0", "public.users");
			await assert.columnDefault(
				"email",
				"'n@example.com'::text",
				"public.users",
			);
		},
	});
});

test<TestContext>("add column default to renamed column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"count" integer
								);`,
				)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						demo: integer().default(0),
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
			'alter table "public"."users" rename column "count" to "demo"',
			'alter table "public"."users" alter column "demo" set default 0',
			'COMMENT ON COLUMN "public"."users"."demo" IS \'5feceb66\'',
		],
		assertDatabase: async ({ assert, refute }) => {
			await assert.columnDefault("demo", "0", "public.users");
		},
	});
});

test<TestContext>("add column default to renamed table and column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"count" integer
								);`,
				)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				accounts: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						demo: integer().default(0),
					},
				}),
			},
		}),
		renames: {
			tables: [tableRename("public", "users", "accounts")],
			columns: {
				"public.accounts": [columnRename("public", "users", "count", "demo")],
			},
		},
		expectedQueries: [
			'alter table "public"."users" rename to "accounts"',
			'alter table "public"."accounts" rename column "count" to "demo"',
			'alter table "public"."accounts" alter column "demo" set default 0',
			'COMMENT ON COLUMN "public"."accounts"."demo" IS \'5feceb66\'',
		],
		assertDatabase: async ({ assert, refute }) => {
			await assert.columnDefault("demo", "0", "public.accounts");
		},
	});
});

test<TestContext>("change column default", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"count" integer default 0,
									"email" text default 'n@example.com'::text
								);`,
				)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
						count: integer().default(1),
						email: text().default("y@example.com"),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" alter column "count" set default 1',
			'COMMENT ON COLUMN "public"."users"."count" IS \'6b86b273\'',
			'alter table "public"."users" alter column "email" set default \'y@example.com\'::text',
			'COMMENT ON COLUMN "public"."users"."email" IS \'7cc33643\'',
		],
		assertDatabase: async ({ assert }) => {
			await assert.columnDefault("count", "1", "public.users");
			await assert.columnDefault(
				"email",
				"'y@example.com'::text",
				"public.users",
			);
		},
	});
});

test<TestContext>("drop column default", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
								create table "public"."users" (
									"id" integer generated always as identity not null,
									"count" integer default 0,
									"email" text default 'n@example.com'::text
								);`,
				)
				.execute(context.dbClient);
		},
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
			'alter table "public"."users" alter column "count" drop default',
			'alter table "public"."users" alter column "email" drop default',
		],
		assertDatabase: async ({ assert }) => {
			await assert.columnDefault("count", null, "public.users");
			await assert.columnDefault("email", null, "public.users");
		},
	});
});
