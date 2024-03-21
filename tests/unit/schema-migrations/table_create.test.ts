/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { extension } from "~/schema/extension/extension.js";
import { pgDatabase } from "~/schema/pg-database.js";
import { bigint } from "~/schema/table/column/data-types/bigint.js";
import { bigserial } from "~/schema/table/column/data-types/bigserial.js";
import { bitVarying } from "~/schema/table/column/data-types/bit-varying.js";
import { bit } from "~/schema/table/column/data-types/bit.js";
import { boolean } from "~/schema/table/column/data-types/boolean.js";
import { bytea } from "~/schema/table/column/data-types/bytea.js";
import { varchar } from "~/schema/table/column/data-types/character-varying.js";
import { char } from "~/schema/table/column/data-types/character.js";
import { date } from "~/schema/table/column/data-types/date.js";
import { doublePrecision } from "~/schema/table/column/data-types/double-precision.js";
import { enumerated } from "~/schema/table/column/data-types/enumerated.js";
import { inet } from "~/schema/table/column/data-types/inet.js";
import { integer } from "~/schema/table/column/data-types/integer.js";
import { json } from "~/schema/table/column/data-types/json.js";
import { jsonb } from "~/schema/table/column/data-types/jsonb.js";
import { macaddr } from "~/schema/table/column/data-types/macaddr.js";
import { macaddr8 } from "~/schema/table/column/data-types/macaddr8.js";
import { numeric } from "~/schema/table/column/data-types/numeric.js";
import { real } from "~/schema/table/column/data-types/real.js";
import { serial } from "~/schema/table/column/data-types/serial.js";
import { smallint } from "~/schema/table/column/data-types/smallint.js";
import { text } from "~/schema/table/column/data-types/text.js";
import { timetz } from "~/schema/table/column/data-types/time-with-time-zone.js";
import { time } from "~/schema/table/column/data-types/time.js";
import { timestamptz } from "~/schema/table/column/data-types/timestamp-with-time-zone.js";
import { timestamp } from "~/schema/table/column/data-types/timestamp.js";
import { tsquery } from "~/schema/table/column/data-types/tsquery.js";
import { tsvector } from "~/schema/table/column/data-types/tsvector.js";
import { uuid } from "~/schema/table/column/data-types/uuid.js";
import { xml } from "~/schema/table/column/data-types/xml.js";
import { check } from "~/schema/table/constraints/check/check.js";
import { foreignKey } from "~/schema/table/constraints/foreign-key/foreign-key.js";
import { primaryKey } from "~/schema/table/constraints/primary-key/primary-key.js";
import { unique } from "~/schema/table/constraints/unique/unique.js";
import { index } from "~/schema/table/index/index.js";
import { table } from "~/schema/table/table.js";
import { trigger } from "~/schema/table/trigger/trigger.js";
import { enumType } from "~/schema/types/enum/enum.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration-success.js";
import { setUpContext, teardownContext } from "~tests/helpers/test-context.js";
import { type DbContext } from "~tests/setup/kysely.js";

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
				users: table({
					columns: {},
				}),
				books: table({
					columns: {},
				}),
			},
		});

		const expected = [
			{
				tableName: "books",
				type: "createTable",
				priority: 2001,
				up: [["await db.schema", 'createTable("books")', "execute();"]],
				down: [["await db.schema", 'dropTable("books")', "execute();"]],
			},
			{
				tableName: "users",
				type: "createTable",
				priority: 2001,
				up: [["await db.schema", 'createTable("users")', "execute();"]],
				down: [["await db.schema", 'dropTable("users")', "execute();"]],
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
				users: table({
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
						smallint: smallint(),
						integer: integer(),
						integerAlwaysAsIdentity: integer().generatedAlwaysAsIdentity(),
						integerDefaultAsIdentity: integer().generatedByDefaultAsIdentity(),
						bit: bit(),
						secondBit: bit(10),
						bitWithDefault: bit().default("1"),
						varbit: bitVarying(),
						varbitWithLength: bitVarying(10),
						inet: inet(),
						inetWithDefault: inet().default("192.168.0.1"),
						macaddr: macaddr(),
						macaddrWithDefault: macaddr().default("08:00:2b:01:02:03"),
						macaddr8: macaddr8(),
						macaddr8WithDefault: macaddr8().default("08:00:2b:01:02:03:04:05"),
					},
				}),
				books: table({
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
						varCharWithDefault: varchar().default("foo"),
						varChar_255: varchar(255),
						vector: tsvector(),
						vectorWithDefault: tsvector().default(sql`to_tsvector('a b')`),
						tsquery: tsquery(),
						tsqueryWithDefault: tsquery().default(sql`to_tsquery('a b')`),
						xml: xml(),
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
					[
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
						'addColumn("timeTz", sql`time with time zone`)',
						'addColumn("timeTz_4", sql`time(4) with time zone`)',
						'addColumn("timestamp", "timestamp")',
						'addColumn("timestamp_3", "timestamp(3)")',
						'addColumn("timestampTz", sql`timestamp with time zone`)',
						'addColumn("timestampTz_3", sql`timestamp(3) with time zone`)',
						'addColumn("uuid", "uuid")',
						'addColumn("varChar", sql`character varying`)',
						"addColumn(\"varCharWithDefault\", sql`character varying`, (col) => col.defaultTo(sql`'foo'::character varying`))",
						'addColumn("varChar_255", sql`character varying(255)`)',
						'addColumn("vector", sql`tsvector`)',
						"addColumn(\"vectorWithDefault\", sql`tsvector`, (col) => col.defaultTo(sql`to_tsvector('a b')`))",
						'addColumn("tsquery", sql`tsquery`)',
						"addColumn(\"tsqueryWithDefault\", sql`tsquery`, (col) => col.defaultTo(sql`to_tsquery('a b')`))",
						'addColumn("xml", sql`xml`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "books"."varCharWithDefault" IS \'2bc6768278e7f14b6f18480c616c1687a575d330a2e8e471a48bede1a90d5720\'`.execute(db);',
					],
					[
						'await sql`COMMENT ON COLUMN "books"."vectorWithDefault" IS \'1ffcfd22d9ebae1ab0d7742243c8442e46bd7c2f11b83809006cdc01bfe59faa\'`.execute(db);',
					],
					[
						'await sql`COMMENT ON COLUMN "books"."tsqueryWithDefault" IS \'6970b882cfbccfc9111995b7f88d6127ab99d0053645add6a73e38ebdbfc5e74\'`.execute(db);',
					],
				],
				down: [["await db.schema", 'dropTable("books")', "execute();"]],
			},
			{
				tableName: "users",
				type: "createTable",
				priority: 2001,
				up: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("bigInt", "bigint")',
						'addColumn("bigInt2", "bigint", (col) => col.notNull())',
						'addColumn("bigSerial", "bigserial", (col) => col.notNull())',
						'addColumn("boolean", "boolean")',
						'addColumn("bytea", "bytea")',
						'addColumn("char", sql`character(1)`)',
						'addColumn("char_10", sql`character(10)`)',
						'addColumn("date", "date")',
						'addColumn("doublePrecision", "double precision")',
						'addColumn("smallint", sql`smallint`)',
						'addColumn("integer", "integer")',
						'addColumn("integerAlwaysAsIdentity", "integer", (col) => col.notNull().generatedAlwaysAsIdentity())',
						'addColumn("integerDefaultAsIdentity", "integer", (col) => col.notNull().generatedByDefaultAsIdentity())',
						'addColumn("bit", sql`bit(1)`)',
						'addColumn("secondBit", sql`bit(10)`)',
						"addColumn(\"bitWithDefault\", sql`bit(1)`, (col) => col.defaultTo(sql`'1'::bit`))",
						'addColumn("varbit", sql`varbit`)',
						'addColumn("varbitWithLength", sql`varbit(10)`)',
						'addColumn("inet", sql`inet`)',
						"addColumn(\"inetWithDefault\", sql`inet`, (col) => col.defaultTo(sql`'192.168.0.1'::inet`))",
						'addColumn("macaddr", sql`macaddr`)',
						"addColumn(\"macaddrWithDefault\", sql`macaddr`, (col) => col.defaultTo(sql`'08:00:2b:01:02:03'::macaddr`))",
						'addColumn("macaddr8", sql`macaddr8`)',
						"addColumn(\"macaddr8WithDefault\", sql`macaddr8`, (col) => col.defaultTo(sql`'08:00:2b:01:02:03:04:05'::macaddr8`))",
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "users"."bitWithDefault" IS \'e7152e0146f926294bab63df630eed6658c5ce33ef4a38f1e030e0baaf3a3652\'`.execute(db);',
					],
					[
						'await sql`COMMENT ON COLUMN "users"."inetWithDefault" IS \'840df3363333e0d0a993db5bd423bcfc372afcc4d6c94dae75cfb78551c174a1\'`.execute(db);',
					],
					[
						'await sql`COMMENT ON COLUMN "users"."macaddrWithDefault" IS \'c14cc2c97ca666f962466c35fa1710dcd9182023915eda00a85f5c73e0f4a6ef\'`.execute(db);',
					],
					[
						'await sql`COMMENT ON COLUMN "users"."macaddr8WithDefault" IS \'d2247d08ab0a4e3182ee395a96f1bca39f4b3af439c8126df4707d69d68b7eb7\'`.execute(db);',
					],
				],
				down: [["await db.schema", 'dropTable("users")', "execute();"]],
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
				users: table({
					columns: {
						id: serial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				}),
				books: table({
					columns: {
						id: bigserial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
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
					[
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
				down: [["await db.schema", 'dropTable("books")', "execute();"]],
			},
			{
				tableName: "users",
				type: "createTable",
				priority: 2001,
				up: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						"execute();",
					],
				],
				down: [["await db.schema", 'dropTable("users")', "execute();"]],
			},
			{
				down: [[]],
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						'addPrimaryKeyConstraint("users_id_kinetic_pk", ["id"])',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4001,
				tableName: "books",
				type: "createPrimaryKey",
				up: [
					[
						"await db.schema",
						'alterTable("books")',
						'addPrimaryKeyConstraint("books_id_kinetic_pk", ["id"])',
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

	test<DbContext>("create table with composite primary key", async (context) => {
		const database = pgDatabase({
			tables: {
				users: table({
					columns: {
						id: serial(),
						name: varchar(),
					},
					constraints: {
						primaryKey: primaryKey(["id", "name"]),
					},
				}),
				books: table({
					columns: {
						id: bigserial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
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
					[
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
				down: [["await db.schema", 'dropTable("books")', "execute();"]],
			},
			{
				tableName: "users",
				type: "createTable",
				priority: 2001,
				up: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						'addColumn("name", sql`character varying`)',
						"execute();",
					],
				],
				down: [["await db.schema", 'dropTable("users")', "execute();"]],
			},
			{
				down: [[]],
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						'addPrimaryKeyConstraint("users_id_name_kinetic_pk", ["id", "name"])',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4001,
				tableName: "books",
				type: "createPrimaryKey",
				up: [
					[
						"await db.schema",
						'alterTable("books")',
						'addPrimaryKeyConstraint("books_id_kinetic_pk", ["id"])',
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

	test<DbContext>("create table with unique constraints", async (context) => {
		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				unique: [unique(["id"]).nullsNotDistinct()],
			},
		});

		const users = table({
			columns: {
				id: serial(),
				fullName: varchar(),
			},
			constraints: {
				unique: [unique(["id"])],
			},
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
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						'addColumn("fullName", sql`character varying`)',
						"execute();",
					],
				],
				down: [["await db.schema", 'dropTable("users")', "execute();"]],
			},
			{
				priority: 2001,
				tableName: "books",
				type: "createTable",
				up: [
					[
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "integer")',
						"execute();",
					],
				],
				down: [["await db.schema", 'dropTable("books")', "execute();"]],
			},
			{
				priority: 4002,
				tableName: "books",
				type: "createConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("books")',
						'addUniqueConstraint("books_id_kinetic_key", ["id"], (col) => col.nullsNotDistinct())',
						"execute();",
					],
				],
				down: [[]],
			},
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						'addUniqueConstraint("users_id_kinetic_key", ["id"])',
						"execute();",
					],
				],
				down: [[]],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("create table with check constraints", async (context) => {
		const firstCheck = check(sql`${sql.ref("id")} > 50`);
		const secondCheck = check(sql`${sql.ref("id")} < 50000`);

		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				unique: [unique(["id"]).nullsNotDistinct()],
				checks: [firstCheck, secondCheck],
			},
		});

		const database = pgDatabase({
			tables: {
				books,
			},
		});

		const expected = [
			{
				priority: 2001,
				tableName: "books",
				type: "createTable",
				up: [
					[
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "integer")',
						"execute();",
					],
				],
				down: [["await db.schema", 'dropTable("books")', "execute();"]],
			},
			{
				priority: 4002,
				tableName: "books",
				type: "createConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("books")',
						'addUniqueConstraint("books_id_kinetic_key", ["id"], (col) => col.nullsNotDistinct())',
						"execute();",
					],
				],
				down: [[]],
			},
			{
				priority: 4002,
				tableName: "books",
				type: "createConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("books")',
						'addCheckConstraint("918b4271_kinetic_chk", sql`"id" > 50`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON CONSTRAINT "918b4271_kinetic_chk" ON "books" IS \'918b4271\'`.execute(db);',
					],
				],
				down: [[]],
			},
			{
				priority: 4002,
				tableName: "books",
				type: "createConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("books")',
						'addCheckConstraint("e37c55a5_kinetic_chk", sql`"id" < 50000`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON CONSTRAINT "e37c55a5_kinetic_chk" ON "books" IS \'e37c55a5\'`.execute(db);',
					],
				],
				down: [[]],
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
		const books = table({
			columns: {
				id: bigserial(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const users = table({
			columns: {
				id: serial(),
				name: varchar(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["id"], books, ["id"])
						.deleteRule("set null")
						.updateRule("set null"),
				],
			},
		});

		const database = pgDatabase({
			tables: {
				books,
				users,
			},
		});

		const expected = [
			{
				down: [["await db.schema", 'dropTable("books")', "execute();"]],
				priority: 2001,
				tableName: "books",
				type: "createTable",
				up: [
					[
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
			},
			{
				down: [["await db.schema", 'dropTable("users")', "execute();"]],
				priority: 2001,
				tableName: "users",
				type: "createTable",
				up: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						'addColumn("name", sql`character varying`)',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4001,
				tableName: "books",
				type: "createPrimaryKey",
				up: [
					[
						"await db.schema",
						'alterTable("books")',
						'addPrimaryKeyConstraint("books_id_kinetic_pk", ["id"])',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
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
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("create table with indexes", async (context) => {
		const users = table({
			columns: {
				name: text(),
			},
			indexes: [index(["name"])],
		});

		const books = table({
			columns: {
				id: text(),
			},
			indexes: [index(["id"]).unique()],
		});

		const database = pgDatabase({
			tables: {
				users,
				books,
			},
		});

		const expected = [
			{
				down: [["await db.schema", 'dropTable("books")', "execute();"]],
				priority: 2001,
				tableName: "books",
				type: "createTable",
				up: [
					[
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "text")',
						"execute();",
					],
				],
			},
			{
				down: [["await db.schema", 'dropTable("users")', "execute();"]],
				priority: 2001,
				tableName: "users",
				type: "createTable",
				up: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("name", "text")',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4003,
				tableName: "users",
				type: "createIndex",
				up: [
					[
						'await sql`create index "users_name_kntc_idx" on "users" ("name");COMMENT ON INDEX "users_name_kntc_idx" IS \'f873e4a8464da05b0b0978fff8711714af80a8c32d067955877ae60792414d45\'`.execute(db);',
					],
				],
			},
			{
				down: [[]],
				priority: 4003,
				tableName: "books",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "books_id_kntc_idx" on "books" ("id");COMMENT ON INDEX "books_id_kntc_idx" IS \'2200982847e769a05e0298bc04c04ac1e2c56bdc770b421d2a71f1d89250ecee\'`.execute(db);',
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

	test<DbContext>("create table with enums", async (context) => {
		const role = enumType("role", ["admin", "user"]);
		const users = table({
			columns: {
				name: text(),
				role: enumerated(role),
			},
		});

		const database = pgDatabase({
			types: [role],
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
					[
						"await db.schema",
						'createType("role")',
						'asEnum(["admin", "user"])',
						"execute();await sql`COMMENT ON TYPE \"role\" IS 'kinetic'`.execute(db)",
					],
				],
				down: [["await db.schema", 'dropType("role")', "execute();"]],
			},
			{
				priority: 2001,
				tableName: "users",
				type: "createTable",
				up: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("name", "text")',
						'addColumn("role", sql`role`)',
						"execute();",
					],
				],
				down: [["await db.schema", 'dropTable("users")', "execute();"]],
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
		const users = table({
			columns: {
				id: integer(),
				updatedAt: timestamp().default(sql`now()`),
				updatedAtTwo: timestamp().default(sql`now()`),
			},
			triggers: {
				foo_before_update: trigger()
					.fireWhen("before")
					.events(["update"])
					.forEach("row")
					.function("moddatetime", [{ column: "updatedAt" }]),
				foo_before_update_two: trigger()
					.fireWhen("before")
					.events(["update"])
					.forEach("row")
					.function("moddatetime", [{ column: "updatedAtTwo" }]),
			},
		});

		const database = pgDatabase({
			extensions: [extension("moddatetime")],
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
					[
						"await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(db);",
					],
				],
				down: [
					["await sql`DROP EXTENSION IF EXISTS moddatetime;`.execute(db);"],
				],
			},
			{
				priority: 2001,
				tableName: "users",
				type: "createTable",
				up: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("id", "integer")',
						'addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))',
						'addColumn("updatedAtTwo", "timestamp", (col) => col.defaultTo(sql`now()`))',
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "users"."updatedAt" IS \'28a4dae0461e17af56e979c2095abfbe0bfc45fe9ca8abf3144338a518a1bb8f\'`.execute(db);',
					],
					[
						'await sql`COMMENT ON COLUMN "users"."updatedAtTwo" IS \'28a4dae0461e17af56e979c2095abfbe0bfc45fe9ca8abf3144338a518a1bb8f\'`.execute(db);',
					],
				],
				down: [["await db.schema", 'dropTable("users")', "execute();"]],
			},
			{
				priority: 4004,
				tableName: "users",
				type: "createTrigger",
				up: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER foo_before_update_trg
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updatedAt');COMMENT ON TRIGGER foo_before_update_trg ON users IS '10989c272b6a6d0fd27c4c8374d3fa195f2f807743dc05c6862407641426841a';\`.execute(db);`,
					],
				],
				down: [[]],
			},
			{
				priority: 4004,
				tableName: "users",
				type: "createTrigger",
				up: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER foo_before_update_two_trg
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updatedAtTwo');COMMENT ON TRIGGER foo_before_update_two_trg ON users IS '4127b96840bff9ed3b7a45a66674d6934fd5507e7999c946416d53122eb5f3c8';\`.execute(db);`,
					],
				],
				down: [[]],
			},
		];
		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("create table camelCase", async (context) => {
		const books = table({
			columns: {
				id: bigserial(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
			indexes: [index(["id"]).unique()],
		});

		const libraryBuilding = table({
			columns: {
				id: bigserial(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
			indexes: [index(["id"]).unique()],
		});
		const firstCheck = check(sql`${sql.ref("oldBookId")} > 50`);
		const secondCheck = check(sql`${sql.ref("oldBookId")} < 50000`);

		const newBooks = table({
			columns: {
				id: bigserial(),
				oldBookId: bigint(),
				libraryBuildingId: bigint(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
				foreignKeys: [
					foreignKey(["oldBookId"], books, ["id"]),
					foreignKey(["libraryBuildingId"], libraryBuilding, ["id"]),
				],
				checks: [firstCheck, secondCheck],
			},
			indexes: [index(["id"]).unique()],
		});

		const users = table({
			columns: {
				fullName: text(),
				bookId: bigserial(),
			},
			constraints: {
				foreignKeys: [foreignKey(["bookId"], books, ["id"])],
			},
			indexes: [index(["fullName"])],
		});

		const role = enumType("role", ["admin", "user"]);

		const triggerTable = table({
			columns: {
				updatedAt: timestamp().default(sql`now()`),
				role: enumerated(role),
			},
			triggers: {
				foo_before_update: trigger()
					.fireWhen("before")
					.events(["update"])
					.forEach("row")
					.function("moddatetime", [{ column: "updatedAt" }]),
			},
		});

		const database = pgDatabase({
			extensions: [extension("moddatetime")],
			types: [role],
			tables: {
				users,
				books,
				newBooks,
				triggerTable,
				libraryBuilding,
			},
		});

		const expected = [
			{
				priority: 0,
				tableName: "none",
				type: "createExtension",
				up: [
					[
						"await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(db);",
					],
				],
				down: [
					["await sql`DROP EXTENSION IF EXISTS moddatetime;`.execute(db);"],
				],
			},
			{
				priority: 0,
				tableName: "none",
				type: "createEnum",
				up: [
					[
						"await db.schema",
						'createType("role")',
						'asEnum(["admin", "user"])',
						"execute();await sql`COMMENT ON TYPE \"role\" IS 'kinetic'`.execute(db)",
					],
				],
				down: [["await db.schema", 'dropType("role")', "execute();"]],
			},
			{
				priority: 2001,
				tableName: "trigger_table",
				type: "createTable",
				up: [
					[
						"await db.schema",
						'createTable("trigger_table")',
						'addColumn("updated_at", "timestamp", (col) => col.defaultTo(sql`now()`))',
						'addColumn("role", sql`role`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "trigger_table"."updated_at" IS \'28a4dae0461e17af56e979c2095abfbe0bfc45fe9ca8abf3144338a518a1bb8f\'`.execute(db);',
					],
				],
				down: [["await db.schema", 'dropTable("trigger_table")', "execute();"]],
			},
			{
				down: [
					["await db.schema", 'dropTable("library_building")', "execute();"],
				],
				priority: 2001,
				tableName: "library_building",
				type: "createTable",
				up: [
					[
						"await db.schema",
						'createTable("library_building")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
			},
			{
				down: [["await db.schema", 'dropTable("books")', "execute();"]],
				priority: 2001,
				tableName: "books",
				type: "createTable",
				up: [
					[
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
			},
			{
				down: [["await db.schema", 'dropTable("new_books")', "execute();"]],
				priority: 2001,
				tableName: "new_books",
				type: "createTable",
				up: [
					[
						"await db.schema",
						'createTable("new_books")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						'addColumn("old_book_id", "bigint")',
						'addColumn("library_building_id", "bigint")',
						"execute();",
					],
				],
			},
			{
				priority: 2001,
				tableName: "users",
				type: "createTable",
				up: [
					[
						"await db.schema",
						'createTable("users")',
						'addColumn("full_name", "text")',
						'addColumn("book_id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
				down: [["await db.schema", 'dropTable("users")', "execute();"]],
			},
			{
				down: [[]],
				priority: 4001,
				tableName: "books",
				type: "createPrimaryKey",
				up: [
					[
						"await db.schema",
						'alterTable("books")',
						'addPrimaryKeyConstraint("books_id_kinetic_pk", ["id"])',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4001,
				tableName: "new_books",
				type: "createPrimaryKey",
				up: [
					[
						"await db.schema",
						'alterTable("new_books")',
						'addPrimaryKeyConstraint("new_books_id_kinetic_pk", ["id"])',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4001,
				tableName: "library_building",
				type: "createPrimaryKey",
				up: [
					[
						"await db.schema",
						'alterTable("library_building")',
						'addPrimaryKeyConstraint("library_building_id_kinetic_pk", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						'addForeignKeyConstraint("users_book_id_books_id_kinetic_fk", ["book_id"], "books", ["id"])',
						'onDelete("no action")',
						'onUpdate("no action")',
						"execute();",
					],
				],
				down: [[]],
			},
			{
				priority: 4002,
				tableName: "new_books",
				type: "createConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("new_books")',
						'addForeignKeyConstraint("new_books_old_book_id_books_id_kinetic_fk", ["old_book_id"], "books", ["id"])',
						'onDelete("no action")',
						'onUpdate("no action")',
						"execute();",
					],
				],
				down: [[]],
			},
			{
				priority: 4002,
				tableName: "new_books",
				type: "createConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("new_books")',
						'addForeignKeyConstraint("new_books_library_building_id_library_building_id_kinetic_fk", ["library_building_id"], "library_building", ["id"])',
						'onDelete("no action")',
						'onUpdate("no action")',
						"execute();",
					],
				],
				down: [[]],
			},
			{
				priority: 4002,
				tableName: "new_books",
				type: "createConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("new_books")',
						'addCheckConstraint("60bcaca1_kinetic_chk", sql`"old_book_id" > 50`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON CONSTRAINT "60bcaca1_kinetic_chk" ON "new_books" IS \'60bcaca1\'`.execute(db);',
					],
				],
				down: [[]],
			},
			{
				priority: 4002,
				tableName: "new_books",
				type: "createConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("new_books")',
						'addCheckConstraint("1c05ff9f_kinetic_chk", sql`"old_book_id" < 50000`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON CONSTRAINT "1c05ff9f_kinetic_chk" ON "new_books" IS \'1c05ff9f\'`.execute(db);',
					],
				],
				down: [[]],
			},
			{
				down: [[]],
				priority: 4003,
				tableName: "users",
				type: "createIndex",
				up: [
					[
						'await sql`create index "users_full_name_kntc_idx" on "users" ("full_name");COMMENT ON INDEX "users_full_name_kntc_idx" IS \'0a2fa263f5ca54fa5d8dbb61c10f9a31c5c124e2482191f4ff7d1e6e0c9771ce\'`.execute(db);',
					],
				],
			},
			{
				down: [[]],
				priority: 4003,
				tableName: "books",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "books_id_kntc_idx" on "books" ("id");COMMENT ON INDEX "books_id_kntc_idx" IS \'2200982847e769a05e0298bc04c04ac1e2c56bdc770b421d2a71f1d89250ecee\'`.execute(db);',
					],
				],
			},
			{
				down: [[]],
				priority: 4003,
				tableName: "new_books",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "new_books_id_kntc_idx" on "new_books" ("id");COMMENT ON INDEX "new_books_id_kntc_idx" IS \'920c4448799d6236ce7977180a775763a1352666c3289c63055d9d3436c72033\'`.execute(db);',
					],
				],
			},
			{
				down: [[]],
				priority: 4003,
				tableName: "library_building",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "library_building_id_kntc_idx" on "library_building" ("id");COMMENT ON INDEX "library_building_id_kntc_idx" IS \'9c7a73486d378aad269f62895f31d0b13e270b7df7cc83ff33e987fa4c837cd4\'`.execute(db);',
					],
				],
			},
			{
				priority: 4004,
				tableName: "trigger_table",
				type: "createTrigger",
				up: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER foo_before_update_trg
BEFORE UPDATE ON trigger_table
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updated_at');COMMENT ON TRIGGER foo_before_update_trg ON trigger_table IS '7666bcb776b337bfab1e587a745579bd449dc6f961f5b51fad22cc2fb6166b6a';\`.execute(db);`,
					],
				],
				down: [[]],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
			useCamelCase: { enabled: true, options: {} },
		});
	});
});
