import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

testSchemaPush("Add named schema", {
	schema: schema({
		name: "my_stats",
	}),
	expectedQueries: [
		'create schema if not exists "my_stats"; comment on schema "my_stats" IS \'monolayer\';',
	],
});

testSchemaPush("Add named schema with table", {
	schema: schema({
		name: "my_stats",
		tables: {
			users: table({}),
		},
	}),
	expectedQueries: [
		'create schema if not exists "my_stats"; comment on schema "my_stats" IS \'monolayer\';',
		'create table "my_stats"."users" ()',
	],
});

testSchemaPush("Add named schema camel case", {
	schema: schema({
		name: "myStats",
	}),
	camelCase: true,
	expectedQueries: [
		'create schema if not exists "my_stats"; comment on schema "my_stats" IS \'monolayer\';',
	],
});

testSchemaPush("Add named schema camel case with table", {
	schema: schema({
		name: "myStats",
		tables: {
			userAccounts: table({}),
		},
	}),
	camelCase: true,
	expectedQueries: [
		'create schema if not exists "my_stats"; comment on schema "my_stats" IS \'monolayer\';',
		'create table "my_stats"."user_accounts" ()',
	],
});
