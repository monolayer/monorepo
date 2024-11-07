import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { foreignKey } from "@monorepo/pg/schema/foreign-key.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { unique } from "@monorepo/pg/schema/unique.js";
import { sql } from "kysely";
import { describe } from "vitest";
import { testSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";

describe("Create foreign key", () => {
	testSchemaPush("existing child column, existing parent column", {
		before: async (context) => {
			await sql`
					create table "public"."books" ("id" integer, constraint books_pkey_idx primary key ("id"));
					create table "public"."users" ("id" integer, "bookId" integer);`.execute(
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
						constraints: {
							foreignKeys: [foreignKey(["bookId"], books, ["id"])],
						},
					}),
				},
			});
		},
		expectedQueries: [
			'alter table "public"."users" add constraint "users_77cbdd9a_monolayer_fk" foreign key ("bookId") references "public"."books" ("id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_77cbdd9a_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_77cbdd9a_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child column, existing parent column", {
		before: async (context) => {
			await sql`
					create table "public"."books" ("id" integer, constraint books_pkey_idx primary key ("id"));
					create table "public"."users" ("id" integer);`.execute(context.dbClient);
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
						constraints: {
							foreignKeys: [foreignKey(["bookId"], books, ["id"])],
						},
					}),
				},
			});
		},
		expectedQueries: [
			'alter table "public"."users" add column "bookId" integer',
			'alter table "public"."users" add constraint "users_77cbdd9a_monolayer_fk" foreign key ("bookId") references "public"."books" ("id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_77cbdd9a_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_77cbdd9a_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child column, new child table, existing parent column", {
		before: async (context) => {
			await sql`
					create table "public"."books" ("id" integer, constraint books_pkey_idx primary key ("id"));`.execute(
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
						constraints: {
							foreignKeys: [foreignKey(["bookId"], books, ["id"])],
						},
					}),
				},
			});
		},
		expectedQueries: [
			[
				'create table "public"."users" ("bookId" integer, "id" integer,',
				'constraint "users_77cbdd9a_monolayer_fk" foreign key ("bookId") references "public"."books" ("id") on delete no action on update no action)',
			].join(" "),
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_77cbdd9a_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("multiple new", {
		before: async (context) => {
			await sql`
					create table "public"."charts" ("id" integer, constraint charts_pkey_idx primary key ("id"));
					create table "public"."books" ("id" integer, constraint books_pkey_idx primary key ("id"));
					create table "public"."users" ("id" integer, "bookId" integer, "chartId" integer);`.execute(
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId"], books, ["id"]),
								foreignKey(["chartId"], charts, ["id"]),
							],
						},
					}),
				},
			});
		},
		expectedQueries: [
			'alter table "public"."users" add constraint "users_77cbdd9a_monolayer_fk" foreign key ("bookId") references "public"."books" ("id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_77cbdd9a_monolayer_fk"',
			'alter table "public"."users" add constraint "users_4e01b89d_monolayer_fk" foreign key ("chartId") references "public"."charts" ("id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_4e01b89d_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_77cbdd9a_monolayer_fk", "public.users");
			await assert.constraint("users_4e01b89d_monolayer_fk", "public.users");
		},
	});
});

