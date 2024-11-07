import { check } from "@monorepo/pg/schema/check.js";
import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { text } from "@monorepo/pg/schema/column/data-types/text.js";
import { foreignKey } from "@monorepo/pg/schema/foreign-key.js";
import { index } from "@monorepo/pg/schema/index.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { unique } from "@monorepo/pg/schema/unique.js";
import { sql } from "kysely";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

testSchemaPush("Add empty table", {
	schema: schema({
		tables: {
			users: table({ columns: {} }),
		},
	}),
	expectedQueries: ['create table "public"."users" ()'],
});

const userTable = table({
	columns: {
		id: integer().generatedAlwaysAsIdentity(),
		name: text().notNull(),
		count: integer(),
	},
	constraints: {
		primaryKey: primaryKey(["id"]),
		unique: [unique(["id"])],
		checks: [check(sql`${sql.ref("count")} > 0`)],
	},
	indexes: [index(["id"]), index(["name"])],
});

testSchemaPush("Add Table with columns, indexes, and constraints", {
	schema: schema({
		tables: {
			users: userTable,
		},
	}),
	expectedQueries: [
		[
			'create table "public"."users" ("id" integer generated always as identity not null,',
			'"count" integer, "name" text not null, constraint "users_pkey" primary key ("id"),',
			'constraint "users_6938566b_monolayer_chk" check ("count" > 0))',
		].join(" "),
		'alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique ("id")',
		'create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id")',
		'create index "users_e42f0227_monolayer_idx" on "public"."users" ("name")',
	],
});

testSchemaPush("Add Table with foreign key", {
	before: async (context) => {
		await sql
			.raw(
				`
					create table "public"."users" (
						"id" integer generated always as identity not null,
						"count" integer, "name" text not null,
						constraint "users_pkey" primary key ("id"),
						constraint "users_acdd8fa3_monolayer_key" unique ("id"),
						constraint "users_6938566b_monolayer_chk" check ("count" > 0)
					);
					alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" UNIQUE ("id");
					create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id");
					create index "users_e42f0227_monolayer_idx" on "public"."users" ("name");`,
			)
			.execute(context.dbClient);
	},
	schema: schema({
		tables: {
			users: userTable,
			books: table({
				columns: {
					id: integer().generatedAlwaysAsIdentity(),
					user_id: integer(),
				},
				constraints: {
					foreignKeys: [foreignKey(["user_id"], userTable, ["id"])],
				},
			}),
		},
	}),
	expectedQueries: [
		'create table "public"."books" ("id" integer generated always as identity not null, "user_id" integer, constraint "books_a8dfccb1_monolayer_fk" foreign key ("user_id") references "public"."users" ("id") on delete no action on update no action)',
	],
});

const usersCamelCase = table({
	columns: {
		id: integer().generatedAlwaysAsIdentity(),
		userName: text().notNull(),
		bookCount: integer(),
	},
	constraints: {
		primaryKey: primaryKey(["id"]),
		unique: [unique(["id"])],
		checks: [check(sql`${sql.ref("bookCount")} > 0`)],
	},
	indexes: [index(["id"]), index(["userName"])],
});

testSchemaPush("Add Table with columns, indexes, and constraints (camelCase)", {
	camelCase: true,
	schema: schema({
		tables: {
			users: usersCamelCase,
		},
	}),
	expectedQueries: [
		[
			'create table "public"."users" ("id" integer generated always as identity not null,',
			'"book_count" integer, "user_name" text not null, constraint "users_pkey" primary key ("id"),',
			'constraint "users_20f9c9d2_monolayer_chk" check ("book_count" > 0))',
		].join(" "),
		'alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique ("id")',
		'create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id")',
		'create index "users_d5b1b9f4_monolayer_idx" on "public"."users" ("user_name")',
	],
});

testSchemaPush("Add Table with foreign key (camelcase)", {
	before: async (context) => {
		await sql
			.raw(
				`
					create table "public"."users" (
						"id" integer generated always as identity not null,
						"book_count" integer, "user_name" text not null,
						constraint "users_pkey" primary key ("id"),
						constraint "users_20f9c9d2_monolayer_chk" check ("book_count" > 0)
					);
					alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique ("id");
					create index "users_0c84fd75_monolayer_idx" on "public"."users" ("id");
					create index "users_d5b1b9f4_monolayer_idx" on "public"."users" ("user_name");`,
			)
			.execute(context.dbClient);
	},
	camelCase: true,
	schema: schema({
		tables: {
			users: usersCamelCase,
			books: table({
				columns: {
					id: integer().generatedAlwaysAsIdentity(),
					userId: integer(),
				},
				constraints: {
					foreignKeys: [foreignKey(["userId"], usersCamelCase, ["id"])],
				},
			}),
		},
	}),
	expectedQueries: [
		'create table "public"."books" ("id" integer generated always as identity not null, "user_id" integer, constraint "books_a8dfccb1_monolayer_fk" foreign key ("user_id") references "public"."users" ("id") on delete no action on update no action)',
	],
});
