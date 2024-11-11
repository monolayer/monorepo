import { bigint } from "@monorepo/pg/api/schema.js";
import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { test } from "vitest";
import { assertSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";
import type { TestContext } from "~tests/__setup__/setup.js";

test<TestContext>("change column data type", async (context) => {
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
						count: bigint(),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" alter column "count" type bigint',
		],
		assertDatabase: async ({ assert }) => {
			await assert.column("count", "bigint", "public.users");
		},
	});
});
