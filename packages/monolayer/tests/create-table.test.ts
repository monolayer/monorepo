/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { extension } from "~/database/extension/extension.js";
import { schema } from "~/database/schema/schema.js";
import { columnWithType } from "~/database/schema/table/column/column-with-type.js";
import { bigint } from "~/database/schema/table/column/data-types/bigint.js";
import { bigserial } from "~/database/schema/table/column/data-types/bigserial.js";
import { bitVarying } from "~/database/schema/table/column/data-types/bit-varying.js";
import { bit } from "~/database/schema/table/column/data-types/bit.js";
import { boolean } from "~/database/schema/table/column/data-types/boolean.js";
import { bytea } from "~/database/schema/table/column/data-types/bytea.js";
import { varchar } from "~/database/schema/table/column/data-types/character-varying.js";
import { char } from "~/database/schema/table/column/data-types/character.js";
import { date } from "~/database/schema/table/column/data-types/date.js";
import { doublePrecision } from "~/database/schema/table/column/data-types/double-precision.js";
import { enumerated } from "~/database/schema/table/column/data-types/enumerated.js";
import { inet } from "~/database/schema/table/column/data-types/inet.js";
import { integer } from "~/database/schema/table/column/data-types/integer.js";
import { json } from "~/database/schema/table/column/data-types/json.js";
import { jsonb } from "~/database/schema/table/column/data-types/jsonb.js";
import { macaddr } from "~/database/schema/table/column/data-types/macaddr.js";
import { macaddr8 } from "~/database/schema/table/column/data-types/macaddr8.js";
import { numeric } from "~/database/schema/table/column/data-types/numeric.js";
import { real } from "~/database/schema/table/column/data-types/real.js";
import { serial } from "~/database/schema/table/column/data-types/serial.js";
import { smallint } from "~/database/schema/table/column/data-types/smallint.js";
import { text } from "~/database/schema/table/column/data-types/text.js";
import { timetz } from "~/database/schema/table/column/data-types/time-with-time-zone.js";
import { time } from "~/database/schema/table/column/data-types/time.js";
import { timestamptz } from "~/database/schema/table/column/data-types/timestamp-with-time-zone.js";
import { timestamp } from "~/database/schema/table/column/data-types/timestamp.js";
import { tsquery } from "~/database/schema/table/column/data-types/tsquery.js";
import { tsvector } from "~/database/schema/table/column/data-types/tsvector.js";
import { uuid } from "~/database/schema/table/column/data-types/uuid.js";
import { xml } from "~/database/schema/table/column/data-types/xml.js";
import { check } from "~/database/schema/table/constraints/check/check.js";
import {
	foreignKey,
	unmanagedForeignKey,
} from "~/database/schema/table/constraints/foreign-key/foreign-key.js";
import { primaryKey } from "~/database/schema/table/constraints/primary-key/primary-key.js";
import { unique } from "~/database/schema/table/constraints/unique/unique.js";
import { index } from "~/database/schema/table/index/index.js";
import { table } from "~/database/schema/table/table.js";
import { trigger } from "~/database/schema/table/trigger/trigger.js";
import { enumType } from "~/database/schema/types/enum/enum.js";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("Create table", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("empty table", async (context) => {
		const dbSchema = schema({
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
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createTable",
				priority: 2001,
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
			},
			{
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createTable",
				priority: 2001,
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("books")',
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

	test<DbContext>("with columns", async (context) => {
		const dbSchema = schema({
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
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createTable",
				priority: 2001,
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("bigInt2", "bigint", (col) => col.notNull())',
						'addColumn("bigSerial", "bigserial", (col) => col.notNull())',
						'addColumn("bigInt", "bigint")',
						'addColumn("doublePrecision", "double precision")',
						'addColumn("integerAlwaysAsIdentity", "integer", (col) => col.notNull().generatedAlwaysAsIdentity())',
						'addColumn("integerDefaultAsIdentity", "integer", (col) => col.notNull().generatedByDefaultAsIdentity())',
						'addColumn("date", "date")',
						'addColumn("integer", "integer")',
						'addColumn("macaddr", sql`macaddr`)',
						'addColumn("macaddr8", sql`macaddr8`)',
						"addColumn(\"macaddr8WithDefault\", sql`macaddr8`, (col) => col.defaultTo(sql`'08:00:2b:01:02:03:04:05'::macaddr8`))",
						"addColumn(\"macaddrWithDefault\", sql`macaddr`, (col) => col.defaultTo(sql`'08:00:2b:01:02:03'::macaddr`))",
						'addColumn("smallint", sql`smallint`)',
						'addColumn("boolean", "boolean")',
						'addColumn("bytea", "bytea")',
						'addColumn("inet", sql`inet`)',
						"addColumn(\"inetWithDefault\", sql`inet`, (col) => col.defaultTo(sql`'192.168.0.1'::inet`))",
						'addColumn("varbit", sql`bit varying`)',
						'addColumn("bit", sql`bit(1)`)',
						"addColumn(\"bitWithDefault\", sql`bit(1)`, (col) => col.defaultTo(sql`'1'::bit`))",
						'addColumn("char", sql`character(1)`)',
						'addColumn("char_10", sql`character(10)`)',
						'addColumn("secondBit", sql`bit(10)`)',
						'addColumn("varbitWithLength", sql`bit varying(10)`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."bitWithDefault" IS \'e7152e01\'`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."inetWithDefault" IS \'840df336\'`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."macaddrWithDefault" IS \'c14cc2c9\'`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."macaddr8WithDefault" IS \'d2247d08\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
			},
			{
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createTable",
				priority: 2001,
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("books")',
						'addColumn("time", "time")',
						'addColumn("timestamp", "timestamp")',
						'addColumn("timestampTz", sql`timestamp with time zone`)',
						'addColumn("timeTz", sql`time with time zone`)',
						'addColumn("serial", "serial", (col) => col.notNull())',
						'addColumn("real", "real")',
						'addColumn("uuid", "uuid")',
						'addColumn("json", "json")',
						'addColumn("jsonB", "jsonb")',
						'addColumn("numeric", "numeric")',
						'addColumn("text", "text")',
						'addColumn("tsquery", sql`tsquery`)',
						"addColumn(\"tsqueryWithDefault\", sql`tsquery`, (col) => col.defaultTo(sql`to_tsquery('a b')`))",
						'addColumn("varChar", sql`character varying`)',
						"addColumn(\"varCharWithDefault\", sql`character varying`, (col) => col.defaultTo(sql`'foo'::character varying`))",
						'addColumn("vector", sql`tsvector`)',
						"addColumn(\"vectorWithDefault\", sql`tsvector`, (col) => col.defaultTo(sql`to_tsvector('a b')`))",
						'addColumn("xml", sql`xml`)',
						'addColumn("numeric_5", "numeric(5, 0)")',
						'addColumn("numeric_5_2", "numeric(5, 2)")',
						'addColumn("time_4", "time(4)")',
						'addColumn("timestamp_3", "timestamp(3)")',
						'addColumn("timestampTz_3", sql`timestamp(3) with time zone`)',
						'addColumn("timeTz_4", sql`time(4) with time zone`)',
						'addColumn("varChar_255", sql`character varying(255)`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."books"."varCharWithDefault" IS \'2bc67682\'`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."books"."vectorWithDefault" IS \'1ffcfd22\'`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."books"."tsqueryWithDefault" IS \'6970b882\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("books")',
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

	test<DbContext>("with generic columns", async (context) => {
		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						bit_a: columnWithType<string, string>("bit(1)[]"),
						bit_varying: columnWithType<string, string>("bit varying(1)[]"),
						char_a: columnWithType<string, string>("character(1)[]"),
						money: columnWithType<string, string>("money"),
						numeric_5_a: columnWithType<string, string>("numeric(5,0)[]"),
						numeric_5_2_arr: columnWithType<string, string>("numeric(5,2)[]"),
						textArray: columnWithType<string[], string[]>("text[]"),
						timestamp_a: columnWithType<string[], string[]>("timestamp[]"),
						timestamp_a_3: columnWithType<string[], string[]>("timestamp(3)[]"),
						timestamptz_a: columnWithType<string[], string[]>(
							"timestamp with time zone[]",
						),
						timestamptz_a_3: columnWithType<string[], string[]>(
							"timestamp(3) with time zone[]",
						),
						time_a: columnWithType<string[], string[]>("time[]"),
						time_a_3: columnWithType<string[], string[]>("time(3)[]"),
						timetz_a: columnWithType<string[], string[]>(
							"time with time zone[]",
						),
						timetz_a_3: columnWithType<string[], string[]>(
							"time(3) with time zone[]",
						),
						varchar_a: columnWithType<string, string>("character varying[]"),
						varchar_a_255: columnWithType<string, string>(
							"character varying(255)[]",
						),
					},
				}),
			},
		});

		const expected = [
			{
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createTable",
				priority: 2001,
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("money", sql`"money"`)',
						'addColumn("bit_a", sql`bit(1)[]`)',
						'addColumn("bit_varying", sql`bit varying(1)[]`)',
						'addColumn("char_a", sql`character(1)[]`)',
						'addColumn("numeric_5_2_arr", sql`numeric(5,2)[]`)',
						'addColumn("numeric_5_a", sql`numeric(5,0)[]`)',
						'addColumn("textArray", sql`text[]`)',
						'addColumn("time_a", sql`time[]`)',
						'addColumn("time_a_3", sql`time(3)[]`)',
						'addColumn("timestamp_a", sql`timestamp[]`)',
						'addColumn("timestamp_a_3", sql`timestamp(3)[]`)',
						'addColumn("timestamptz_a", sql`timestamp with time zone[]`)',
						'addColumn("timestamptz_a_3", sql`timestamp(3) with time zone[]`)',
						'addColumn("timetz_a", sql`time with time zone[]`)',
						'addColumn("timetz_a_3", sql`time(3) with time zone[]`)',
						'addColumn("varchar_a", sql`character varying[]`)',
						'addColumn("varchar_a_255", sql`character varying(255)[]`)',
						"execute();",
					],
				],
				down: [
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

	test<DbContext>("with primary key", async (context) => {
		const dbSchema = schema({
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
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createTable",
				priority: 2001,
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
			},
			{
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createTable",
				priority: 2001,
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("books")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("books")',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4013,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addPrimaryKeyConstraint("users_pkey", ["id"])',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4013,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addPrimaryKeyConstraint("books_pkey", ["id"])',
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

	test<DbContext>("with composite primary key", async (context) => {
		const dbSchema = schema({
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
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createTable",
				priority: 2001,
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						'addColumn("name", sql`character varying`)',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
			},
			{
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createTable",
				priority: 2001,
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("books")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("books")',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4013,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addPrimaryKeyConstraint("users_pkey", ["id", "name"])',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4013,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addPrimaryKeyConstraint("books_pkey", ["id"])',
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

	test<DbContext>("with unique constraints", async (context) => {
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

		const dbSchema = schema({
			tables: {
				books,
				users,
			},
		});

		const expected = [
			{
				priority: 2001,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("books")',
						'addColumn("id", "integer")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("books")',
						"execute();",
					],
				],
			},
			{
				priority: 2001,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						'addColumn("fullName", sql`character varying`)',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
			},
			{
				priority: 4010,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_a91945e0_monolayer_key", ["id"], (col) => col.nullsNotDistinct())',
						"execute();",
					],
				],
				down: [[]],
			},
			{
				priority: 4010,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addUniqueConstraint("users_acdd8fa3_monolayer_key", ["id"])',
						"execute();",
					],
				],
				down: [[]],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("with check constraints", async (context) => {
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

		const dbSchema = schema({
			tables: {
				books,
			},
		});

		const expected = [
			{
				priority: 2001,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("books")',
						'addColumn("id", "integer")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4010,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_a91945e0_monolayer_key", ["id"], (col) => col.nullsNotDistinct())',
						"execute();",
					],
				],
				down: [[]],
			},
			{
				priority: 4012,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createCheckConstraint",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("books")
    .addCheckConstraint("books_918b4271_monolayer_chk", sql\`"id" > 50\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_918b4271_monolayer_chk"`',
						"execute(db);",
					],
				],
				down: [[]],
			},
			{
				priority: 4012,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createCheckConstraint",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("books")
    .addCheckConstraint("books_e37c55a5_monolayer_chk", sql\`"id" < 50000\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_e37c55a5_monolayer_chk"`',
						"execute(db);",
					],
				],
				down: [[]],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("with foreign keys", async (context) => {
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
					unmanagedForeignKey(["id"], "other", ["id"]),
					foreignKey(["id"], books, ["id"])
						.deleteRule("set null")
						.updateRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				books,
				users,
			},
		});

		const expected = [
			{
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
				priority: 2001,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						'addColumn("name", sql`character varying`)',
						"execute();",
					],
				],
			},
			{
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("books")',
						"execute();",
					],
				],
				priority: 2001,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("books")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4013,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addPrimaryKeyConstraint("books_pkey", ["id"])',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4014,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createForeignKey",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_8abc8e0b_monolayer_fk", ["id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_8abc8e0b_monolayer_fk"`',
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

	test<DbContext>("with self referenced foreign keys", async (context) => {
		const tree = table({
			columns: {
				node_id: integer().notNull(),
				parent_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["node_id"]),
				foreignKeys: [foreignKey(["parent_id"], ["node_id"])],
			},
		});

		const dbSchema = schema({
			tables: {
				tree,
			},
		});

		const expected = [
			{
				priority: 2001,
				tableName: "tree",
				currentTableName: "tree",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("tree")',
						'addColumn("node_id", "integer", (col) => col.notNull())',
						'addColumn("parent_id", "integer")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("tree")',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4013,
				tableName: "tree",
				currentTableName: "tree",
				schemaName: "public",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("tree")',
						'addPrimaryKeyConstraint("tree_pkey", ["node_id"])',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4014,
				tableName: "tree",
				currentTableName: "tree",
				schemaName: "public",
				type: "createForeignKey",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("tree")
    .addForeignKeyConstraint("tree_136bac6e_monolayer_fk", ["parent_id"], "public.tree", ["node_id"])
    .onDelete("no action")
    .onUpdate("no action")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."tree" VALIDATE CONSTRAINT "tree_136bac6e_monolayer_fk"`',
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

	test<DbContext>("with indexes", async (context) => {
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

		const dbSchema = schema({
			tables: {
				users,
				books,
			},
		});

		const expected = [
			{
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
				priority: 2001,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("name", "text")',
						"execute();",
					],
				],
			},
			{
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("books")',
						"execute();",
					],
				],
				priority: 2001,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("books")',
						'addColumn("id", "text")',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4003,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createIndex",
				up: [
					[
						'await sql`create index "users_e42f0227_monolayer_idx" on "public"."users" ("name")`',
						"execute(db);",
					],
				],
			},
			{
				down: [[]],
				priority: 4003,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "books_e8f5ecda_monolayer_idx" on "public"."books" ("id")`',
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

	test<DbContext>("with enums", async (context) => {
		const role = enumType("role", ["admin", "user"]);
		const status = enumType("STATUS", ["active", "inactive"]);

		const users = table({
			columns: {
				name: text(),
				role: enumerated(role),
				status: enumerated(status),
				multipleStatus: columnWithType<string[]>("STATUS[]"),
			},
		});

		const dbSchema = schema({
			types: [role, status],
			tables: {
				users,
			},
		});
		const expected = [
			{
				priority: 2,
				tableName: "none",
				currentTableName: "none",
				schemaName: "public",
				type: "createEnum",
				up: [
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
				down: [
					[
						'await db.withSchema("public").schema',
						'dropType("role")',
						"execute();",
					],
				],
			},
			{
				priority: 2,
				tableName: "none",
				currentTableName: "none",
				schemaName: "public",
				type: "createEnum",
				up: [
					[
						'await db.withSchema("public").schema',
						'createType("STATUS")',
						'asEnum(["active", "inactive"])',
						"execute();",
					],
					[
						'await sql`COMMENT ON TYPE "public"."STATUS" IS \'monolayer\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropType("STATUS")',
						"execute();",
					],
				],
			},
			{
				priority: 2001,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("role", sql`"role"`)',
						'addColumn("status", sql`"STATUS"`)',
						'addColumn("name", "text")',
						'addColumn("multipleStatus", sql`"STATUS"[]`)',
						"execute();",
					],
				],
				down: [
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

	test<DbContext>("with triggers", async (context) => {
		const users = table({
			columns: {
				id: integer(),
				updatedAt: timestamp().default(sql`now()`),
				updatedAtTwo: timestamp().default(sql`now()`),
			},
			triggers: [
				trigger({
					fireWhen: "before",
					events: ["update"],
					forEach: "row",
					function: {
						name: "moddatetime",
						args: [sql.ref("updatedAt")],
					},
				}),
				trigger({
					fireWhen: "before",
					events: ["update"],
					forEach: "row",
					function: {
						name: "moddatetime",
						args: [sql.ref("updatedAtTwo")],
					},
				}),
			],
		});

		const dbSchema = schema({
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 1,
				tableName: "none",
				currentTableName: "none",
				schemaName: null,
				type: "createExtension",
				up: [
					[
						"await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`",
						"execute(db);",
					],
				],
				down: [
					["await sql`DROP EXTENSION IF EXISTS moddatetime;`", "execute(db);"],
				],
			},
			{
				priority: 2001,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))',
						'addColumn("updatedAtTwo", "timestamp", (col) => col.defaultTo(sql`now()`))',
						'addColumn("id", "integer")',
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."updatedAt" IS \'28a4dae0\'`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."updatedAtTwo" IS \'28a4dae0\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
			},
			{
				priority: 4004,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createTrigger",
				up: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER users_8659ae36_monolayer_trg
BEFORE UPDATE ON "public"."users"
FOR EACH ROW
EXECUTE FUNCTION moddatetime("updatedAt")\``,
						`execute(db);`,
					],
				],
				down: [[]],
			},
			{
				priority: 4004,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createTrigger",
				up: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER users_7d730e02_monolayer_trg
BEFORE UPDATE ON "public"."users"
FOR EACH ROW
EXECUTE FUNCTION moddatetime("updatedAtTwo")\``,
						`execute(db);`,
					],
				],
				down: [[]],
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
			triggers: [
				trigger({
					fireWhen: "before",
					events: ["update"],
					forEach: "row",
					function: {
						name: "moddatetime",
						args: [sql.ref("updatedAt")],
					},
				}),
			],
		});

		const dbSchema = schema({
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
				priority: 1,
				tableName: "none",
				currentTableName: "none",
				schemaName: null,
				type: "createExtension",
				up: [
					[
						"await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`",
						"execute(db);",
					],
				],
				down: [
					["await sql`DROP EXTENSION IF EXISTS moddatetime;`", "execute(db);"],
				],
			},
			{
				priority: 2,
				tableName: "none",
				currentTableName: "none",
				schemaName: "public",
				type: "createEnum",
				up: [
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
				down: [
					[
						'await db.withSchema("public").schema',
						'dropType("role")',
						"execute();",
					],
				],
			},
			{
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("new_books")',
						"execute();",
					],
				],
				priority: 2001,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("new_books")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						'addColumn("library_building_id", "bigint")',
						'addColumn("old_book_id", "bigint")',
						"execute();",
					],
				],
			},
			{
				priority: 2001,
				tableName: "trigger_table",
				currentTableName: "trigger_table",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("trigger_table")',
						'addColumn("updated_at", "timestamp", (col) => col.defaultTo(sql`now()`))',
						'addColumn("role", sql`"role"`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."trigger_table"."updated_at" IS \'28a4dae0\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("trigger_table")',
						"execute();",
					],
				],
			},
			{
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("library_building")',
						"execute();",
					],
				],
				priority: 2001,
				tableName: "library_building",
				currentTableName: "library_building",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("library_building")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
			},
			{
				priority: 2001,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("book_id", "bigserial", (col) => col.notNull())',
						'addColumn("full_name", "text")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("users")',
						"execute();",
					],
				],
			},
			{
				down: [
					[
						'await db.withSchema("public").schema',
						'dropTable("books")',
						"execute();",
					],
				],
				priority: 2001,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("books")',
						'addColumn("id", "bigserial", (col) => col.notNull())',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4003,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createIndex",
				up: [
					[
						'await sql`create index "users_82175e31_monolayer_idx" on "public"."users" ("full_name")`',
						"execute(db);",
					],
				],
			},
			{
				down: [[]],
				priority: 4003,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "books_e8f5ecda_monolayer_idx" on "public"."books" ("id")`',
						"execute(db);",
					],
				],
			},
			{
				down: [[]],
				priority: 4003,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "new_books_e8f5ecda_monolayer_idx" on "public"."new_books" ("id")`',
						"execute(db);",
					],
				],
			},
			{
				down: [[]],
				priority: 4003,
				tableName: "library_building",
				currentTableName: "library_building",
				schemaName: "public",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "library_building_e8f5ecda_monolayer_idx" on "public"."library_building" ("id")`',
						"execute(db);",
					],
				],
			},
			{
				priority: 4004,
				tableName: "trigger_table",
				currentTableName: "trigger_table",
				schemaName: "public",
				type: "createTrigger",
				up: [
					[
						`await sql\`CREATE OR REPLACE TRIGGER trigger_table_dd1e7d9a_monolayer_trg
BEFORE UPDATE ON "public"."trigger_table"
FOR EACH ROW
EXECUTE FUNCTION moddatetime("updated_at")\``,
						`execute(db);`,
					],
				],
				down: [[]],
			},
			{
				priority: 4012,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "createCheckConstraint",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("new_books")
    .addCheckConstraint("new_books_60bcaca1_monolayer_chk", sql\`"old_book_id" > 50\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."new_books" VALIDATE CONSTRAINT "new_books_60bcaca1_monolayer_chk"`',
						"execute(db);",
					],
				],
				down: [[]],
			},
			{
				priority: 4012,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "createCheckConstraint",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("new_books")
    .addCheckConstraint("new_books_1c05ff9f_monolayer_chk", sql\`"old_book_id" < 50000\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."new_books" VALIDATE CONSTRAINT "new_books_1c05ff9f_monolayer_chk"`',
						"execute(db);",
					],
				],
				down: [[]],
			},
			{
				down: [[]],
				priority: 4013,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addPrimaryKeyConstraint("books_pkey", ["id"])',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4013,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'addPrimaryKeyConstraint("new_books_pkey", ["id"])',
						"execute();",
					],
				],
			},
			{
				down: [[]],
				priority: 4013,
				tableName: "library_building",
				currentTableName: "library_building",
				schemaName: "public",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("library_building")',
						'addPrimaryKeyConstraint("library_building_pkey", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 4014,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createForeignKey",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_148cbac6_monolayer_fk", ["book_id"], "public.books", ["id"])
    .onDelete("no action")
    .onUpdate("no action")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_148cbac6_monolayer_fk"`',
						"execute(db);",
					],
				],
				down: [[]],
			},
			{
				priority: 4014,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "createForeignKey",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("new_books")
    .addForeignKeyConstraint("new_books_61f374e1_monolayer_fk", ["old_book_id"], "public.books", ["id"])
    .onDelete("no action")
    .onUpdate("no action")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."new_books" VALIDATE CONSTRAINT "new_books_61f374e1_monolayer_fk"`',
						"execute(db);",
					],
				],
				down: [[]],
			},
			{
				priority: 4014,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "createForeignKey",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("new_books")
    .addForeignKeyConstraint("new_books_5e0a4bbc_monolayer_fk", ["library_building_id"], "public.library_building", ["id"])
    .onDelete("no action")
    .onUpdate("no action")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."new_books" VALIDATE CONSTRAINT "new_books_5e0a4bbc_monolayer_fk"`',
						"execute(db);",
					],
				],
				down: [[]],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: {
				schemas: [dbSchema],
				extensions: [extension("moddatetime")],
				camelCasePlugin: { enabled: true, options: {} },
			},
			expected,
			down: "same",
		});
	});
});
