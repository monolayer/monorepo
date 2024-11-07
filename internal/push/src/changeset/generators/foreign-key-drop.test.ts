import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { describe } from "vitest";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

describe("Drop foreign key", () => {
	testSchemaPush("single column", {
		before: async (context) => {
			await sql`
					create table "public"."books" ("id" integer, constraint books_pkey_idx primary key ("id"));
					create table "public"."users" ("id" integer, "bookId" integer,
					  constraint "users_77cbdd9a_monolayer_fk" foreign key ("bookId")
						  references "public"."books" ("id") on delete no action on update no action not valid);`.execute(
				context.dbClient,
			);
		},
		schema: () => {
			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});
			return schema({
				tables: {
					books,
					users: table({
						columns: {
							id: integer(),
							bookId: integer(),
						},
					}),
				},
			});
		},
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_77cbdd9a_monolayer_fk"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_77cbdd9a_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("composite", {
		before: async (context) => {
			await sql`
					create table "public"."books" ("id" integer, "secondId" integer, constraint books_pkey_idx primary key ("id", "secondId"));
					create table "public"."users" ("id" integer, "bookId" integer, "secondBookId" integer,
					  constraint "users_277b7052_monolayer_fk" foreign key ("bookId", "secondBookId")
						  references "public"."books" ("id", "secondId") on delete no action on update no action not valid);`.execute(
				context.dbClient,
			);
		},
		schema: () => {
			const books = table({
				columns: {
					id: integer(),
					secondId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "secondId"]),
				},
			});
			return schema({
				tables: {
					books,
					users: table({
						columns: {
							id: integer(),
							bookId: integer(),
							secondBookId: integer(),
						},
					}),
				},
			});
		},
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_277b7052_monolayer_fk"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_277b7052_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("single column camel case", {
		before: async (context) => {
			await sql`
					create table "public"."user_books" ("id" integer, constraint user_books_pkey_idx primary key ("id"));
					create table "public"."users" ("id" integer, "book_id" integer,
					  constraint "users_74038619_monolayer_fk" foreign key ("book_id")
						  references "public"."user_books" ("id") on delete no action on update no action not valid);`.execute(
				context.dbClient,
			);
		},
		schema: () => {
			const userBooks = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});
			return schema({
				tables: {
					userBooks,
					users: table({
						columns: {
							id: integer(),
							bookId: integer(),
						},
					}),
				},
			});
		},
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_74038619_monolayer_fk"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_74038619_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("composite camel case", {
		before: async (context) => {
			await sql`
					create table "public"."user_books" ("id" integer, "second_id" integer,
					  constraint books_pkey_idx primary key ("id", "second_id"));
					create table "public"."users" ("id" integer, "book_id" integer, "second_book_id" integer,
					  constraint "users_e9dcc3e2_monolayer_fk" foreign key ("book_id", "second_book_id")
						  references "public"."user_books" ("id", "second_id") on delete no action on update no action not valid);`.execute(
				context.dbClient,
			);
		},
		schema: () => {
			const userBooks = table({
				columns: {
					id: integer(),
					secondId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id", "secondId"]),
				},
			});
			return schema({
				tables: {
					userBooks,
					users: table({
						columns: {
							id: integer(),
							bookId: integer(),
							secondBookId: integer(),
						},
					}),
				},
			});
		},
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_e9dcc3e2_monolayer_fk"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_e9dcc3e2_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("multiple single column", {
		before: async (context) => {
			await sql`
					create table "public"."charts" ("id" integer, constraint charts_pkey_idx primary key ("id"));
					create table "public"."books" ("id" integer, constraint books_pkey_idx primary key ("id"));
					create table "public"."users" ("id" integer, "bookId" integer, "chartId" integer);
					alter table "public"."users" add constraint "users_77cbdd9a_monolayer_fk" foreign key ("bookId") references "public"."books" ("id") on delete no action on update no action;
          alter table "public"."users" add constraint "users_4e01b89d_monolayer_fk" foreign key ("chartId") references "public"."charts" ("id") on delete no action on update no action;
				`.execute(context.dbClient);
		},
		schema: () => {
			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});
			const charts = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});
			return schema({
				tables: {
					books,
					charts,
					users: table({
						columns: {
							id: integer(),
							bookId: integer(),
							chartId: integer(),
						},
					}),
				},
			});
		},
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_77cbdd9a_monolayer_fk"',
			'alter table "public"."users" drop constraint "users_4e01b89d_monolayer_fk"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_77cbdd9a_monolayer_fk", "public.users");
			await refute.constraint("users_4e01b89d_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("multiple single column camel case", {
		before: async (context) => {
			await sql`
					create table "public"."user_charts" ("id" integer, constraint user_charts_pkey_idx primary key ("id"));
					create table "public"."user_books" ("id" integer, constraint user_books_pkey_idx primary key ("id"));
					create table "public"."users" ("id" integer, "book_id" integer, "chart_id" integer);
          alter table "public"."users" add constraint "users_74038619_monolayer_fk" foreign key ("book_id") references "public"."user_books" ("id") on delete no action on update no action not valid;
			    alter table "public"."users" add constraint "users_35e574bd_monolayer_fk" foreign key ("chart_id") references "public"."user_charts" ("id") on delete no action on update no action not valid;
			`.execute(context.dbClient);
		},
		schema: () => {
			const userBooks = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});
			const userCharts = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});
			return schema({
				tables: {
					userBooks,
					userCharts,
					users: table({
						columns: {
							id: integer(),
							bookId: integer(),
							chartId: integer(),
						},
					}),
				},
			});
		},
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" drop constraint "users_74038619_monolayer_fk"',
			'alter table "public"."users" drop constraint "users_35e574bd_monolayer_fk"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.constraint("users_74038619_monolayer_fk", "public.users");
			await refute.constraint("users_35e574bd_monolayer_fk", "public.users");
		},
	});
});
