/* eslint-disable max-lines */
import {
	foreignKey,
	integer,
	primaryKey,
	schema,
} from "@monorepo/pg/api/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";
import { columnRename } from "~tests/__setup__/helpers/factories/renames.js";

testSchemaPush("Rename child table", {
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
				userAccounts: table({
					columns: {
						id: integer(),
						bookId: integer(),
					},
					constraints: {
						foreignKeys: [foreignKey(["bookId"], books, ["id"])],
					},
				}),
			},
		});
	},
	renames: {
		tables: [
			{
				name: "",
				schema: "public",
				table: "users",
				from: "public.users",
				to: "public.userAccounts",
				type: "tableRename",
			},
		],
	},
	expectedQueries: [
		'alter table "public"."users" rename to "userAccounts"',
		'ALTER TABLE "public"."userAccounts" RENAME CONSTRAINT "users_77cbdd9a_monolayer_fk" TO "userAccounts_fa78d878_monolayer_fk"',
	],
	assertDatabase: async ({ assert, refute }) => {
		await assert.table("public.userAccounts");
		await refute.table("public.users");
		await refute.constraint(
			"users_77cbdd9a_monolayer_fk",
			"public.userAccounts",
		);
		await assert.constraint(
			"userAccounts_fa78d878_monolayer_fk",
			"public.userAccounts",
		);
	},
});

testSchemaPush("Rename child table camel case", {
	before: async (context) => {
		await sql`
				create table "public"."books" ("id" integer, constraint books_pkey_idx primary key ("id"));
				create table "public"."users" ("book_id" integer, "id" integer,
					 constraint "users_260bb10a_monolayer_fk" foreign key ("book_id")
						 references "public"."books" ("id") on delete no action on update no action);`.execute(
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
				userAccounts: table({
					columns: {
						id: integer(),
						bookId: integer(),
					},
					constraints: {
						foreignKeys: [foreignKey(["bookId"], books, ["id"])],
					},
				}),
			},
		});
	},
	renames: {
		tables: [
			{
				name: "",
				schema: "public",
				table: "users",
				from: "public.users",
				to: "public.user_accounts",
				type: "tableRename",
			},
		],
	},
	camelCase: true,
	expectedQueries: [
		'alter table "public"."users" rename to "user_accounts"',
		'ALTER TABLE "public"."user_accounts" RENAME CONSTRAINT "users_260bb10a_monolayer_fk" TO "user_accounts_260bb10a_monolayer_fk"',
	],
	assertDatabase: async ({ assert, refute }) => {
		await assert.table("public.user_accounts");
		await refute.table("public.users");
		await refute.constraint(
			"users_260bb10a_monolayer_fk",
			"public.user_accounts",
		);
		await assert.constraint(
			"user_accounts_260bb10a_monolayer_fk",
			"public.user_accounts",
		);
	},
});

testSchemaPush("Rename child column", {
	before: async (context) => {
		await sql`
				  create table "public"."books" (
						"id" integer,
						constraint "books_pkey" primary key ("id")
					);
  				create table "public"."userAccounts" (
						"bookId" integer,
						"id" integer,
						constraint "userAccounts_fa78d878_monolayer_fk" foreign key ("bookId")
							references "public"."books" ("id") on delete no action on update no action
					);`.execute(context.dbClient);
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
				userAccounts: table({
					columns: {
						id: integer(),
						booksId: integer(),
					},
					constraints: {
						foreignKeys: [foreignKey(["booksId"], books, ["id"])],
					},
				}),
			},
		});
	},
	renames: {
		tables: [],
		columns: {
			"public.userAccounts": [
				columnRename("public", "userAccounts", "bookId", "booksId"),
			],
		},
	},
	expectedQueries: [
		'alter table "public"."userAccounts" rename column "bookId" to "booksId"',
		'ALTER TABLE "public"."userAccounts" RENAME CONSTRAINT "userAccounts_fa78d878_monolayer_fk" TO "userAccounts_b62e72bb_monolayer_fk"',
	],
	assertDatabase: async ({ assert, refute }) => {
		await assert.table("public.userAccounts");
		await refute.table("public.users");
		await assert.constraint(
			"userAccounts_b62e72bb_monolayer_fk",
			"public.userAccounts",
		);
		await refute.constraint(
			"userAccounts_fa78d878_monolayer_fk",
			"public.userAccounts",
		);
	},
});