describe("Create foreign key (camel case)", () => {
	testSchemaPush("existing child column, existing parent column", {
		before: async (context) => {
			await sql`
					create table "public"."user_books" ("book_id" integer, constraint user_books_pkey_idx primary key ("book_id"));
					create table "public"."users" ("id" integer, "book_id" integer);`.execute(
				context.dbClient,
			);
		},
		schema: () => {
			const userBooks = table({
				columns: {
					bookId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId"]),
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
							foreignKeys: [foreignKey(["bookId"], userBooks, ["bookId"])],
						},
					}),
				},
			});
		},
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" add constraint "users_9f4bc21f_monolayer_fk" foreign key ("book_id") references "public"."user_books" ("book_id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_9f4bc21f_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_9f4bc21f_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child column, existing parent column", {
		before: async (context) => {
			await sql`
					create table "public"."user_books" ("book_id" integer, constraint user_books_pkey_idx primary key ("book_id"));
					create table "public"."users" ("id" integer);`.execute(context.dbClient);
		},
		schema: () => {
			const userBooks = table({
				columns: {
					bookId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId"]),
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
							foreignKeys: [foreignKey(["bookId"], userBooks, ["bookId"])],
						},
					}),
				},
			});
		},
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" add column "book_id" integer',
			'alter table "public"."users" add constraint "users_9f4bc21f_monolayer_fk" foreign key ("book_id") references "public"."user_books" ("book_id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_9f4bc21f_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_9f4bc21f_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child column, new child table, existing parent column", {
		before: async (context) => {
			await sql`
					create table "public"."user_books" ("book_id" integer, constraint user_books_pkey_idx primary key ("book_id"));`.execute(
				context.dbClient,
			);
		},
		schema: () => {
			const userBooks = table({
				columns: {
					bookId: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["bookId"]),
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
							foreignKeys: [foreignKey(["bookId"], userBooks, ["bookId"])],
						},
					}),
				},
			});
		},
		camelCase: true,
		expectedQueries: [
			[
				'create table "public"."users" ("book_id" integer, "id" integer,',
				'constraint "users_9f4bc21f_monolayer_fk" foreign key ("book_id") references "public"."user_books" ("book_id") on delete no action on update no action)',
			].join(" "),
		],
		assertDatabase: async ({ assert }) => {
			assert.constraint("users_9f4bc21f_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("multiple new camel case", {
		before: async (context) => {
			await sql`
					create table "public"."user_charts" ("id" integer, constraint user_charts_pkey_idx primary key ("id"));
					create table "public"."user_books" ("id" integer, constraint user_books_pkey_idx primary key ("id"));
					create table "public"."users" ("id" integer, "book_id" integer, "chart_id" integer);`.execute(
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId"], userBooks, ["id"]),
								foreignKey(["chartId"], userCharts, ["id"]),
							],
						},
					}),
				},
			});
		},
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" add constraint "users_74038619_monolayer_fk" foreign key ("book_id") references "public"."user_books" ("id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_74038619_monolayer_fk"',
			'alter table "public"."users" add constraint "users_35e574bd_monolayer_fk" foreign key ("chart_id") references "public"."user_charts" ("id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_35e574bd_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_74038619_monolayer_fk", "public.users");
			await assert.constraint("users_35e574bd_monolayer_fk", "public.users");
		},
	});
});

