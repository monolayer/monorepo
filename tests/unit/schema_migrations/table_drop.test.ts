/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { integer, text } from "~/schema/pg_column.js";
import { pgDatabase } from "~/schema/pg_database.js";
import { extension } from "~/schema/pg_extension.js";
import { table } from "~/schema/pg_table.js";
import { unique } from "~/schema/pg_unique.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration_success.js";
import { setUpContext, teardownContext } from "~tests/helpers/test_context.js";
import { type DbContext } from "~tests/setup/kysely.js";

describe("Table drop migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("drop empty tables", async (context) => {
		const database = pgDatabase({
			tables: {
				books: table({
					columns: {},
				}),
			},
		});

		await context.kysely.schema.createTable("users").execute();
		await context.kysely.schema.createTable("books").execute();
		await context.kysely.schema.createTable("organizations").execute();

		const expected = [
			{
				tableName: "users",
				type: "dropTable",
				priority: 1006,
				down: [["await db.schema", 'createTable("users")', "execute();"]],
				up: [["await db.schema", 'dropTable("users")', "execute();"]],
			},
			{
				tableName: "organizations",
				type: "dropTable",
				priority: 1006,
				down: [
					["await db.schema", 'createTable("organizations")', "execute();"],
				],
				up: [["await db.schema", 'dropTable("organizations")', "execute();"]],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "same",
		});
	});

	test<DbContext>("drop table with columns", async (context) => {
		const database = pgDatabase({
			tables: {
				organizations: table({
					columns: {},
				}),
			},
		});
		await context.kysely.schema.createTable("organizations").execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("bigInt", "bigint")
			.addColumn("bigInt2", "bigint", (col) => col.notNull())
			.addColumn("bigSerial", "bigserial", (col) => col.notNull())
			.addColumn("boolean", "boolean")
			.addColumn("bytea", "bytea")
			.addColumn("char", "char(1)")
			.addColumn("char10", "char(10)")
			.addColumn("date", "date")
			.addColumn("doublePrecision", "double precision")
			.addColumn("float4", "float4")
			.addColumn("float8", "float8")
			.addColumn("smallint", "smallint")
			.addColumn("int4", "int4")
			.addColumn("int8", "int8")
			.addColumn("integer", "integer")
			.addColumn("integerAlwaysAsIdentity", "integer", (col) =>
				col.generatedAlwaysAsIdentity(),
			)
			.addColumn("integerDefaultAsIdentity", "integer", (col) =>
				col.generatedByDefaultAsIdentity(),
			)
			.execute();

		await context.kysely.schema
			.createTable("books")
			.addColumn("json", "json")
			.addColumn("jsonB", "jsonb")
			.addColumn("numeric", "numeric")
			.addColumn("numeric5", "numeric(5, 0)")
			.addColumn("numeric52", "numeric(5, 2)")
			.addColumn("real", "real")
			.addColumn("serial", "serial", (col) => col.notNull())
			.addColumn("text", "text")
			.addColumn("time", "time")
			.addColumn("time4", "time(4)")
			.addColumn("timeTz", "timetz")
			.addColumn("timeTz4", sql`timetz(4)`)
			.addColumn("timestamp", "timestamp")
			.addColumn("timestamp3", "timestamp(3)")
			.addColumn("timestampTz", "timestamptz")
			.addColumn("timestampTz3", "timestamptz(3)")
			.addColumn("uuid", "uuid")
			.addColumn("varChar", "varchar")
			.addColumn("varCharWithDefault", "varchar", (col) =>
				col.defaultTo(sql`\'foo\'::character varying`),
			)
			.addColumn("varChar255", "varchar(255)")
			.execute();

		await sql`COMMENT ON COLUMN "books"."varCharWithDefault" IS 'ae72411e1dc17562b8fb4a6b3c7d1624992dcd4b3fc77ed828606c24a286cf4c'`.execute(
			context.kysely,
		);

		const expected = [
			{
				tableName: "books",
				type: "dropTable",
				priority: 1006,
				up: [["await db.schema", 'dropTable("books")', "execute();"]],
				down: [
					[
						"await db.schema",
						'createTable("books")',
						'addColumn("json", "json")',
						'addColumn("jsonB", "jsonb")',
						'addColumn("numeric", "numeric")',
						'addColumn("numeric5", "numeric(5, 0)")',
						'addColumn("numeric52", "numeric(5, 2)")',
						'addColumn("real", "real")',
						'addColumn("serial", "serial", (col) => col.notNull())',
						'addColumn("text", "text")',
						'addColumn("time", "time")',
						'addColumn("time4", "time(4)")',
						'addColumn("timeTz", "timetz")',
						'addColumn("timeTz4", sql`timetz(4)`)',
						'addColumn("timestamp", "timestamp")',
						'addColumn("timestamp3", "timestamp(3)")',
						'addColumn("timestampTz", "timestamptz")',
						'addColumn("timestampTz3", "timestamptz(3)")',
						'addColumn("uuid", "uuid")',
						'addColumn("varChar", "varchar")',
						'addColumn("varChar255", "varchar(255)")',
						'addColumn("varCharWithDefault", "varchar", (col) => col.defaultTo(sql`\'foo\'::character varying`))',
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "books"."varCharWithDefault" IS \'ae72411e1dc17562b8fb4a6b3c7d1624992dcd4b3fc77ed828606c24a286cf4c\'`.execute(db);',
					],
				],
			},
			{
				tableName: "users",
				type: "dropTable",
				priority: 1006,
				up: [["await db.schema", 'dropTable("users")', "execute();"]],
				down: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("bigInt", "bigint")',
						'addColumn("bigInt2", "bigint", (col) => col.notNull())',
						'addColumn("bigSerial", "bigserial", (col) => col.notNull())',
						'addColumn("boolean", "boolean")',
						'addColumn("bytea", "bytea")',
						'addColumn("char", "char(1)")',
						'addColumn("char10", "char(10)")',
						'addColumn("date", "date")',
						'addColumn("doublePrecision", "double precision")',
						'addColumn("float4", "real")',
						'addColumn("float8", "double precision")',
						'addColumn("int4", "integer")',
						'addColumn("int8", "bigint")',
						'addColumn("integer", "integer")',
						'addColumn("integerAlwaysAsIdentity", "integer", (col) => col.notNull().generatedAlwaysAsIdentity())',
						'addColumn("integerDefaultAsIdentity", "integer", (col) => col.notNull().generatedByDefaultAsIdentity())',
						'addColumn("smallint", sql`smallint`)',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("drop table with primary key", async (context) => {
		const database = pgDatabase({
			tables: {
				organizations: table({
					columns: {},
				}),
			},
		});
		await context.kysely.schema.createTable("organizations").execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial", (col) => col.notNull())
			.execute();
		await sql`ALTER TABLE users ADD CONSTRAINT users_id_kinetic_pk PRIMARY KEY ("id")`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "bigserial", (col) => col.notNull())
			.execute();
		await sql`ALTER TABLE books ADD CONSTRAINT books_id_kinetic_pk PRIMARY KEY ("id")`.execute(
			context.kysely,
		);

		const expected = [
			{
				down: [
					[
						"await db.schema",
						'alterTable("books")',
						'addPrimaryKeyConstraint("books_id_kinetic_pk", ["id"])',
						"execute();",
					],
				],
				priority: 1004,
				tableName: "books",
				type: "dropPrimaryKey",
				up: [[]],
			},
			{
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'addPrimaryKeyConstraint("users_id_kinetic_pk", ["id"])',
						"execute();",
					],
				],
				priority: 1004,
				tableName: "users",
				type: "dropPrimaryKey",
				up: [[]],
			},
			{
				down: [
					[
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
				priority: 1006,
				tableName: "books",
				type: "dropTable",
				up: [["await db.schema", 'dropTable("books")', "execute();"]],
			},
			{
				down: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						"execute();",
					],
				],
				priority: 1006,
				tableName: "users",
				type: "dropTable",
				up: [["await db.schema", 'dropTable("users")', "execute();"]],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("drop table with unique constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_id_kinetic_key", ["id"], (uc) =>
				uc.nullsNotDistinct(),
			)
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("fullName", "varchar")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addUniqueConstraint("users_id_fullName_kinetic_key", ["id", "fullName"])
			.execute();

		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				unique: [unique(["id"]).nullsNotDistinct()],
			},
		});

		const database = pgDatabase({
			tables: {
				books,
			},
		});

		const expected = [
			{
				priority: 1003,
				tableName: "users",
				type: "dropConstraint",
				up: [[]],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'addUniqueConstraint("users_fullName_id_kinetic_key", ["fullName", "id"])',
						"execute();",
					],
				],
			},
			{
				priority: 1006,
				tableName: "users",
				type: "dropTable",
				up: [["await db.schema", 'dropTable("users")', "execute();"]],
				down: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("fullName", "varchar")',
						'addColumn("id", "serial", (col) => col.notNull())',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("drop table with foreign keys", async (context) => {
		const database = pgDatabase({
			tables: {
				organizations: table({
					columns: {},
				}),
			},
		});
		await context.kysely.schema.createTable("organizations").execute();

		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "bigserial", (col) => col.notNull())
			.execute();
		await sql`ALTER TABLE books ADD CONSTRAINT books_id_kinetic_pk PRIMARY KEY ("id")`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial", (col) => col.notNull())
			.execute();
		await sql`ALTER TABLE users ADD CONSTRAINT users_id_books_id_kinetic_fk FOREIGN KEY ("id") REFERENCES books ("id") ON DELETE SET NULL ON UPDATE SET NULL`.execute(
			context.kysely,
		);

		const expected = [
			{
				priority: 1003,
				tableName: "users",
				type: "dropConstraint",
				up: [[]],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'addForeignKeyConstraint("users_id_books_id_kinetic_fk", ["id"], "books", ["id"])',
						'onDelete("set null")',
						'onUpdate("set null")',
						"execute();",
					],
				],
			},
			{
				priority: 1004,
				tableName: "books",
				type: "dropPrimaryKey",
				up: [[]],
				down: [
					[
						"await db.schema",
						'alterTable("books")',
						'addPrimaryKeyConstraint("books_id_kinetic_pk", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 1006,
				tableName: "users",
				type: "dropTable",
				up: [["await db.schema", 'dropTable("users")', "execute();"]],
				down: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						"execute();",
					],
				],
			},
			{
				priority: 1006,
				tableName: "books",
				type: "dropTable",
				up: [["await db.schema", 'dropTable("books")', "execute();"]],
				down: [
					[
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("drop table with check constraints", async (context) => {
		const database = pgDatabase({
			tables: {
				organizations: table({
					columns: {},
				}),
			},
		});
		await context.kysely.schema.createTable("organizations").execute();

		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer", (col) => col.notNull())
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("971041d9_kinetic_chk", sql`"id" > 50`)
			.execute();

		await sql`COMMENT ON CONSTRAINT "971041d9_kinetic_chk" ON "books" IS \'971041d9_kinetic_chk\'`.execute(
			context.kysely,
		);

		const expected = [
			{
				priority: 1003,
				tableName: "books",
				type: "dropConstraint",
				down: [
					[
						'await sql`ALTER TABLE "books" ADD CONSTRAINT "971041d9_kinetic_chk" CHECK ((id > 50))`.execute(db);',
					],
					[
						'await sql`COMMENT ON CONSTRAINT "971041d9_kinetic_chk" ON "books" IS \'971041d9_kinetic_chk\'`.execute(db);',
					],
				],
				up: [[]],
			},
			{
				priority: 1006,
				tableName: "books",
				type: "dropTable",
				up: [["await db.schema", 'dropTable("books")', "execute();"]],
				down: [
					[
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "integer", (col) => col.notNull())',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("drop table with indexes", async (context) => {
		const database = pgDatabase({
			tables: {
				organizations: table({
					columns: {},
				}),
			},
		});
		await context.kysely.schema.createTable("organizations").execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.execute();
		await sql`create index "users_name_kntc_idx" on "users" ("name");COMMENT ON INDEX users_name_kntc_idx IS \'f873e4a8464da05b0b0978fff8711714af80a8c32d067955877ae60792414d45\'`.execute(
			context.kysely,
		);
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "text")
			.execute();
		await sql`create unique index "books_id_kntc_idx" on "books" ("id");COMMENT ON INDEX books_id_kntc_idx IS \'2200982847e769a05e0298bc04c04ac1e2c56bdc770b421d2a71f1d89250ecee\'`.execute(
			context.kysely,
		);

		const expected = [
			{
				priority: 1002,
				tableName: "books",
				type: "dropIndex",
				up: [[]],
				down: [
					[
						"await sql`CREATE UNIQUE INDEX books_id_kntc_idx ON public.books USING btree (id);COMMENT ON INDEX \"books_id_kntc_idx\" IS '2200982847e769a05e0298bc04c04ac1e2c56bdc770b421d2a71f1d89250ecee'`.execute(db);",
					],
				],
			},
			{
				priority: 1002,
				tableName: "users",
				type: "dropIndex",
				up: [[]],
				down: [
					[
						"await sql`CREATE INDEX users_name_kntc_idx ON public.users USING btree (name);COMMENT ON INDEX \"users_name_kntc_idx\" IS 'f873e4a8464da05b0b0978fff8711714af80a8c32d067955877ae60792414d45'`.execute(db);",
					],
				],
			},
			{
				priority: 1006,
				tableName: "books",
				type: "dropTable",
				up: [["await db.schema", 'dropTable("books")', "execute();"]],
				down: [
					[
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "text")',
						"execute();",
					],
				],
			},
			{
				priority: 1006,
				tableName: "users",
				type: "dropTable",
				up: [["await db.schema", 'dropTable("users")', "execute();"]],
				down: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("name", "text")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("drop table with enums", async (context) => {
		const database = pgDatabase({});

		await context.kysely.schema
			.createType("role")
			.asEnum(["admin", "user"])
			.execute();
		await sql`COMMENT ON TYPE "role" IS 'kinetic'`.execute(context.kysely);

		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("role", sql`role`)
			.execute();

		const expected = [
			{
				priority: 1006,
				tableName: "users",
				type: "dropTable",
				up: [["await db.schema", 'dropTable("users")', "execute();"]],
				down: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("name", "text")',
						'addColumn("role", sql`role`)',
						"execute();",
					],
				],
			},
			{
				priority: 3011,
				tableName: "none",
				type: "dropEnum",
				up: [["await db.schema", 'dropType("role")', "execute();"]],
				down: [
					[
						"await db.schema",
						'createType("role")',
						'asEnum(["admin", "user"])',
						"execute();await sql`COMMENT ON TYPE \"role\" IS 'kinetic'`.execute(db)",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("drop table with triggers", async (context) => {
		await context.kysely.schema
			.createTable("teams")
			.addColumn("name", "text")
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("createdAt", "timestamp", (col) => col.defaultTo(sql`now()`))
			.addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))
			.execute();

		await sql`COMMENT ON COLUMN "users"."updatedAt" IS 'ae72411e1dc17562b8fb4a6b3c7d1624992dcd4b3fc77ed828606c24a286cf4c'`.execute(
			context.kysely,
		);

		await sql`COMMENT ON COLUMN "users"."createdAt" IS 'ae72411e1dc17562b8fb4a6b3c7d1624992dcd4b3fc77ed828606c24a286cf4c'`.execute(
			context.kysely,
		);

		await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(
			context.kysely,
		);

		await sql`CREATE OR REPLACE TRIGGER foo_before_update_trg
							BEFORE UPDATE ON users
							FOR EACH ROW
							EXECUTE FUNCTION moddatetime(updatedAt);
							COMMENT ON TRIGGER foo_before_update_trg ON users IS 'c2304485eb6b41782bcb408b5118bc67aca3fae9eb9210ad78ce93ddbf438f67';`.execute(
			context.kysely,
		);

		const database = pgDatabase({
			extensions: [extension("moddatetime")],
			tables: {
				teams: table({
					columns: {
						name: text(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 1001,
				tableName: "users",
				type: "dropTrigger",
				up: [[]],
				down: [
					[
						"await sql`CREATE OR REPLACE TRIGGER foo_before_update_trg BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedat');COMMENT ON TRIGGER foo_before_update_trg ON users IS 'c2304485eb6b41782bcb408b5118bc67aca3fae9eb9210ad78ce93ddbf438f67';`.execute(db);",
					],
				],
			},
			{
				priority: 1006,
				tableName: "users",
				type: "dropTable",
				up: [["await db.schema", 'dropTable("users")', "execute();"]],
				down: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("createdAt", "timestamp", (col) => col.defaultTo(sql`now()`))',
						'addColumn("id", "integer")',
						'addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))',
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "users"."createdAt" IS \'ae72411e1dc17562b8fb4a6b3c7d1624992dcd4b3fc77ed828606c24a286cf4c\'`.execute(db);',
					],
					[
						'await sql`COMMENT ON COLUMN "users"."updatedAt" IS \'ae72411e1dc17562b8fb4a6b3c7d1624992dcd4b3fc77ed828606c24a286cf4c\'`.execute(db);',
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});
});
