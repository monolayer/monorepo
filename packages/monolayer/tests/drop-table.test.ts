/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { extension } from "~/database/extension/extension.js";
import { schema } from "~/database/schema/schema.js";
import { integer } from "~/database/schema/table/column/data-types/integer.js";
import { text } from "~/database/schema/table/column/data-types/text.js";
import { unique } from "~/database/schema/table/constraints/unique/unique.js";
import { table } from "~/database/schema/table/table.js";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("Table drop migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("drop empty tables", async (context) => {
		const dbSchema = schema({
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
				currentTableName: "users",
				schemaName: "public",
				type: "dropTable",
				priority: 1006,
				down: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						"execute();",
					],
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
			},
			{
				tableName: "organizations",
				currentTableName: "organizations",
				schemaName: "public",
				type: "dropTable",
				priority: 1006,
				down: [
					[
						'await db.withSchema("public").schema',
						'createTable("organizations")',
						"execute();",
					],
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'dropTable("organizations")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("drop table with columns", async (context) => {
		const dbSchema = schema({
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
			.addColumn("varChar255", sql`character varying(255)`)
			.execute();

		await sql`COMMENT ON COLUMN "books"."varCharWithDefault" IS 'ae72411e'`.execute(
			context.kysely,
		);

		const expected = [
			{
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropTable",
				priority: 1006,
				up: [
					[
						'await db.withSchema("public").schema',
						'dropTable("books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
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
						'addColumn("timeTz", sql`time with time zone`)',
						'addColumn("timeTz4", sql`time(4) with time zone`)',
						'addColumn("timestamp", "timestamp")',
						'addColumn("timestamp3", "timestamp(3)")',
						'addColumn("timestampTz", sql`timestamp with time zone`)',
						'addColumn("timestampTz3", sql`timestamp(3) with time zone`)',
						'addColumn("uuid", "uuid")',
						'addColumn("varChar", sql`character varying`)',
						'addColumn("varChar255", sql`character varying(255)`)',
						"addColumn(\"varCharWithDefault\", sql`character varying`, (col) => col.defaultTo(sql`'foo'::character varying`))",
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."books"."varCharWithDefault" IS \'ae72411e\'`',
						"execute(db);",
					],
				],
			},
			{
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "dropTable",
				priority: 1006,
				up: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("bigInt", "bigint")',
						'addColumn("bigInt2", "bigint", (col) => col.notNull())',
						'addColumn("bigSerial", "bigserial", (col) => col.notNull())',
						'addColumn("boolean", "boolean")',
						'addColumn("bytea", "bytea")',
						'addColumn("char", sql`character(1)`)',
						'addColumn("char10", sql`character(10)`)',
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
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("drop table with primary key", async (context) => {
		const dbSchema = schema({
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
		await sql`ALTER TABLE users ADD CONSTRAINT users_monolayer_pk PRIMARY KEY ("id")`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "bigserial", (col) => col.notNull())
			.execute();
		await sql`ALTER TABLE books ADD CONSTRAINT books_monolayer_pk PRIMARY KEY ("id")`.execute(
			context.kysely,
		);

		const expected = [
			{
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addPrimaryKeyConstraint("books_monolayer_pk", ["id"])',
						"execute();",
					],
				],
				priority: 1004,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropPrimaryKey",
				up: [[]],
			},
			{
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addPrimaryKeyConstraint("users_monolayer_pk", ["id"])',
						"execute();",
					],
				],
				priority: 1004,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "dropPrimaryKey",
				up: [[]],
			},
			{
				down: [
					[
						'await db.withSchema("public").schema',
						'createTable("books")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
				priority: 1006,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropTable("books")',
						"execute();",
					],
				],
			},
			{
				down: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						"execute();",
					],
				],
				priority: 1006,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "dropTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("drop table with unique constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_a91945e0_monolayer_key", ["id"], (uc) =>
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
			.addUniqueConstraint("users_plwe342w_monolayer_key", ["id", "fullName"])
			.execute();

		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				unique: [unique(["id"]).nullsNotDistinct()],
			},
		});

		const dbSchema = schema({
			tables: {
				books,
			},
		});

		const expected = [
			{
				priority: 811,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "dropUniqueConstraint",
				up: [[]],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addUniqueConstraint("users_plwe342w_monolayer_key", ["fullName", "id"])',
						"execute();",
					],
				],
			},
			{
				priority: 1006,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "dropTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("fullName", sql`character varying`)',
						'addColumn("id", "serial", (col) => col.notNull())',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("drop table with foreign keys", async (context) => {
		const dbSchema = schema({
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
		await sql`ALTER TABLE books ADD CONSTRAINT books_monolayer_pk PRIMARY KEY ("id")`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial", (col) => col.notNull())
			.execute();
		await sql`ALTER TABLE users ADD CONSTRAINT "users_61a55869_monolayer_fk" FOREIGN KEY ("id") REFERENCES books ("id") ON DELETE SET NULL ON UPDATE SET NULL`.execute(
			context.kysely,
		);

		const expected = [
			{
				priority: 810,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "dropForeignKey",
				up: [[]],
				down: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_61a55869_monolayer_fk", ["id"], "books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_61a55869_monolayer_fk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 1006,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "dropTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						"execute();",
					],
				],
			},
			{
				priority: 1004,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropPrimaryKey",
				up: [[]],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addPrimaryKeyConstraint("books_monolayer_pk", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 1006,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropTable("books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'createTable("books")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("drop table with check constraints", async (context) => {
		const dbSchema = schema({
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
			.addCheckConstraint("books_971041d9_monolayer_chk", sql`"id" > 50`)
			.execute();

		await sql`COMMENT ON CONSTRAINT "books_971041d9_monolayer_chk" ON "books" IS \'971041d9_monolayer_chk\'`.execute(
			context.kysely,
		);

		const expected = [
			{
				priority: 812,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropCheckConstraint",
				down: [
					[
						'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_971041d9_monolayer_chk" CHECK ((id > 50)) NOT VALID`',
						"execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_971041d9_monolayer_chk"`',
						"execute(db);",
					],
				],
				up: [[]],
			},
			{
				priority: 1006,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropTable("books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'createTable("books")',
						'addColumn("id", "integer", (col) => col.notNull())',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("drop table with indexes", async (context) => {
		const dbSchema = schema({
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
		await sql`create index "users_qa1qaw23_monolayer_idx" on "users" ("name");`.execute(
			context.kysely,
		);
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "text")
			.execute();
		await sql`create unique index "books_mk3e4r3e_monolayer_idx" on "books" ("id");`.execute(
			context.kysely,
		);

		const expected = [
			{
				priority: 800,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropIndex",
				up: [[]],
				down: [
					[
						"await sql`CREATE UNIQUE INDEX books_mk3e4r3e_monolayer_idx ON public.books USING btree (id)`",
						"execute(db);",
					],
				],
			},
			{
				priority: 800,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "dropIndex",
				up: [[]],
				down: [
					[
						"await sql`CREATE INDEX users_qa1qaw23_monolayer_idx ON public.users USING btree (name)`",
						"execute(db);",
					],
				],
			},
			{
				priority: 1006,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropTable("books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'createTable("books")',
						'addColumn("id", "text")',
						"execute();",
					],
				],
			},
			{
				priority: 1006,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "dropTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("name", "text")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("drop table with enums", async (context) => {
		const dbSchema = schema({});

		await context.kysely.schema
			.createType("role")
			.asEnum(["admin", "user"])
			.execute();
		await sql`COMMENT ON TYPE "role" IS 'monolayer'`.execute(context.kysely);

		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("role", sql`role`)
			.execute();

		const expected = [
			{
				priority: 1006,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "dropTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("name", "text")',
						'addColumn("role", sql`role`)',
						"execute();",
					],
				],
			},
			{
				priority: 6003,
				tableName: "none",
				currentTableName: "none",
				schemaName: "public",
				type: "dropEnum",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropType("role")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'createType("role")',
						'asEnum(["admin", "user"])',
						"execute();",
					],
					[
						'await sql`COMMENT ON TYPE "public"."role" IS \'monolayer\'`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
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

		await sql`COMMENT ON COLUMN "users"."updatedAt" IS 'ae72411e'`.execute(
			context.kysely,
		);

		await sql`COMMENT ON COLUMN "users"."createdAt" IS 'ae72411e'`.execute(
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

		const dbSchema = schema({
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
				currentTableName: "users",
				schemaName: "public",
				type: "dropTrigger",
				up: [[]],
				down: [
					[
						"await sql`CREATE OR REPLACE TRIGGER foo_before_update_trg BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedat')`",
						"execute(db);",
					],
				],
			},
			{
				priority: 1006,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "dropTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("createdAt", "timestamp", (col) => col.defaultTo(sql`now()`))',
						'addColumn("id", "integer")',
						'addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))',
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."createdAt" IS \'ae72411e\'`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."updatedAt" IS \'ae72411e\'`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: {
				schemas: [dbSchema],
				extensions: [extension("moddatetime")],
			},
			expected,
			down: "same",
		});
	});

	test<DbContext>("drop table with in demo schema", async (context) => {
		const dbSchema = schema({
			name: "demo",
			tables: {
				organizations: table({
					columns: {},
				}),
			},
		});

		await sql`CREATE SCHEMA IF NOT EXISTS "demo"`.execute(context.kysely);
		await sql`COMMENT ON SCHEMA "demo" is 'monolayer'`.execute(context.kysely);

		await context.kysely
			.withSchema("demo")
			.schema.createTable("organizations")
			.execute();

		await context.kysely
			.withSchema("demo")
			.schema.createTable("users")
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

		await context.kysely
			.withSchema("demo")
			.schema.createTable("books")
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
			.addColumn("varChar255", sql`character varying(255)`)
			.execute();

		await sql`COMMENT ON COLUMN "demo"."books"."varCharWithDefault" IS 'ae72411e'`.execute(
			context.kysely,
		);

		const expected = [
			{
				tableName: "books",
				currentTableName: "books",
				schemaName: "demo",
				type: "dropTable",
				priority: 1006,
				up: [
					[
						'await db.withSchema("demo").schema',
						'dropTable("books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("demo").schema',
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
						'addColumn("timeTz", sql`time with time zone`)',
						'addColumn("timeTz4", sql`time(4) with time zone`)',
						'addColumn("timestamp", "timestamp")',
						'addColumn("timestamp3", "timestamp(3)")',
						'addColumn("timestampTz", sql`timestamp with time zone`)',
						'addColumn("timestampTz3", sql`timestamp(3) with time zone`)',
						'addColumn("uuid", "uuid")',
						'addColumn("varChar", sql`character varying`)',
						'addColumn("varChar255", sql`character varying(255)`)',
						"addColumn(\"varCharWithDefault\", sql`character varying`, (col) => col.defaultTo(sql`'foo'::character varying`))",
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "demo"."books"."varCharWithDefault" IS \'ae72411e\'`',
						"execute(db);",
					],
				],
			},
			{
				tableName: "users",
				currentTableName: "users",
				schemaName: "demo",
				type: "dropTable",
				priority: 1006,
				up: [
					[
						'await db.withSchema("demo").schema',
						'dropTable("users")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("demo").schema',
						'createTable("users")',
						'addColumn("bigInt", "bigint")',
						'addColumn("bigInt2", "bigint", (col) => col.notNull())',
						'addColumn("bigSerial", "bigserial", (col) => col.notNull())',
						'addColumn("boolean", "boolean")',
						'addColumn("bytea", "bytea")',
						'addColumn("char", sql`character(1)`)',
						'addColumn("char10", sql`character(10)`)',
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
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});
});