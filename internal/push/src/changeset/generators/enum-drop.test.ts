import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

testSchemaPush("drop enum type", {
	before: async (context) => {
		await sql`
				create type  "public"."role" as enum ('user', 'admin');
				COMMENT ON TYPE "public"."role" IS 'monolayer';
				create table "public"."users" ("id" integer, "role" "role");`.execute(
			context.dbClient,
		);
	},
	schema: () => {
		return schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
					},
				}),
			},
		});
	},
	expectedQueries: [
		'alter table "public"."users" drop column "role"',
		'drop type "public"."role"',
	],
});