describe("Create composite foreign key", () => {
	testSchemaPush("existing child columns, existing parent columns", {
		before: async (context) => {
			await sql`
					create table "public"."userBooks" ("id" integer, "secondId" integer, constraint books_pkey_idx primary key ("id", "secondId"));
					create table "public"."users" ("id" integer, "bookId" integer, "secondBookId" integer);`.execute(
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId", "secondBookId"], userBooks, [
									"id",
									"secondId",
								]),
							],
						},
					}),
				},
			});
		},
		expectedQueries: [
			'alter table "public"."users" add constraint "users_42c2c2c0_monolayer_fk" foreign key ("bookId", "secondBookId") references "public"."userBooks" ("id", "secondId") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_42c2c2c0_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_42c2c2c0_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child column, existing parent columns", {
		before: async (context) => {
			await sql`
					create table "public"."userBooks" ("id" integer, "secondId" integer, constraint books_pkey_idx primary key ("id", "secondId"));
					create table "public"."users" ("id" integer, "bookId" integer);`.execute(
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId", "secondBookId"], userBooks, [
									"id",
									"secondId",
								]),
							],
						},
					}),
				},
			});
		},
		expectedQueries: [
			'alter table "public"."users" add column "secondBookId" integer',
			'alter table "public"."users" add constraint "users_42c2c2c0_monolayer_fk" foreign key ("bookId", "secondBookId") references "public"."userBooks" ("id", "secondId") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_42c2c2c0_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_42c2c2c0_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child column, new parent column", {
		before: async (context) => {
			await sql`
					create table "public"."userBooks" ("id" integer, constraint "userBooks_pkey" primary key ("id"));
					create table "public"."users" ("id" integer, "bookId" integer);`.execute(
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
					primaryKey: primaryKey(["id"]),
					unique: [unique(["id", "secondId"])],
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId", "secondBookId"], userBooks, [
									"id",
									"secondId",
								]),
							],
						},
					}),
				},
			});
		},
		expectedQueries: [
			'alter table "public"."userBooks" add column "secondId" integer',
			'alter table "public"."users" add column "secondBookId" integer',
			'create unique index concurrently "userBooks_85399bdb_monolayer_key_monolayer_uc_idx" on "public"."userBooks" ("id", "secondId") ',
			'alter table "public"."userBooks" add constraint "userBooks_85399bdb_monolayer_key" unique using index "userBooks_85399bdb_monolayer_key_monolayer_uc_idx"',
			'alter table "public"."users" add constraint "users_42c2c2c0_monolayer_fk" foreign key ("bookId", "secondBookId") references "public"."userBooks" ("id", "secondId") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_42c2c2c0_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_42c2c2c0_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child column, new parent columns", {
		before: async (context) => {
			await sql`
					create table "public"."userBooks" ();
					create table "public"."users" ("id" integer, "bookId" integer);`.execute(
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId", "secondBookId"], userBooks, [
									"id",
									"secondId",
								]),
							],
						},
					}),
				},
			});
		},
		expectedQueries: [
			'alter table "public"."users" add column "secondBookId" integer',
			'alter table "public"."userBooks" add column "id" integer',
			'alter table "public"."userBooks" add column "secondId" integer',
			'create unique index concurrently "userBooks_pkey_idx" on "public"."userBooks" ("id", "secondId")',
			'alter table "public"."userBooks" add constraint "id_temporary_not_null_check_constraint" check ("id" IS NOT NULL) not valid',
			'alter table "public"."userBooks" validate constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."userBooks" add constraint "secondId_temporary_not_null_check_constraint" check ("secondId" IS NOT NULL) not valid',
			'alter table "public"."userBooks" validate constraint "secondId_temporary_not_null_check_constraint"',
			'alter table "public"."userBooks" add constraint "userBooks_pkey" primary key using index "userBooks_pkey_idx"',
			'alter table "public"."userBooks" drop constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."userBooks" drop constraint "secondId_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_42c2c2c0_monolayer_fk" foreign key ("bookId", "secondBookId") references "public"."userBooks" ("id", "secondId") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_42c2c2c0_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_42c2c2c0_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child columns, existing parent columns", {
		before: async (context) => {
			await sql`
					create table "public"."userBooks" ("id" integer, "secondId" integer, constraint userBooks_pkey primary key ("id", "secondId"));
					create table "public"."users" ("id" integer);`.execute(context.dbClient);
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId", "secondBookId"], userBooks, [
									"id",
									"secondId",
								]),
							],
						},
					}),
				},
			});
		},
		expectedQueries: [
			'alter table "public"."users" add column "bookId" integer',
			'alter table "public"."users" add column "secondBookId" integer',
			'alter table "public"."users" add constraint "users_42c2c2c0_monolayer_fk" foreign key ("bookId", "secondBookId") references "public"."userBooks" ("id", "secondId") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_42c2c2c0_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_42c2c2c0_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child columns, new parent column", {
		before: async (context) => {
			await sql`
					create table "public"."userBooks" ("id" integer);
					create table "public"."users" ("id" integer);`.execute(context.dbClient);
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId", "secondBookId"], userBooks, [
									"id",
									"secondId",
								]),
							],
						},
					}),
				},
			});
		},
		expectedQueries: [
			'alter table "public"."userBooks" add column "secondId" integer',
			'alter table "public"."users" add column "bookId" integer',
			'alter table "public"."users" add column "secondBookId" integer',
			'create unique index concurrently "userBooks_pkey_idx" on "public"."userBooks" ("id", "secondId")',
			'alter table "public"."userBooks" add constraint "id_temporary_not_null_check_constraint" check ("id" IS NOT NULL) not valid',
			'alter table "public"."userBooks" validate constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."userBooks" add constraint "secondId_temporary_not_null_check_constraint" check ("secondId" IS NOT NULL) not valid',
			'alter table "public"."userBooks" validate constraint "secondId_temporary_not_null_check_constraint"',
			'alter table "public"."userBooks" add constraint "userBooks_pkey" primary key using index "userBooks_pkey_idx"',
			'alter table "public"."userBooks" drop constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."userBooks" drop constraint "secondId_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_42c2c2c0_monolayer_fk" foreign key ("bookId", "secondBookId") references "public"."userBooks" ("id", "secondId") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_42c2c2c0_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_42c2c2c0_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child columns, new parent columns", {
		before: async (context) => {
			await sql`
					create table "public"."userBooks" ();
					create table "public"."users" ("id" integer);`.execute(context.dbClient);
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId", "secondBookId"], userBooks, [
									"id",
									"secondId",
								]),
							],
						},
					}),
				},
			});
		},
		expectedQueries: [
			'alter table "public"."users" add column "bookId" integer',
			'alter table "public"."users" add column "secondBookId" integer',
			'alter table "public"."userBooks" add column "id" integer',
			'alter table "public"."userBooks" add column "secondId" integer',
			'create unique index concurrently "userBooks_pkey_idx" on "public"."userBooks" ("id", "secondId")',
			'alter table "public"."userBooks" add constraint "id_temporary_not_null_check_constraint" check ("id" IS NOT NULL) not valid',
			'alter table "public"."userBooks" validate constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."userBooks" add constraint "secondId_temporary_not_null_check_constraint" check ("secondId" IS NOT NULL) not valid',
			'alter table "public"."userBooks" validate constraint "secondId_temporary_not_null_check_constraint"',
			'alter table "public"."userBooks" add constraint "userBooks_pkey" primary key using index "userBooks_pkey_idx"',
			'alter table "public"."userBooks" drop constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."userBooks" drop constraint "secondId_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_42c2c2c0_monolayer_fk" foreign key ("bookId", "secondBookId") references "public"."userBooks" ("id", "secondId") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_42c2c2c0_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_42c2c2c0_monolayer_fk", "public.users");
		},
	});
});