testSchemaPush("Rename child column camel case", {
	before: async (context) => {
		await sql`
				  create table "public"."books" (
						"id" integer,
						constraint "books_pkey" primary key ("id")
					);
					create table "public"."user_accounts" (
					  "book_id" integer,
						"id" integer,
						constraint "user_accounts_260bb10a_monolayer_fk"
							foreign key ("book_id") references "public"."books" ("id") on delete no action on update no action
					);`.execute(context.dbClient);
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
				userAccounts: table({
					columns: {
						id: integer(),
						booksId: integer(),
					},
					constraints: {
						foreignKeys: [foreignKey(["booksId"], books, ["id"])],
					},
				}),
			},
		});
	},
	renames: {
		tables: [],
		columns: {
			"public.user_accounts": [
				columnRename("public", "user_accounts", "book_id", "books_id"),
			],
		},
	},
	camelCase: true,
	expectedQueries: [
		'alter table "public"."user_accounts" rename column "book_id" to "books_id"',
		'ALTER TABLE "public"."user_accounts" RENAME CONSTRAINT "user_accounts_260bb10a_monolayer_fk" TO "user_accounts_6fff7eaf_monolayer_fk"',
	],
	assertDatabase: async ({ assert, refute }) => {
		await assert.constraint(
			"user_accounts_6fff7eaf_monolayer_fk",
			"public.user_accounts",
		);
		await refute.constraint(
			"user_accounts_260bb10a_monolayer_fk",
			"public.user_accounts",
		);
	},
});

testSchemaPush("Rename parent table", {
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
					constraints: {
						foreignKeys: [foreignKey(["bookId"], userBooks, ["id"])],
					},
				}),
			},
		});
	},
	renames: {
		tables: [
			{
				name: "",
				schema: "public",
				table: "users",
				from: "public.books",
				to: "public.userBooks",
				type: "tableRename",
			},
		],
	},
	expectedQueries: [
		'alter table "public"."books" rename to "userBooks"',
		'ALTER TABLE "public"."users" RENAME CONSTRAINT "users_77cbdd9a_monolayer_fk" TO "users_a070aa83_monolayer_fk"',
	],
	assertDatabase: async ({ assert, refute }) => {
		await assert.table("public.userBooks");
		await refute.table("public.books");
		await assert.constraint("users_a070aa83_monolayer_fk", "public.users");
		await refute.constraint("users_77cbdd9a_monolayer_fk", "public.users");
		await assert.constraint("userBooks_pkey_idx", "public.userBooks");
		await refute.constraint("books_pkey_idx", "public.userBooks");
	},
});

testSchemaPush("Rename parent table camel case", {
	before: async (context) => {
		await sql`
				create table "public"."books" ("id" integer, constraint books_pkey_idx primary key ("id"));
				create table "public"."users" ("id" integer, "book_id" integer,
					constraint "users_148cbac6_monolayer_fk" foreign key ("book_id")
						references "public"."books" ("id") on delete no action on update no action not valid);`.execute(
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
					constraints: {
						foreignKeys: [foreignKey(["bookId"], userBooks, ["id"])],
					},
				}),
			},
		});
	},
	camelCase: true,
	renames: {
		tables: [
			{
				name: "",
				schema: "public",
				table: "users",
				from: "public.books",
				to: "public.user_books",
				type: "tableRename",
			},
		],
	},
	expectedQueries: [
		'alter table "public"."books" rename to "user_books"',
		'ALTER TABLE "public"."users" RENAME CONSTRAINT "users_148cbac6_monolayer_fk" TO "users_74038619_monolayer_fk"',
	],
	assertDatabase: async ({ assert, refute }) => {
		await assert.table("public.user_books");
		await refute.table("public.books");
		await assert.constraint("users_74038619_monolayer_fk", "public.users");
		await refute.constraint("users_148cbac6_monolayer_fk", "public.users");
		await assert.constraint("user_books_pkey_idx", "public.user_books");
		await refute.constraint("books_pkey_idx", "public.user_books");
	},
});

testSchemaPush("Rename parent column", {
	before: async (context) => {
		await sql`
				  create table "public"."books" (
						"id" integer,
						constraint "books_pkey" primary key ("id")
					);
  				create table "public"."userAccounts" (
						"bookId" integer,
						"id" integer,
						constraint "userAccounts_fa78d878_monolayer_fk" foreign key ("bookId")
							references "public"."books" ("id") on delete no action on update no action
					);`.execute(context.dbClient);
	},
	schema: () => {
		const books = table({
			columns: {
				bookId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["bookId"]),
			},
		});
		return schema({
			tables: {
				books,
				userAccounts: table({
					columns: {
						id: integer(),
						bookId: integer(),
					},
					constraints: {
						foreignKeys: [foreignKey(["bookId"], books, ["bookId"])],
					},
				}),
			},
		});
	},
	renames: {
		tables: [],
		columns: {
			"public.books": [columnRename("public", "books", "id", "bookId")],
		},
	},
	expectedQueries: [
		'alter table "public"."books" rename column "id" to "bookId"',
		'ALTER TABLE "public"."userAccounts" RENAME CONSTRAINT "userAccounts_fa78d878_monolayer_fk" TO "userAccounts_8a1cc870_monolayer_fk"',
	],
	assertDatabase: async ({ assert, refute }) => {
		await assert.constraint(
			"userAccounts_8a1cc870_monolayer_fk",
			"public.userAccounts",
		);
		await refute.constraint(
			"userAccounts_fa78d878_monolayer_fk",
			"public.userAccounts",
		);
	},
});
