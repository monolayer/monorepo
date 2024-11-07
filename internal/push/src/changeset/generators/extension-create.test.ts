import { schema } from "@monorepo/pg/schema/schema.js";
import { sql } from "kysely";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

testSchemaPush("create extension", {
	before: async (context) => {
		await sql`create extension if not exists adminpack;`.execute(
			context.dbClient,
		);
	},
	schema: () => {
		return schema({});
	},
	extensions: [],
	expectedQueries: ["drop extension if exists adminpack;"],
	assertDatabase: async ({}) => {},
});