describe("Create composite foreign key (camel case)", () => {
	testSchemaPush("existing child columns, existing parent columns", {
		before: async (context) => {
			await sql`
					create table "public"."user_books" ("id" integer, "second_id" integer, constraint books_pkey_idx primary key ("id", "second_id"));
					create table "public"."users" ("id" integer, "book_id" integer, "second_book_id" integer);`.execute(
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId", "secondBookId"], userBooks, [
									"id",
									"secondId",
								]),
							],
						},
					}),
				},
			});
		},
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" add constraint "users_e9dcc3e2_monolayer_fk" foreign key ("book_id", "second_book_id") references "public"."user_books" ("id", "second_id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_e9dcc3e2_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_e9dcc3e2_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child column, existing parent columns", {
		before: async (context) => {
			await sql`
					create table "public"."user_books" ("id" integer, "second_id" integer, constraint books_pkey_idx primary key ("id", "second_id"));
					create table "public"."users" ("id" integer, "book_id" integer);`.execute(
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId", "secondBookId"], userBooks, [
									"id",
									"secondId",
								]),
							],
						},
					}),
				},
			});
		},
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" add column "second_book_id" integer',
			'alter table "public"."users" add constraint "users_e9dcc3e2_monolayer_fk" foreign key ("book_id", "second_book_id") references "public"."user_books" ("id", "second_id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_e9dcc3e2_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_e9dcc3e2_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child column, new parent column", {
		before: async (context) => {
			await sql`
					create table "public"."user_books" ("id" integer, constraint "user_books_pkey" primary key ("id"));
					create table "public"."users" ("id" integer, "book_id" integer);`.execute(
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
					primaryKey: primaryKey(["id"]),
					unique: [unique(["id", "secondId"])],
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId", "secondBookId"], userBooks, [
									"id",
									"secondId",
								]),
							],
						},
					}),
				},
			});
		},
		camelCase: true,
		expectedQueries: [
			'alter table "public"."user_books" add column "second_id" integer',
			'alter table "public"."users" add column "second_book_id" integer',
			'create unique index concurrently "user_books_f7a42dd2_monolayer_key_monolayer_uc_idx" on "public"."user_books" ("id", "second_id") ',
			'alter table "public"."user_books" add constraint "user_books_f7a42dd2_monolayer_key" unique using index "user_books_f7a42dd2_monolayer_key_monolayer_uc_idx"',
			'alter table "public"."users" add constraint "users_e9dcc3e2_monolayer_fk" foreign key ("book_id", "second_book_id") references "public"."user_books" ("id", "second_id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_e9dcc3e2_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_e9dcc3e2_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child column, new parent columns", {
		before: async (context) => {
			await sql`
					create table "public"."user_books" ();
					create table "public"."users" ("id" integer, "book_id" integer);`.execute(
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId", "secondBookId"], userBooks, [
									"id",
									"secondId",
								]),
							],
						},
					}),
				},
			});
		},
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" add column "second_book_id" integer',
			'alter table "public"."user_books" add column "id" integer',
			'alter table "public"."user_books" add column "second_id" integer',
			'create unique index concurrently "user_books_pkey_idx" on "public"."user_books" ("id", "second_id")',
			'alter table "public"."user_books" add constraint "id_temporary_not_null_check_constraint" check ("id" IS NOT NULL) not valid',
			'alter table "public"."user_books" validate constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."user_books" add constraint "second_id_temporary_not_null_check_constraint" check ("second_id" IS NOT NULL) not valid',
			'alter table "public"."user_books" validate constraint "second_id_temporary_not_null_check_constraint"',
			'alter table "public"."user_books" add constraint "user_books_pkey" primary key using index "user_books_pkey_idx"',
			'alter table "public"."user_books" drop constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."user_books" drop constraint "second_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_e9dcc3e2_monolayer_fk" foreign key ("book_id", "second_book_id") references "public"."user_books" ("id", "second_id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_e9dcc3e2_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("user_books_pkey", "public.user_books");
			await assert.constraint("users_e9dcc3e2_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child columns, existing parent columns", {
		before: async (context) => {
			await sql`
					create table "public"."user_books" ("id" integer, "second_id" integer, constraint user_books_pkey primary key ("id", "second_id"));
					create table "public"."users" ("id" integer);`.execute(context.dbClient);
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId", "secondBookId"], userBooks, [
									"id",
									"secondId",
								]),
							],
						},
					}),
				},
			});
		},
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" add column "book_id" integer',
			'alter table "public"."users" add column "second_book_id" integer',
			'alter table "public"."users" add constraint "users_e9dcc3e2_monolayer_fk" foreign key ("book_id", "second_book_id") references "public"."user_books" ("id", "second_id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_e9dcc3e2_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_e9dcc3e2_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child columns, new parent column", {
		before: async (context) => {
			await sql`
					create table "public"."user_books" ("id" integer);
					create table "public"."users" ("id" integer);`.execute(context.dbClient);
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId", "secondBookId"], userBooks, [
									"id",
									"secondId",
								]),
							],
						},
					}),
				},
			});
		},
		camelCase: true,
		expectedQueries: [
			'alter table "public"."user_books" add column "second_id" integer',
			'alter table "public"."users" add column "book_id" integer',
			'alter table "public"."users" add column "second_book_id" integer',
			'create unique index concurrently "user_books_pkey_idx" on "public"."user_books" ("id", "second_id")',
			'alter table "public"."user_books" add constraint "id_temporary_not_null_check_constraint" check ("id" IS NOT NULL) not valid',
			'alter table "public"."user_books" validate constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."user_books" add constraint "second_id_temporary_not_null_check_constraint" check ("second_id" IS NOT NULL) not valid',
			'alter table "public"."user_books" validate constraint "second_id_temporary_not_null_check_constraint"',
			'alter table "public"."user_books" add constraint "user_books_pkey" primary key using index "user_books_pkey_idx"',
			'alter table "public"."user_books" drop constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."user_books" drop constraint "second_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_e9dcc3e2_monolayer_fk" foreign key ("book_id", "second_book_id") references "public"."user_books" ("id", "second_id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_e9dcc3e2_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("users_e9dcc3e2_monolayer_fk", "public.users");
		},
	});

	testSchemaPush("new child columns, new parent columns", {
		before: async (context) => {
			await sql`
					create table "public"."user_books" ();
					create table "public"."users" ("id" integer);`.execute(context.dbClient);
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
						constraints: {
							foreignKeys: [
								foreignKey(["bookId", "secondBookId"], userBooks, [
									"id",
									"secondId",
								]),
							],
						},
					}),
				},
			});
		},
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" add column "book_id" integer',
			'alter table "public"."users" add column "second_book_id" integer',
			'alter table "public"."user_books" add column "id" integer',
			'alter table "public"."user_books" add column "second_id" integer',
			'create unique index concurrently "user_books_pkey_idx" on "public"."user_books" ("id", "second_id")',
			'alter table "public"."user_books" add constraint "id_temporary_not_null_check_constraint" check ("id" IS NOT NULL) not valid',
			'alter table "public"."user_books" validate constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."user_books" add constraint "second_id_temporary_not_null_check_constraint" check ("second_id" IS NOT NULL) not valid',
			'alter table "public"."user_books" validate constraint "second_id_temporary_not_null_check_constraint"',
			'alter table "public"."user_books" add constraint "user_books_pkey" primary key using index "user_books_pkey_idx"',
			'alter table "public"."user_books" drop constraint "id_temporary_not_null_check_constraint"',
			'alter table "public"."user_books" drop constraint "second_id_temporary_not_null_check_constraint"',
			'alter table "public"."users" add constraint "users_e9dcc3e2_monolayer_fk" foreign key ("book_id", "second_book_id") references "public"."user_books" ("id", "second_id") on delete no action on update no action not valid',
			'alter table "public"."users" validate constraint "users_e9dcc3e2_monolayer_fk"',
		],
		assertDatabase: async ({ assert }) => {
			await assert.constraint("user_books_pkey", "public.user_books");
			await assert.constraint("users_e9dcc3e2_monolayer_fk", "public.users");
		},
	});
});
