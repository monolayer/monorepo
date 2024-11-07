import { schema } from "@monorepo/pg/schema/schema.js";
import { sql } from "kysely";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

testSchemaPush("Drop table", {
	before: async (context) => {
		await sql
			.raw(
				`
						create table "public"."users" (
							"id" integer generated always as identity not null,
							"count" integer, "name" text not null, constraint "users_pkey" primary key ("id"),
							constraint "users_acdd8fa3_monolayer_key" unique ("id"),
							constraint "users_6938566b_monolayer_chk" check ("count" > 0)
						);
						create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id");
						create index "users_e42f0227_monolayer_idx" on "public"."users" ("name");`,
			)
			.execute(context.dbClient);
	},
	schema: schema({
		tables: {},
	}),
	expectedQueries: ['drop table "public"."users"'],
});

testSchemaPush("Drop dependant tables", {
	before: async (context) => {
		await sql
			.raw(
				`
						create table "public"."ausers" (
							"id" integer generated always as identity not null,
							"count" integer, "name" text not null, constraint "ausers_pkey" primary key ("id"),
							constraint "ausers_acdd8fa3_monolayer_key" unique ("id"),
							constraint "ausers_6938566b_monolayer_chk" check ("count" > 0)
						);
						create table "public"."books" (
							"id" integer generated always as identity not null,
							"user_id" integer,
							constraint "books_0674fb23_monolayer_fk" foreign key ("user_id") references "public"."ausers" ("id") on delete no action on update no action
						);
						create index "ausers_0c84fd75_monolayer_idx" on "public"."ausers" ("id");
						create index "ausers_e42f0227_monolayer_idx" on "public"."ausers" ("name");`,
			)
			.execute(context.dbClient);
	},
	schema: schema({
		tables: {},
	}),
	expectedQueries: [
		'drop table "public"."books"',
		'drop table "public"."ausers"',
	],
});
