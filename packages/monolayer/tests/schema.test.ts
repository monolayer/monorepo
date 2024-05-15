/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { schema } from "~/database/schema/schema.js";
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
import { foreignKey } from "~/database/schema/table/constraints/foreign-key/foreign-key.js";
import { primaryKey } from "~/database/schema/table/constraints/primary-key/primary-key.js";
import { table } from "~/database/schema/table/table.js";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("Schema", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	describe("without camel case plugin", () => {
		test<DbContext>("create table in demo schema", async (context) => {
			const dbSchema = schema({
				name: "demo",
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
							integerDefaultAsIdentity:
								integer().generatedByDefaultAsIdentity(),
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
							macaddr8WithDefault: macaddr8().default(
								"08:00:2b:01:02:03:04:05",
							),
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
					priority: 0,
					tableName: "none",
					currentTableName: "none",
					schemaName: "demo",
					type: "createSchema",
					up: [
						['await sql`CREATE SCHEMA IF NOT EXISTS "demo";`', "execute(db);"],
						[
							"await sql`COMMENT ON SCHEMA \"demo\" IS 'monolayer'`",
							"execute(db);",
						],
					],
					down: [['await sql`DROP SCHEMA IF EXISTS "demo";`', "execute(db);"]],
				},
				{
					tableName: "users",
					currentTableName: "users",
					schemaName: "demo",
					type: "createTable",
					priority: 2001,
					up: [
						[
							'await db.withSchema("demo").schema',
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
							'await sql`COMMENT ON COLUMN "demo"."users"."bitWithDefault" IS \'e7152e01\'`',
							"execute(db);",
						],
						[
							'await sql`COMMENT ON COLUMN "demo"."users"."inetWithDefault" IS \'840df336\'`',
							"execute(db);",
						],
						[
							'await sql`COMMENT ON COLUMN "demo"."users"."macaddrWithDefault" IS \'c14cc2c9\'`',
							"execute(db);",
						],
						[
							'await sql`COMMENT ON COLUMN "demo"."users"."macaddr8WithDefault" IS \'d2247d08\'`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("demo").schema',
							'dropTable("users")',
							"execute();",
						],
					],
				},
				{
					tableName: "books",
					currentTableName: "books",
					schemaName: "demo",
					type: "createTable",
					priority: 2001,
					up: [
						[
							'await db.withSchema("demo").schema',
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
							'await sql`COMMENT ON COLUMN "demo"."books"."varCharWithDefault" IS \'2bc67682\'`',
							"execute(db);",
						],
						[
							'await sql`COMMENT ON COLUMN "demo"."books"."vectorWithDefault" IS \'1ffcfd22\'`',
							"execute(db);",
						],
						[
							'await sql`COMMENT ON COLUMN "demo"."books"."tsqueryWithDefault" IS \'6970b882\'`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("demo").schema',
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

		test<DbContext>("create table with foreign key reference to another schema", async (context) => {
			const user_permissions = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const permission = schema({
				name: "permission",
				tables: {
					user_permissions,
				},
			});

			const users = table({
				columns: {
					id: integer(),
					permission_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["permission_id"], permission.tables.user_permissions, [
							"id",
						])
							.deleteRule("set null")
							.updateRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 0,
					schemaName: "permission",
					tableName: "none",
					currentTableName: "none",
					type: "createSchema",
					up: [
						[
							'await sql`CREATE SCHEMA IF NOT EXISTS "permission";`',
							"execute(db);",
						],
						[
							"await sql`COMMENT ON SCHEMA \"permission\" IS 'monolayer'`",
							"execute(db);",
						],
					],
					down: [
						['await sql`DROP SCHEMA IF EXISTS "permission";`', "execute(db);"],
					],
				},
				{
					priority: 2001,
					schemaName: "permission",
					tableName: "user_permissions",
					currentTableName: "user_permissions",
					type: "createTable",
					up: [
						[
							'await db.withSchema("permission").schema',
							'createTable("user_permissions")',
							'addColumn("id", "integer")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("permission").schema',
							'dropTable("user_permissions")',
							"execute();",
						],
					],
				},
				{
					priority: 4001,
					schemaName: "permission",
					tableName: "user_permissions",
					currentTableName: "user_permissions",
					type: "createPrimaryKey",
					up: [
						[
							'await db.withSchema("permission").schema',
							'alterTable("user_permissions")',
							'addPrimaryKeyConstraint("user_permissions_monolayer_pk", ["id"])',
							"execute();",
						],
					],
					down: [[]],
				},
				{
					priority: 2001,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'createTable("users")',
							'addColumn("id", "integer")',
							'addColumn("permission_id", "integer")',
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
					priority: 4011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createForeignKey",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_013d550b_monolayer_fk", ["permission_id"], "permission.user_permissions", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_013d550b_monolayer_fk"`',
							"execute(db);",
						],
					],
					down: [[]],
				},
			];
			await testChangesetAndMigrations({
				context,
				configuration: { schemas: [permission, dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("drop schema", async (context) => {
			await sql`CREATE SCHEMA IF NOT EXISTS "accounts"; COMMENT ON SCHEMA "accounts" IS 'monolayer'`.execute(
				context.kysely,
			);

			await sql`CREATE SCHEMA IF NOT EXISTS "demo"; COMMENT ON SCHEMA "demo" IS 'monolayer'`.execute(
				context.kysely,
			);

			const expected = [
				{
					priority: 6005,
					schemaName: "demo",
					tableName: "none",
					currentTableName: "none",
					type: "dropSchema",
					warnings: [
						{
							code: "D001",
							schema: "demo",
							type: "destructive",
						},
					],
					up: [['await sql`DROP SCHEMA IF EXISTS "demo";`', "execute(db);"]],
					down: [
						['await sql`CREATE SCHEMA IF NOT EXISTS "demo";`', "execute(db);"],
					],
				},
			];

			const accountsSchema = schema({
				name: "accounts",
				tables: {},
			});

			await testChangesetAndMigrations({
				context,
				configuration: { schemas: [accountsSchema] },
				expected,
				down: "empty",
			});
		});
	});

	describe("camel case plugin", () => {
		test<DbContext>("create schema with table", async (context) => {
			const newUsers = table({
				columns: {
					id: integer(),
					permissionId: integer(),
				},
			});

			const dbSchema = schema({
				name: "dbSchema",
				tables: {
					newUsers,
				},
			});

			const expected = [
				{
					currentTableName: "none",
					down: [
						['await sql`DROP SCHEMA IF EXISTS "db_schema";`', "execute(db);"],
					],
					priority: 0,
					schemaName: "db_schema",
					tableName: "none",
					type: "createSchema",
					up: [
						[
							'await sql`CREATE SCHEMA IF NOT EXISTS "db_schema";`',
							"execute(db);",
						],
						[
							"await sql`COMMENT ON SCHEMA \"db_schema\" IS 'monolayer'`",
							"execute(db);",
						],
					],
				},
				{
					currentTableName: "new_users",
					down: [
						[
							'await db.withSchema("db_schema").schema',
							'dropTable("new_users")',
							"execute();",
						],
					],
					priority: 2001,
					schemaName: "db_schema",
					tableName: "new_users",
					type: "createTable",
					up: [
						[
							'await db.withSchema("db_schema").schema',
							'createTable("new_users")',
							'addColumn("id", "integer")',
							'addColumn("permission_id", "integer")',
							"execute();",
						],
					],
				},
			];
			await testChangesetAndMigrations({
				context,
				configuration: {
					schemas: [dbSchema],
					camelCasePlugin: { enabled: true },
				},
				expected,
				down: "same",
			});
		});

		test<DbContext>("create table with foreign key reference to another schema", async (context) => {
			const userPermissions = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const permissionSchema = schema({
				name: "permissionSchema",
				tables: {
					userPermissions,
				},
			});

			const newUsers = table({
				columns: {
					id: integer(),
					permissionId: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(
							["permissionId"],
							permissionSchema.tables.userPermissions,
							["id"],
						)
							.deleteRule("set null")
							.updateRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					newUsers,
				},
			});

			const expected = [
				{
					priority: 0,
					schemaName: "permission_schema",
					tableName: "none",
					currentTableName: "none",
					type: "createSchema",
					up: [
						[
							'await sql`CREATE SCHEMA IF NOT EXISTS "permission_schema";`',
							"execute(db);",
						],
						[
							"await sql`COMMENT ON SCHEMA \"permission_schema\" IS 'monolayer'`",
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`DROP SCHEMA IF EXISTS "permission_schema";`',
							"execute(db);",
						],
					],
				},
				{
					priority: 2001,
					schemaName: "permission_schema",
					tableName: "user_permissions",
					currentTableName: "user_permissions",
					type: "createTable",
					up: [
						[
							'await db.withSchema("permission_schema").schema',
							'createTable("user_permissions")',
							'addColumn("id", "integer")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("permission_schema").schema',
							'dropTable("user_permissions")',
							"execute();",
						],
					],
				},
				{
					priority: 4001,
					schemaName: "permission_schema",
					tableName: "user_permissions",
					currentTableName: "user_permissions",
					type: "createPrimaryKey",
					up: [
						[
							'await db.withSchema("permission_schema").schema',
							'alterTable("user_permissions")',
							'addPrimaryKeyConstraint("user_permissions_monolayer_pk", ["id"])',
							"execute();",
						],
					],
					down: [[]],
				},
				{
					priority: 2001,
					schemaName: "public",
					tableName: "new_users",
					currentTableName: "new_users",
					type: "createTable",
					up: [
						[
							'await db.withSchema("public").schema',
							'createTable("new_users")',
							'addColumn("id", "integer")',
							'addColumn("permission_id", "integer")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropTable("new_users")',
							"execute();",
						],
					],
				},
				{
					priority: 4011,
					schemaName: "public",
					tableName: "new_users",
					currentTableName: "new_users",
					type: "createForeignKey",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("new_users")
    .addForeignKeyConstraint("new_users_0b6e29a8_monolayer_fk", ["permission_id"], "permission_schema.user_permissions", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."new_users" VALIDATE CONSTRAINT "new_users_0b6e29a8_monolayer_fk"`',
							"execute(db);",
						],
					],
					down: [[]],
				},
			];
			await testChangesetAndMigrations({
				context,
				configuration: {
					schemas: [permissionSchema, dbSchema],
					camelCasePlugin: { enabled: true },
				},
				expected,
				down: "same",
			});
		});
	});
});
