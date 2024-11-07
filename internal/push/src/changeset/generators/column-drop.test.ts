import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { test } from "vitest";
import { assertSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";
import type { TestContext } from "~tests/__setup__/setup.js";

test<TestContext>("drop column", async (context) => {
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
					columns: {},
				}),
			},
		}),
		expectedQueries: ['alter table "public"."users" drop column "id"'],
		assertDatabase: async ({ refute }) => {
			await refute.column("id", "integer", "public.users");
		},
	});
});

test<TestContext>("drop column camel case", async (context) => {
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
					columns: {},
				}),
			},
		}),
		camelCase: true,
		expectedQueries: ['alter table "public"."users" drop column "user_id"'],
		assertDatabase: async ({ refute }) => {
			await refute.column("user_id", "integer", "public.users");
		},
	});
});
