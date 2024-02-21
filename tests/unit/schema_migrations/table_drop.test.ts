import { sql } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { pgTable } from "~/database/schema/pg_table.js";
import { computeChangeset } from "~tests/helpers/compute_changeset.js";
import { setUpContext, teardownContext } from "~tests/helpers/test_context.js";
import { type DbContext } from "~tests/setup.js";

describe("Table drop migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("empty database", async ({ kysely }) => {
		const database = pgDatabase({});
		const cs = await computeChangeset(kysely, database);
		expect(cs).toEqual([]);
	});

	test<DbContext>("drop empty tables", async ({ kysely }) => {
		const database = pgDatabase({
			tables: {
				books: pgTable("books", {
					columns: {},
				}),
			},
		});

		await kysely.schema.createTable("users").execute();
		await kysely.schema.createTable("books").execute();
		await kysely.schema.createTable("organizations").execute();

		const expected = [
			{
				tableName: "users",
				type: "dropTable",
				priority: 1006,
				down: ["await db.schema", 'createTable("users")', "execute();"],
				up: ["await db.schema", 'dropTable("users")', "execute();"],
			},
			{
				tableName: "organizations",
				type: "dropTable",
				priority: 1006,
				down: ["await db.schema", 'createTable("organizations")', "execute();"],
				up: ["await db.schema", 'dropTable("organizations")', "execute();"],
			},
		];
		const cs = await computeChangeset(kysely, database);
		expect(cs).toEqual(expected);
	});

	test<DbContext>("drop table with columns", async ({ kysely }) => {
		const database = pgDatabase({
			tables: {
				organizations: pgTable("organizations", {
					columns: {},
				}),
			},
		});
		await kysely.schema.createTable("organizations").execute();

		await kysely.schema
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
			.addColumn("int2", "int2")
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

		await kysely.schema
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
			.addColumn("timeTz4", "timetz(4)")
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
		const expected = [
			{
				tableName: "books",
				type: "dropTable",
				priority: 1006,
				up: ["await db.schema", 'dropTable("books")', "execute();"],
				down: [
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
					'addColumn("timeTz4", "timetz(4)")',
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
			},
			{
				tableName: "users",
				type: "dropTable",
				priority: 1006,
				up: ["await db.schema", 'dropTable("users")', "execute();"],
				down: [
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
					'addColumn("int2", sql`smallint`)',
					'addColumn("int4", "integer")',
					'addColumn("int8", "bigint")',
					'addColumn("integer", "integer")',
					'addColumn("integerAlwaysAsIdentity", "integer", (col) => col.notNull().generatedAlwaysAsIdentity())',
					'addColumn("integerDefaultAsIdentity", "integer", (col) => col.notNull().generatedByDefaultAsIdentity())',
					"execute();",
				],
			},
		];
		const cs = await computeChangeset(kysely, database);
		expect(cs).toEqual(expected);
	});

	test<DbContext>("drop table with primary key", async ({ kysely }) => {
		const database = pgDatabase({
			tables: {
				organizations: pgTable("organizations", {
					columns: {},
				}),
			},
		});
		await kysely.schema.createTable("organizations").execute();

		await kysely.schema
			.createTable("users")
			.addColumn("id", "serial", (col) => col.notNull())
			.execute();
		await sql`ALTER TABLE users ADD CONSTRAINT users_id_kinetic_pk PRIMARY KEY ("id")`.execute(
			kysely,
		);

		await kysely.schema
			.createTable("books")
			.addColumn("id", "bigserial", (col) => col.notNull())
			.execute();
		await sql`ALTER TABLE books ADD CONSTRAINT books_id_kinetic_pk PRIMARY KEY ("id")`.execute(
			kysely,
		);

		const expected = [
			{
				down: [
					'await sql`ALTER TABLE books ADD CONSTRAINT books_id_kinetic_pk PRIMARY KEY ("id")`.execute(db);',
				],
				priority: 1004,
				tableName: "books",
				type: "dropPrimaryKey",
				up: [],
			},
			{
				down: [
					'await sql`ALTER TABLE users ADD CONSTRAINT users_id_kinetic_pk PRIMARY KEY ("id")`.execute(db);',
				],
				priority: 1004,
				tableName: "users",
				type: "dropPrimaryKey",
				up: [],
			},
			{
				down: [
					"await db.schema",
					'createTable("books")',
					'addColumn("id", "bigserial", (col) => col.notNull())',
					"execute();",
				],
				priority: 1006,
				tableName: "books",
				type: "dropTable",
				up: ["await db.schema", 'dropTable("books")', "execute();"],
			},
			{
				down: [
					"await db.schema",
					'createTable("users")',
					'addColumn("id", "serial", (col) => col.notNull())',
					"execute();",
				],
				priority: 1006,
				tableName: "users",
				type: "dropTable",
				up: ["await db.schema", 'dropTable("users")', "execute();"],
			},
		];
		const cs = await computeChangeset(kysely, database);
		expect(cs).toEqual(expected);
	});

	test.todo<DbContext>("drop table with unique constraints");

	test<DbContext>("drop table with foreign keys", async ({ kysely }) => {
		const database = pgDatabase({
			tables: {
				organizations: pgTable("organizations", {
					columns: {},
				}),
			},
		});
		await kysely.schema.createTable("organizations").execute();

		await kysely.schema
			.createTable("books")
			.addColumn("id", "bigserial", (col) => col.notNull())
			.execute();
		await sql`ALTER TABLE books ADD CONSTRAINT books_id_kinetic_pk PRIMARY KEY ("id")`.execute(
			kysely,
		);

		await kysely.schema
			.createTable("users")
			.addColumn("id", "serial", (col) => col.notNull())
			.execute();
		await sql`ALTER TABLE users ADD CONSTRAINT users_id_books_id_kinetic_fk FOREIGN KEY ("id") REFERENCES books ("id") ON DELETE SET NULL ON UPDATE SET NULL`.execute(
			kysely,
		);

		const expected = [
			{
				priority: 1003,
				tableName: "users",
				type: "dropConstraint",
				up: [],
				down: [
					'await sql`ALTER TABLE users ADD CONSTRAINT users_id_books_id_kinetic_fk FOREIGN KEY ("id") REFERENCES books ("id") ON DELETE SET NULL ON UPDATE SET NULL`.execute(db);',
				],
			},
			{
				priority: 1004,
				tableName: "books",
				type: "dropPrimaryKey",
				up: [],
				down: [
					'await sql`ALTER TABLE books ADD CONSTRAINT books_id_kinetic_pk PRIMARY KEY ("id")`.execute(db);',
				],
			},
			{
				priority: 1006,
				tableName: "users",
				type: "dropTable",
				up: ["await db.schema", 'dropTable("users")', "execute();"],
				down: [
					"await db.schema",
					'createTable("users")',
					'addColumn("id", "serial", (col) => col.notNull())',
					"execute();",
				],
			},
			{
				priority: 1006,
				tableName: "books",
				type: "dropTable",
				up: ["await db.schema", 'dropTable("books")', "execute();"],
				down: [
					"await db.schema",
					'createTable("books")',
					'addColumn("id", "bigserial", (col) => col.notNull())',
					"execute();",
				],
			},
		];
		const cs = await computeChangeset(kysely, database);
		expect(cs).toEqual(expected);
	});

	test<DbContext>("drop table with indexes", async ({ kysely }) => {
		const database = pgDatabase({
			tables: {
				organizations: pgTable("organizations", {
					columns: {},
				}),
			},
		});
		await kysely.schema.createTable("organizations").execute();

		await kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.execute();
		await sql`create index "users_name_kntc_idx" on "users" ("name");COMMENT ON INDEX users_name_kntc_idx IS \'f873e4a8464da05b0b0978fff8711714af80a8c32d067955877ae60792414d45\'`.execute(
			kysely,
		);
		await kysely.schema.createTable("books").addColumn("id", "text").execute();
		await sql`create unique index "books_id_kntc_idx" on "books" ("id");COMMENT ON INDEX books_id_kntc_idx IS \'2200982847e769a05e0298bc04c04ac1e2c56bdc770b421d2a71f1d89250ecee\'`.execute(
			kysely,
		);

		const cs = await computeChangeset(kysely, database);

		const expected = [
			{
				priority: 1002,
				tableName: "books",
				type: "dropIndex",
				up: [],
				down: [
					"await sql`CREATE UNIQUE INDEX books_id_kntc_idx ON public.books USING btree (id);COMMENT ON INDEX books_id_kntc_idx IS '2200982847e769a05e0298bc04c04ac1e2c56bdc770b421d2a71f1d89250ecee'`.execute(db);",
				],
			},
			{
				priority: 1002,
				tableName: "users",
				type: "dropIndex",
				up: [],
				down: [
					"await sql`CREATE INDEX users_name_kntc_idx ON public.users USING btree (name);COMMENT ON INDEX users_name_kntc_idx IS 'f873e4a8464da05b0b0978fff8711714af80a8c32d067955877ae60792414d45'`.execute(db);",
				],
			},
			{
				priority: 1006,
				tableName: "books",
				type: "dropTable",
				up: ["await db.schema", 'dropTable("books")', "execute();"],
				down: [
					"await db.schema",
					'createTable("books")',
					'addColumn("id", "text")',
					"execute();",
				],
			},
			{
				priority: 1006,
				tableName: "users",
				type: "dropTable",
				up: ["await db.schema", 'dropTable("users")', "execute();"],
				down: [
					"await db.schema",
					'createTable("users")',
					'addColumn("name", "text")',
					"execute();",
				],
			},
		];

		expect(cs).toStrictEqual(expected);
	});

	test.todo<DbContext>("drop table with triggers");
});
