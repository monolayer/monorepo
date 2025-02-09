import { enumerated, enumType } from "@monorepo/pg/api/schema.js";
import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

testSchemaPush("create enum type", {
	before: async (context) => {
		await sql`
				create table "public"."users" ("id" integer);`.execute(context.dbClient);
	},
	schema: () => {
		const role = enumType("role", ["user", "admin"]);
		return schema({
			types: [role],
			tables: {
				users: table({
					columns: {
						id: integer(),
						role: enumerated(role),
					},
				}),
			},
		});
	},
	expectedQueries: [
		"create type \"public\".\"role\" as enum ('user', 'admin')",
		'COMMENT ON TYPE "public"."role" IS \'monolayer\'',
		'alter table "public"."users" add column "role" "role"',
	],
});
