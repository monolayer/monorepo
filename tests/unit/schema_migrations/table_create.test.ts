import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
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
	pgEnum,
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
import { foreignKey } from "~/database/schema/pg_foreign_key.js";
import { index } from "~/database/schema/pg_index.js";
import { pgTable } from "~/database/schema/pg_table.js";
import { trigger } from "~/database/schema/pg_trigger.js";
import { unique } from "~/database/schema/pg_unique.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration_success.js";
import { setUpContext, teardownContext } from "~tests/helpers/test_context.js";
import { type DbContext } from "~tests/setup.js";

describe("Table create migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("create empty table", async (context) => {
		const database = pgDatabase({
			tables: {
				users: pgTable({
					columns: {},
				}),
				books: pgTable({
					columns: {},
				}),
			},
		});

		const expected = [
			{
				tableName: "books",
				type: "createTable",
				priority: 2001,
				up: ["await db.schema", 'createTable("books")', "execute();"],
				down: ["await db.schema", 'dropTable("books")', "execute();"],
			},
			{
				tableName: "users",
				type: "createTable",
				priority: 2001,
				up: ["await db.schema", 'createTable("users")', "execute();"],
				down: ["await db.schema", 'dropTable("users")', "execute();"],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("create table with columns", async (context) => {
		const database = pgDatabase({
			tables: {
				users: pgTable({
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
				books: pgTable({
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
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("create table with primary key", async (context) => {
		const database = pgDatabase({
			tables: {
				users: pgTable({
					columns: {
						id: serial(),
					},
					primaryKey: ["id"],
				}),
				books: pgTable({
					columns: {
						id: bigserial(),
					},
					primaryKey: ["id"],
				}),
			},
		});

		const expected = [
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
				down: [],
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_id_kinetic_pk" PRIMARY KEY ("id")`.execute(db);',
				],
			},
			{
				down: [],
				priority: 4001,
				tableName: "books",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE books ADD CONSTRAINT "books_id_kinetic_pk" PRIMARY KEY ("id")`.execute(db);',
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

	test<DbContext>("create table with composite primary key", async (context) => {
		const database = pgDatabase({
			tables: {
				users: pgTable({
					columns: {
						id: serial(),
						name: varchar(),
					},
					primaryKey: ["id", "name"],
				}),
				books: pgTable({
					columns: {
						id: bigserial(),
					},
					primaryKey: ["id"],
				}),
			},
		});

		const expected = [
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
				down: [],
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_id_name_kinetic_pk" PRIMARY KEY ("id", "name")`.execute(db);',
				],
			},
			{
				down: [],
				priority: 4001,
				tableName: "books",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE books ADD CONSTRAINT "books_id_kinetic_pk" PRIMARY KEY ("id")`.execute(db);',
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

	test<DbContext>("create table with unique constraints", async (context) => {
		const books = pgTable({
			columns: {
				id: integer(),
			},
			uniqueConstraints: [unique("id").nullsNotDistinct()],
		});

		const users = pgTable({
			columns: {
				id: serial(),
				fullName: varchar(),
			},
			uniqueConstraints: [unique(["id"])],
		});

		const database = pgDatabase({
			tables: {
				books,
				users,
			},
		});

		const expected = [
			{
				priority: 2001,
				tableName: "users",
				type: "createTable",
				up: [
					"await db.schema",
					'createTable("users")',
					'addColumn("id", "serial", (col) => col.notNull())',
					'addColumn("fullName", "varchar")',
					"execute();",
				],
				down: ["await db.schema", 'dropTable("users")', "execute();"],
			},
			{
				priority: 2001,
				tableName: "books",
				type: "createTable",
				up: [
					"await db.schema",
					'createTable("books")',
					'addColumn("id", "integer")',
					"execute();",
				],
				down: ["await db.schema", 'dropTable("books")', "execute();"],
			},
			{
				priority: 4002,
				tableName: "books",
				type: "createConstraint",
				up: [
					'await sql`ALTER TABLE books ADD CONSTRAINT "books_id_kinetic_key" UNIQUE NULLS NOT DISTINCT ("id")`.execute(db);',
				],
				down: [],
			},
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_id_kinetic_key" UNIQUE NULLS DISTINCT ("id")`.execute(db);',
				],
				down: [],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("create table with foreign keys", async (context) => {
		const books = pgTable({
			columns: {
				id: bigserial(),
			},
			primaryKey: ["id"],
		});

		const users = pgTable({
			columns: {
				id: serial(),
				name: varchar(),
			},
			foreignKeys: [
				foreignKey(["id"], books, ["id"], {
					updateRule: "set null",
					deleteRule: "set null",
				}),
			],
		});

		const database = pgDatabase({
			tables: {
				books,
				users,
			},
		});

		const expected = [
			{
				down: ["await db.schema", 'dropTable("books")', "execute();"],
				priority: 2001,
				tableName: "books",
				type: "createTable",
				up: [
					"await db.schema",
					'createTable("books")',
					'addColumn("id", "bigserial", (col) => col.notNull())',
					"execute();",
				],
			},
			{
				down: ["await db.schema", 'dropTable("users")', "execute();"],
				priority: 2001,
				tableName: "users",
				type: "createTable",
				up: [
					"await db.schema",
					'createTable("users")',
					'addColumn("id", "serial", (col) => col.notNull())',
					'addColumn("name", "varchar")',
					"execute();",
				],
			},
			{
				down: [],
				priority: 4001,
				tableName: "books",
				type: "createPrimaryKey",
				up: [
					'await sql`ALTER TABLE books ADD CONSTRAINT "books_id_kinetic_pk" PRIMARY KEY ("id")`.execute(db);',
				],
			},
			{
				down: [],
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					'await sql`ALTER TABLE users ADD CONSTRAINT "users_id_books_id_kinetic_fk" FOREIGN KEY ("id") REFERENCES books ("id") ON DELETE SET NULL ON UPDATE SET NULL`.execute(db);',
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

	test<DbContext>("create table with indexes", async (context) => {
		const users = pgTable({
			columns: {
				name: text(),
			},
			indexes: [index("name")],
		});

		const books = pgTable({
			columns: {
				id: text(),
			},
			indexes: [index("id").unique()],
		});

		const database = pgDatabase({
			tables: {
				users,
				books,
			},
		});

		const expected = [
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
				down: [],
				priority: 4003,
				tableName: "users",
				type: "createIndex",
				up: [
					'await sql`create index "users_name_kntc_idx" on "users" ("name");COMMENT ON INDEX "users_name_kntc_idx" IS \'f873e4a8464da05b0b0978fff8711714af80a8c32d067955877ae60792414d45\'`.execute(db);',
				],
			},
			{
				down: [],
				priority: 4003,
				tableName: "books",
				type: "createIndex",
				up: [
					'await sql`create unique index "books_id_kntc_idx" on "books" ("id");COMMENT ON INDEX "books_id_kntc_idx" IS \'2200982847e769a05e0298bc04c04ac1e2c56bdc770b421d2a71f1d89250ecee\'`.execute(db);',
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

	test<DbContext>("create table with enums", async (context) => {
		const users = pgTable({
			columns: {
				name: text(),
				role: pgEnum("role", ["admin", "user"]),
			},
		});

		const database = pgDatabase({
			tables: {
				users,
			},
		});
		const expected = [
			{
				priority: 0,
				tableName: "none",
				type: "createEnum",
				up: [
					"await db.schema",
					'createType("role")',
					'asEnum(["admin", "user"])',
					"execute();await sql`COMMENT ON TYPE \"role\" IS 'kinetic'`.execute(db)",
				],
				down: ["await db.schema", 'dropType("role")', "execute();"],
			},
			{
				priority: 2001,
				tableName: "users",
				type: "createTable",
				up: [
					"await db.schema",
					'createTable("users")',
					'addColumn("name", "text")',
					'addColumn("role", sql`role`)',
					"execute();",
				],
				down: ["await db.schema", 'dropTable("users")', "execute();"],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("create table with triggers", async (context) => {
		const users = pgTable({
			columns: {
				id: integer(),
				updatedAt: timestamp().defaultTo(sql`now()`),
			},
			triggers: {
				foo_before_update: trigger()
					.fireWhen("before")
					.events(["update"])
					.forEach("row")
					.function("moddatetime", ["updatedAt"]),
			},
		});

		const database = pgDatabase({
			extensions: ["moddatetime"],
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 0,
				tableName: "none",
				type: "createExtension",
				up: [
					"await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(db);",
				],
				down: ["await sql`DROP EXTENSION IF EXISTS moddatetime;`.execute(db);"],
			},
			{
				priority: 2001,
				tableName: "users",
				type: "createTable",
				up: [
					"await db.schema",
					'createTable("users")',
					'addColumn("id", "integer")',
					'addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))',
					"execute();",
				],
				down: ["await db.schema", 'dropTable("users")', "execute();"],
			},
			{
				priority: 4004,
				tableName: "users",
				type: "createTrigger",
				up: [
					`await sql\`CREATE OR REPLACE TRIGGER foo_before_update_trg
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION moddatetime(updatedAt);COMMENT ON TRIGGER foo_before_update_trg ON users IS 'c2304485eb6b41782bcb408b5118bc67aca3fae9eb9210ad78ce93ddbf438f67';\`.execute(db);`,
				],
				down: [],
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
