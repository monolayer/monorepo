/* eslint-disable max-lines */
import { bigint } from "@monorepo/pg/schema/column/data-types/bigint.js";
import { bigserial } from "@monorepo/pg/schema/column/data-types/bigserial.js";
import { bitVarying } from "@monorepo/pg/schema/column/data-types/bit-varying.js";
import { bit } from "@monorepo/pg/schema/column/data-types/bit.js";
import { boolean } from "@monorepo/pg/schema/column/data-types/boolean.js";
import { bytea } from "@monorepo/pg/schema/column/data-types/bytea.js";
import { varchar } from "@monorepo/pg/schema/column/data-types/character-varying.js";
import { char } from "@monorepo/pg/schema/column/data-types/character.js";
import { date } from "@monorepo/pg/schema/column/data-types/date.js";
import { doublePrecision } from "@monorepo/pg/schema/column/data-types/double-precision.js";
import { inet } from "@monorepo/pg/schema/column/data-types/inet.js";
import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { json } from "@monorepo/pg/schema/column/data-types/json.js";
import { jsonb } from "@monorepo/pg/schema/column/data-types/jsonb.js";
import { macaddr } from "@monorepo/pg/schema/column/data-types/macaddr.js";
import { macaddr8 } from "@monorepo/pg/schema/column/data-types/macaddr8.js";
import { numeric } from "@monorepo/pg/schema/column/data-types/numeric.js";
import { real } from "@monorepo/pg/schema/column/data-types/real.js";
import { serial } from "@monorepo/pg/schema/column/data-types/serial.js";
import { smallint } from "@monorepo/pg/schema/column/data-types/smallint.js";
import { text } from "@monorepo/pg/schema/column/data-types/text.js";
import { timetz } from "@monorepo/pg/schema/column/data-types/time-with-time-zone.js";
import { time } from "@monorepo/pg/schema/column/data-types/time.js";
import { timestamptz } from "@monorepo/pg/schema/column/data-types/timestamp-with-time-zone.js";
import { timestamp } from "@monorepo/pg/schema/column/data-types/timestamp.js";
import { tsquery } from "@monorepo/pg/schema/column/data-types/tsquery.js";
import { tsvector } from "@monorepo/pg/schema/column/data-types/tsvector.js";
import { uuid } from "@monorepo/pg/schema/column/data-types/uuid.js";
import { xml } from "@monorepo/pg/schema/column/data-types/xml.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { test } from "vitest";
import { assertSchemaPush } from "~tests/__setup__/helpers/build-test-case.js";
import type { TestContext } from "~tests/__setup__/setup.js";

test<TestContext>("create column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(`create table "public"."users" ();`)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer(),
					},
				}),
			},
		}),
		expectedQueries: ['alter table "public"."users" add column "id" integer'],
		assertDatabase: async ({ assert }) => {
			await assert.columnNullable("id", "public.users");
		},
	});
});

test<TestContext>("create column camel case", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(`create table "public"."users" ();`)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						userId: integer(),
					},
				}),
			},
		}),
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" add column "user_id" integer',
		],
		assertDatabase: async ({ assert }) => {
			await assert.columnNullable("user_id", "public.users");
		},
	});
});

test<TestContext>("create non nullable column", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(`create table "public"."users" ();`)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						id: integer().notNull(),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" add column "id" integer',
			'alter table "public"."users" add constraint "temporary_not_null_check_constraint_public_users_id" check ("id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "temporary_not_null_check_constraint_public_users_id"',
			'alter table "public"."users" alter column "id" set not null',
			'alter table "public"."users" drop constraint "temporary_not_null_check_constraint_public_users_id"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.columnNullable("id", "public.users");
		},
	});
});

