import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	bigint,
	bigserial,
	boolean,
	bytea,
	char,
	date,
	doublePrecision,
	float4,
	float8,
	int2,
	int4,
	int8,
	integer,
	json,
	jsonb,
	numeric,
	real,
	serial,
	text,
	time,
	timestamp,
	timestamptz,
	timetz,
	uuid,
	varchar,
} from "~/database/schema/pg_column.js";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { index } from "~/database/schema/pg_index.js";
import { pgTable } from "~/database/schema/pg_table.js";
import { computeChangeset } from "~tests/helpers/compute_changeset.js";
import { setUpContext, teardownContext } from "~tests/helpers/test_context.js";
import { type DbContext } from "~tests/setup.js";

describe("Table create migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("create empty table", async ({ kysely }) => {
		const database = pgDatabase({
			tables: {
				users: pgTable("users", {
					columns: {},
				}),
				books: pgTable("books", {
					columns: {},
				}),
			},
		});

		const expected = [
			{
				tableName: "users",
				type: "createTable",
				priority: 2001,
				up: ["await db.schema", 'createTable("users")', "execute();"],
				down: ["await db.schema", 'dropTable("users")', "execute();"],
			},
			{
				tableName: "books",
				type: "createTable",
				priority: 2001,
				up: ["await db.schema", 'createTable("books")', "execute();"],
				down: ["await db.schema", 'dropTable("books")', "execute();"],
			},
		];
		const cs = await computeChangeset(kysely, database);
		expect(cs).toEqual(expected);
	});

	test<DbContext>("create table with columns", async ({ kysely }) => {
		const database = pgDatabase({
			tables: {
				users: pgTable("users", {
					columns: {
						bigInt: bigint(),
						bigInt2: bigint().notNull(),
						bigSerial: bigserial(),
						boolean: boolean(),
						bytea: bytea(),
						char: char(),
						char_10: char(10),
						date: date(),
						doublePrecision: doublePrecision(),
						float4: float4(),
						float8: float8(),
						int2: int2(),
						int4: int4(),
						int8: int8(),
						integer: integer(),
						integerAlwaysAsIdentity: integer().generatedAlwaysAsIdentity(),
						integerDefaultAsIdentity: integer().generatedByDefaultAsIdentity(),
					},
				}),
				books: pgTable("books", {
					columns: {
						json: json(),
						jsonB: jsonb(),
						numeric: numeric(),
						numeric_5: numeric(5),
						numeric_5_2: numeric(5, 2),
						real: real(),
						serial: serial(),
						text: text(),
						time: time(),
						time_4: time(4),
						timeTz: timetz(),
						timeTz_4: timetz(4),
						timestamp: timestamp(),
						timestamp_3: timestamp(3),
						timestampTz: timestamptz(),
						timestampTz_3: timestamptz(3),
						uuid: uuid(),
						varChar: varchar(),
						varCharWithDefault: varchar().defaultTo("foo"),
						varChar_255: varchar(255),
					},
				}),
			},
		});

		const expected = [
			{
				tableName: "users",
				type: "createTable",
				priority: 2001,
				up: [
					"await db.schema",
					'createTable("users")',
					'addColumn("bigInt", "bigint")',
					'addColumn("bigInt2", "bigint", (col) => col.notNull())',
					'addColumn("bigSerial", "bigserial", (col) => col.notNull())',
					'addColumn("boolean", "boolean")',
					'addColumn("bytea", "bytea")',
					'addColumn("char", "char(1)")',
					'addColumn("char_10", "char(10)")',
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
				down: ["await db.schema", 'dropTable("users")', "execute();"],
			},
			{
				tableName: "books",
				type: "createTable",
				priority: 2001,
				up: [
					"await db.schema",
					'createTable("books")',
					'addColumn("json", "json")',
					'addColumn("jsonB", "jsonb")',
					'addColumn("numeric", "numeric")',
					'addColumn("numeric_5", "numeric(5, 0)")',
					'addColumn("numeric_5_2", "numeric(5, 2)")',
					'addColumn("real", "real")',
					'addColumn("serial", "serial", (col) => col.notNull())',
					'addColumn("text", "text")',
					'addColumn("time", "time")',
					'addColumn("time_4", "time(4)")',
					'addColumn("timeTz", "timetz")',
					'addColumn("timeTz_4", "timetz(4)")',
					'addColumn("timestamp", "timestamp")',
					'addColumn("timestamp_3", "timestamp(3)")',
					'addColumn("timestampTz", "timestamptz")',
					'addColumn("timestampTz_3", "timestamptz(3)")',
					'addColumn("uuid", "uuid")',
					'addColumn("varChar", "varchar")',
					'addColumn("varCharWithDefault", "varchar", (col) => col.defaultTo(sql`\'foo\'::character varying`))',
					'addColumn("varChar_255", "varchar(255)")',
					"execute();",
				],
				down: ["await db.schema", 'dropTable("books")', "execute();"],
			},
		];
		const cs = await computeChangeset(kysely, database);
		expect(cs).toEqual(expected);
	});

	test<DbContext>("create table with primary key", async ({ kysely }) => {
		const database = pgDatabase({
			tables: {
				users: pgTable("users", {
					columns: {
						id: serial(),
					},
					primaryKey: ["id"],
				}),
				books: pgTable("books", {
					columns: {
						id: bigserial(),
					},
					primaryKey: ["id"],
				}),
			},
		});

		const expected = [
			{
				tableName: "users",
				type: "createTable",
				priority: 2001,
				up: [
					"await db.schema",
					'createTable("users")',
					'addColumn("id", "serial", (col) => col.notNull())',
					"execute();",
				],
				down: ["await db.schema", 'dropTable("users")', "execute();"],
			},
			{
				tableName: "books",
				type: "createTable",
				priority: 2001,
				up: [
					"await db.schema",
					'createTable("books")',
					'addColumn("id", "bigserial", (col) => col.notNull())',
					"execute();",
				],
				down: ["await db.schema", 'dropTable("books")', "execute();"],
			},
			{
				down: [],
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE users ADD CONSTRAINT users_id_kinetic_pk PRIMARY KEY ("id")`.execute(db);',
				],
			},
			{
				down: [],
				priority: 4001,
				tableName: "books",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE books ADD CONSTRAINT books_id_kinetic_pk PRIMARY KEY ("id")`.execute(db);',
				],
			},
		];
		const cs = await computeChangeset(kysely, database);
		expect(cs).toEqual(expected);
	});

	test<DbContext>("create table with composite primary key", async ({
		kysely,
	}) => {
		const database = pgDatabase({
			tables: {
				users: pgTable("users", {
					columns: {
						id: serial(),
						name: varchar(),
					},
					primaryKey: ["id", "name"],
				}),
				books: pgTable("books", {
					columns: {
						id: bigserial(),
					},
					primaryKey: ["id"],
				}),
			},
		});

		const expected = [
			{
				tableName: "users",
				type: "createTable",
				priority: 2001,
				up: [
					"await db.schema",
					'createTable("users")',
					'addColumn("id", "serial", (col) => col.notNull())',
					'addColumn("name", "varchar")',
					"execute();",
				],
				down: ["await db.schema", 'dropTable("users")', "execute();"],
			},
			{
				tableName: "books",
				type: "createTable",
				priority: 2001,
				up: [
					"await db.schema",
					'createTable("books")',
					'addColumn("id", "bigserial", (col) => col.notNull())',
					"execute();",
				],
				down: ["await db.schema", 'dropTable("books")', "execute();"],
			},
			{
				down: [],
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE users ADD CONSTRAINT users_id_name_kinetic_pk PRIMARY KEY ("id", "name")`.execute(db);',
				],
			},
			{
				down: [],
				priority: 4001,
				tableName: "books",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE books ADD CONSTRAINT books_id_kinetic_pk PRIMARY KEY ("id")`.execute(db);',
				],
			},
		];
		const cs = await computeChangeset(kysely, database);
		expect(cs).toEqual(expected);
	});

	test.todo<DbContext>("create table with unique constraints");
	test.todo<DbContext>("create table with foreign keys");

	test<DbContext>("create table with indexes", async ({ kysely }) => {
		const users = pgTable("users", {
			columns: {
				name: text(),
			},
			indexes: [index(["name"])],
		});

		const books = pgTable("books", {
			columns: {
				id: text(),
			},
			indexes: [index(["id"], (idx) => idx.unique())],
		});

		const database = pgDatabase({
			tables: {
				users,
				books,
			},
		});
		const cs = await computeChangeset(kysely, database);

		const expected = [
			{
				down: ["await db.schema", 'dropTable("users")', "execute();"],
				priority: 2001,
				tableName: "users",
				type: "createTable",
				up: [
					"await db.schema",
					'createTable("users")',
					'addColumn("name", "text")',
					"execute();",
				],
			},
			{
				down: ["await db.schema", 'dropTable("books")', "execute();"],
				priority: 2001,
				tableName: "books",
				type: "createTable",
				up: [
					"await db.schema",
					'createTable("books")',
					'addColumn("id", "text")',
					"execute();",
				],
			},
			{
				down: [],
				priority: 4003,
				tableName: "users",
				type: "createIndex",
				up: [
					'await sql`create index "users_name_kntc_idx" on "users" ("name");COMMENT ON INDEX users_name_kntc_idx IS \'f873e4a8464da05b0b0978fff8711714af80a8c32d067955877ae60792414d45\'`.execute(db);',
				],
			},
			{
				down: [],
				priority: 4003,
				tableName: "books",
				type: "createIndex",
				up: [
					'await sql`create unique index "books_id_kntc_idx" on "books" ("id");COMMENT ON INDEX books_id_kntc_idx IS \'2200982847e769a05e0298bc04c04ac1e2c56bdc770b421d2a71f1d89250ecee\'`.execute(db);',
				],
			},
		];

		expect(cs).toStrictEqual(expected);
	});
	test.todo<DbContext>("create table with triggers");
});
