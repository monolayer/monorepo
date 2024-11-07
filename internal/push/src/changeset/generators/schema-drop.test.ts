import { schema } from "@monorepo/pg/schema/schema.js";
import { sql } from "kysely";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

testSchemaPush("Drop named schema", {
	before: async (context) => {
		sql`create schema if not exists "my_stats"; comment on schema "my_stats" IS \'monolayer\';`.execute(
			context.dbClient,
		);
	},
	schema: [schema({})],
	expectedQueries: ['drop schema if exists "my_stats" cascade;'],
});

testSchemaPush("Drop named schema with table", {
	before: async (context) => {
		sql`
			create schema if not exists "my_stats"; comment on schema "my_stats" IS \'monolayer\';
			create table "my_stats"."users" ();
		`.execute(context.dbClient);
	},
	schema: [schema({})],
	expectedQueries: ['drop schema if exists "my_stats" cascade;'],
});

testSchemaPush("Drop named schema camel case", {
	before: async (context) => {
		sql`create schema if not exists "my_stats"; comment on schema "my_stats" IS \'monolayer\';`.execute(
			context.dbClient,
		);
	},
	camelCase: true,
	schema: [schema({})],
	expectedQueries: ['drop schema if exists "my_stats" cascade;'],
});

testSchemaPush("Drop named schema with table camel case", {
	before: async (context) => {
		sql`
			create schema if not exists "my_stats"; comment on schema "my_stats" IS \'monolayer\';
			create table "my_stats"."users" ();
		`.execute(context.dbClient);
	},
	camelCase: true,
	schema: [schema({})],
	expectedQueries: ['drop schema if exists "my_stats" cascade;'],
});