test<TestContext>("create non nullable column camel case", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(`create table "public"."users" ();`)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						userId: integer().notNull(),
					},
				}),
			},
		}),
		camelCase: true,
		expectedQueries: [
			'alter table "public"."users" add column "user_id" integer',
			'alter table "public"."users" add constraint "temporary_not_null_check_constraint_public_users_user_id" check ("user_id" IS NOT NULL) not valid',
			'alter table "public"."users" validate constraint "temporary_not_null_check_constraint_public_users_user_id"',
			'alter table "public"."users" alter column "user_id" set not null',
			'alter table "public"."users" drop constraint "temporary_not_null_check_constraint_public_users_user_id"',
		],
		assertDatabase: async ({ refute }) => {
			await refute.columnNullable("user_id", "public.users");
		},
	});
});

test<TestContext>("column types", async (context) => {
	await assertSchemaPush({
		context,
		before: async (context) => {
			await sql
				.raw(
					`
          create table "public"."users" ();
          create table "public"."books" ();
        `,
				)
				.execute(context.dbClient);
		},
		schema: schema({
			tables: {
				users: table({
					columns: {
						bigInt: bigint(),
						bigSerial: bigserial(),
						boolean: boolean(),
						bytea: bytea(),
						char: char(),
						char_10: char(10),
						date: date(),
						doublePrecision: doublePrecision(),
						smallint: smallint(),
						integer: integer(),
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
						tsqueryWithDefault: tsquery().default(sql`to_tsquery('foo')`),
						xml: xml(),
					},
				}),
			},
		}),
		expectedQueries: [
			'alter table "public"."users" add column "bigInt" bigint',
			'alter table "public"."users" add column "bigSerial" bigserial',
			'alter table "public"."users" add column "boolean" boolean',
			'alter table "public"."users" add column "bytea" bytea',
			'alter table "public"."users" add column "char" character(1)',
			'alter table "public"."users" add column "char_10" character(10)',
			'alter table "public"."users" add column "date" date',
			'alter table "public"."users" add column "doublePrecision" double precision',
			'alter table "public"."users" add column "smallint" smallint',
			'alter table "public"."users" add column "integer" integer',
			'alter table "public"."users" add column "bit" bit(1)',
			'alter table "public"."users" add column "secondBit" bit(10)',
			'alter table "public"."users" add column "bitWithDefault" bit(1) default \'1\'::bit',
			'COMMENT ON COLUMN "public"."users"."bitWithDefault" IS \'e7152e01\'',
			'alter table "public"."users" add column "varbit" bit varying',
			'alter table "public"."users" add column "varbitWithLength" bit varying(10)',
			'alter table "public"."users" add column "inet" inet',
			'alter table "public"."users" add column "inetWithDefault" inet default \'192.168.0.1\'::inet',
			'COMMENT ON COLUMN "public"."users"."inetWithDefault" IS \'840df336\'',
			'alter table "public"."users" add column "macaddr" macaddr',
			'alter table "public"."users" add column "macaddrWithDefault" macaddr default \'08:00:2b:01:02:03\'::macaddr',
			'COMMENT ON COLUMN "public"."users"."macaddrWithDefault" IS \'c14cc2c9\'',
			'alter table "public"."users" add column "macaddr8" macaddr8',
			'alter table "public"."users" add column "macaddr8WithDefault" macaddr8 default \'08:00:2b:01:02:03:04:05\'::macaddr8',
			'COMMENT ON COLUMN "public"."users"."macaddr8WithDefault" IS \'d2247d08\'',
			'alter table "public"."books" add column "json" json',
			'alter table "public"."books" add column "jsonB" jsonb',
			'alter table "public"."books" add column "numeric" numeric',
			'alter table "public"."books" add column "numeric_5" numeric(5, 0)',
			'alter table "public"."books" add column "numeric_5_2" numeric(5, 2)',
			'alter table "public"."books" add column "real" real',
			'alter table "public"."books" add column "serial" serial',
			'alter table "public"."books" add column "text" text',
			'alter table "public"."books" add column "time" time',
			'alter table "public"."books" add column "time_4" time(4)',
			'alter table "public"."books" add column "timeTz" time with time zone',
			'alter table "public"."books" add column "timeTz_4" time(4) with time zone',
			'alter table "public"."books" add column "timestamp" timestamp',
			'alter table "public"."books" add column "timestamp_3" timestamp(3)',
			'alter table "public"."books" add column "timestampTz" timestamp with time zone',
			'alter table "public"."books" add column "timestampTz_3" timestamp(3) with time zone',
			'alter table "public"."books" add column "uuid" uuid',
			'alter table "public"."books" add column "varChar" character varying',
			'alter table "public"."books" add column "varCharWithDefault" character varying default \'foo\'::character varying',
			'COMMENT ON COLUMN "public"."books"."varCharWithDefault" IS \'2bc67682\'',
			'alter table "public"."books" add column "varChar_255" character varying(255)',
			'alter table "public"."books" add column "vector" tsvector',
			'alter table "public"."books" add column "vectorWithDefault" tsvector default to_tsvector(\'a b\')',
			'COMMENT ON COLUMN "public"."books"."vectorWithDefault" IS \'1ffcfd22\'',
			'alter table "public"."books" add column "tsquery" tsquery',
			'alter table "public"."books" add column "tsqueryWithDefault" tsquery default to_tsquery(\'foo\')',
			'COMMENT ON COLUMN "public"."books"."tsqueryWithDefault" IS \'787906b1\'',
			'alter table "public"."books" add column "xml" xml',
		],
		assertDatabase: async ({ assert }) => {
			await assert.column("bigInt", "bigint", "public.users");
			await assert.column("bigSerial", "bigint", "public.users");
			await assert.column("boolean", "boolean", "public.users");
			await assert.column("bytea", "bytea", "public.users");
			await assert.column("char", "character", "public.users");
			await assert.column("char_10", "character", "public.users");
			await assert.column("date", "date", "public.users");
			await assert.column(
				"doublePrecision",
				"double precision",
				"public.users",
			);
			await assert.column("smallint", "smallint", "public.users");
			await assert.column("integer", "integer", "public.users");
			await assert.column("bit", "bit", "public.users");
			await assert.column("secondBit", "bit", "public.users");
			await assert.column("bitWithDefault", "bit", "public.users");
			await assert.column("varbit", "bit varying", "public.users");
			await assert.column("varbitWithLength", "bit varying", "public.users");
			await assert.column("inet", "inet", "public.users");
			await assert.column("inetWithDefault", "inet", "public.users");
			await assert.column("macaddr", "macaddr", "public.users");
			await assert.column("macaddrWithDefault", "macaddr", "public.users");
			await assert.column("macaddr8", "macaddr8", "public.users");
			await assert.column("macaddr8WithDefault", "macaddr8", "public.users");
			await assert.column("json", "json", "public.books");
			await assert.column("jsonB", "jsonb", "public.books");
			await assert.column("numeric", "numeric", "public.books");
			await assert.column("numeric_5", "numeric", "public.books");
			await assert.column("numeric_5_2", "numeric", "public.books");
			await assert.column("real", "real", "public.books");
			await assert.column("serial", "integer", "public.books");
			await assert.column("text", "text", "public.books");
			await assert.column("time", "time without time zone", "public.books");
			await assert.column("time_4", "time without time zone", "public.books");
			await assert.column("timeTz", "time with time zone", "public.books");
			await assert.column("timeTz_4", "time with time zone", "public.books");
			await assert.column(
				"timestamp",
				"timestamp without time zone",
				"public.books",
			);
			await assert.column(
				"timestamp_3",
				"timestamp without time zone",
				"public.books",
			);
			await assert.column(
				"timestampTz",
				"timestamp with time zone",
				"public.books",
			);
			await assert.column(
				"timestampTz_3",
				"timestamp with time zone",
				"public.books",
			);
			await assert.column("uuid", "uuid", "public.books");
			await assert.column("varChar", "character varying", "public.books");
			await assert.column(
				"varCharWithDefault",
				"character varying",
				"public.books",
			);
			await assert.column("varChar_255", "character varying", "public.books");
			await assert.column("vector", "tsvector", "public.books");
			await assert.column("vectorWithDefault", "tsvector", "public.books");
			await assert.column("tsquery", "tsquery", "public.books");
			await assert.column("tsqueryWithDefault", "tsquery", "public.books");
			await assert.column("xml", "xml", "public.books");
		},
	});
});
