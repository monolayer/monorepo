/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { remoteSchema } from "~/introspection/introspection.js";
import { dropTables } from "~tests/__setup__/helpers/drop-tables.js";
import {
	kyselyWithCustomDB,
	type DbContext,
} from "~tests/__setup__/helpers/kysely.js";
import { globalPool } from "~tests/__setup__/setup.js";

describe("#remoteSchema", () => {
	beforeEach<DbContext>(async (context) => {
		const pool = globalPool();
		await pool.query("DROP DATABASE IF EXISTS test_remote_schema");
		await pool.query("CREATE DATABASE test_remote_schema");
		context.kysely = await kyselyWithCustomDB("test_remote_schema");
		context.tableNames = [];
		await dropTables(context);
	});

	afterEach<DbContext>(async (context) => {
		await dropTables(context);
		await context.kysely.destroy();
		const pool = globalPool();
		await pool.query("DROP DATABASE IF EXISTS test_remote_schema");
	});

	test<DbContext>("returns schema from database", async ({
		tableNames,
		kysely,
	}) => {
		tableNames.push("remote_schema_users");
		tableNames.push("remote_schema_books");

		await sql`CREATE EXTENSION moddatetime`.execute(kysely);
		await sql`CREATE EXTENSION btree_gin`.execute(kysely);

		await kysely.schema
			.createType("status")
			.asEnum(["failed", "success"])
			.execute();

		await kysely.schema
			.createType("role")
			.asEnum(["user", "admin", "superuser"])
			.execute();

		await kysely.schema
			.createType("not_yount")
			.asEnum(["failed", "success"])
			.execute();

		await sql`COMMENT ON TYPE status IS 'yount'`.execute(kysely);
		await sql`COMMENT ON TYPE role IS 'yount'`.execute(kysely);

		await kysely.schema
			.createTable("remote_schema_books")
			.addColumn("id", "serial", (col) => col.primaryKey())
			.addColumn("name", "varchar", (col) => col.unique())
			.addColumn("updated_at", "timestamp", (col) => col.defaultTo(sql`now()`))
			.addColumn("status", sql`status`)
			.execute();

		await sql`COMMENT ON COLUMN "remote_schema_books"."updated_at" IS '28a4dae0461e17af56e979c2095abfbe0bfc45fe9ca8abf3144338a518a1bb8f'`.execute(
			kysely,
		);
		await kysely.schema
			.createTable("remote_schema_users")
			.addColumn("id", "integer", (col) => col.generatedByDefaultAsIdentity())
			.addColumn("name", "varchar", (col) => col.unique().nullsNotDistinct())
			.addColumn("email", "varchar")
			.addColumn("book_id", "integer")
			.addColumn("updated_at", "timestamp", (col) =>
				col.defaultTo(sql`CURRENT_TIMESTAMP`),
			)
			.addPrimaryKeyConstraint("remote_schema_users_id_yount_pk", ["id"])
			.addForeignKeyConstraint(
				"remote_schema_users_book_id_remote_schema_books_id_yount_fk",
				["book_id"],
				"remote_schema_books",
				["id"],
			)
			.addUniqueConstraint(
				"remote_schema_users_email_yount_key",
				["email"],
				(builder) => builder.nullsNotDistinct(),
			)
			.execute();

		await sql`COMMENT ON COLUMN "remote_schema_users"."updated_at" IS '9ff7b5b715046baeffdb1af30ed68f6e43b40bf43d1f76734de5b26ecacb58e8'`.execute(
			kysely,
		);

		await kysely.schema
			.createIndex("remote_schema_users_name_email_yount_idx")
			.on("remote_schema_users")
			.columns(["name", "email"])
			.execute();

		await sql`COMMENT ON INDEX remote_schema_users_name_email_yount_idx IS 'abcd'`.execute(
			kysely,
		);

		await sql`
      CREATE TRIGGER updated_at_remote_schema_users_trg
        BEFORE UPDATE ON remote_schema_users
        FOR EACH ROW
        EXECUTE PROCEDURE moddatetime (updated_at);
    `.execute(kysely);

		await sql`
      CREATE TRIGGER updated_at_remote_schema_books_trg
        BEFORE UPDATE ON remote_schema_books
        FOR EACH ROW
        EXECUTE PROCEDURE moddatetime (updated_at);
    `.execute(kysely);

		await sql`
      COMMENT ON TRIGGER updated_at_remote_schema_users_trg ON remote_schema_users IS '1234';
      COMMENT ON TRIGGER updated_at_remote_schema_books_trg ON remote_schema_books IS 'abcd';
    `.execute(kysely);

		await kysely.schema
			.alterTable("remote_schema_users")
			.addCheckConstraint("book_id_yount_chk", sql`book_id > 5`)
			.execute();

		await sql`COMMENT ON CONSTRAINT "book_id_yount_chk" ON "remote_schema_users" IS 'abcd'`.execute(
			kysely,
		);

		const expectedSchema = {
			table: {
				remote_schema_users: {
					name: "remote_schema_users",
					columns: {
						id: {
							characterMaximumLength: null,
							columnName: "id",
							dataType: "integer",
							datetimePrecision: null,
							defaultValue: null,
							identity: "BY DEFAULT",
							isNullable: false,
							numericPrecision: null,
							numericScale: null,

							renameFrom: null,
							tableName: "remote_schema_users",
							enum: false,
						},
						name: {
							characterMaximumLength: null,
							columnName: "name",
							dataType: "character varying",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "remote_schema_users",
							enum: false,
						},
						book_id: {
							characterMaximumLength: null,
							columnName: "book_id",
							dataType: "integer",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "remote_schema_users",
							enum: false,
						},
						email: {
							characterMaximumLength: null,
							columnName: "email",
							dataType: "character varying",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "remote_schema_users",
							enum: false,
						},
						updated_at: {
							characterMaximumLength: null,
							columnName: "updated_at",
							dataType: "timestamp",
							datetimePrecision: null,
							defaultValue:
								"9ff7b5b715046baeffdb1af30ed68f6e43b40bf43d1f76734de5b26ecacb58e8:CURRENT_TIMESTAMP",
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "remote_schema_users",
							enum: false,
						},
					},
				},
				remote_schema_books: {
					name: "remote_schema_books",
					columns: {
						id: {
							characterMaximumLength: null,
							columnName: "id",
							dataType: "serial",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: false,
							numericPrecision: null,
							numericScale: null,

							renameFrom: null,
							tableName: "remote_schema_books",
							enum: false,
						},
						name: {
							characterMaximumLength: null,
							columnName: "name",
							dataType: "character varying",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "remote_schema_books",
							enum: false,
						},
						updated_at: {
							characterMaximumLength: null,
							columnName: "updated_at",
							dataType: "timestamp",
							datetimePrecision: null,
							defaultValue:
								"28a4dae0461e17af56e979c2095abfbe0bfc45fe9ca8abf3144338a518a1bb8f:now()",
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "remote_schema_books",
							enum: false,
						},
						status: {
							characterMaximumLength: null,
							columnName: "status",
							dataType: "status",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "remote_schema_books",
							enum: true,
						},
					},
				},
			},
			index: {
				remote_schema_users: {
					remote_schema_users_name_email_yount_idx:
						"abcd:CREATE INDEX remote_schema_users_name_email_yount_idx ON public.remote_schema_users USING btree (name, email)",
				},
			},
			uniqueConstraints: {
				remote_schema_users: {
					remote_schema_users_email_yount_key:
						'"remote_schema_users_email_yount_key" UNIQUE NULLS NOT DISTINCT ("email")',
				},
			},
			foreignKeyConstraints: {
				remote_schema_users: {
					remote_schema_users_d0466f3b_yount_fk:
						'"remote_schema_users_d0466f3b_yount_fk" FOREIGN KEY ("book_id") REFERENCES remote_schema_books ("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
				},
			},
			checkConstraints: {
				remote_schema_users: {
					book_id_yount_chk: "abcd:CHECK ((book_id > 5))",
				},
			},

			primaryKey: {
				remote_schema_users: {
					remote_schema_users_yount_pk:
						'"remote_schema_users_yount_pk" PRIMARY KEY ("id")',
				},
			},
			triggers: {
				remote_schema_books: {
					updated_at_remote_schema_books_trg:
						"abcd:CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at')",
				},
				remote_schema_users: {
					updated_at_remote_schema_users_trg:
						"1234:CREATE TRIGGER updated_at_remote_schema_users_trg BEFORE UPDATE ON public.remote_schema_users FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at')",
				},
			},
			enums: {
				role: "admin, superuser, user",
				status: "failed, success",
			},
		};

		expect(await remoteSchema(kysely)).toStrictEqual(expectedSchema);
	});

	test<DbContext>("returns schema from database with camel-cased tables", async ({
		tableNames,
		kysely,
	}) => {
		tableNames.push("remoteSchemaUsers");
		tableNames.push("remoteSchemaBooks");

		await kysely.schema
			.createTable("remoteSchemaBooks")
			.addColumn("id", "serial", (col) => col.primaryKey())
			.addColumn("name", "varchar", (col) => col.unique())
			.execute();

		await kysely.schema
			.createTable("remoteSchemaUsers")
			.addColumn("id", "integer", (col) => col.generatedByDefaultAsIdentity())
			.addColumn("name", "varchar")
			.addColumn("email", "varchar")
			.addColumn("book_id", "integer")
			.addPrimaryKeyConstraint("remoteSchemaUsers_id_yount_pk", ["id"])
			.addForeignKeyConstraint(
				"remoteSchemaUsers_book_id_remoteSchemaBooks_id_yount_fk",
				["book_id"],
				"remoteSchemaBooks",
				["id"],
			)
			.addUniqueConstraint(
				"remoteSchemaUsers_name_yount_key",
				["name"],
				(builder) => builder.nullsNotDistinct(),
			)
			.execute();

		await kysely.schema
			.createIndex("remoteSchemaUsers_name_email_yount_idx")
			.on("remoteSchemaUsers")
			.columns(["name", "email"])
			.execute();

		await sql`COMMENT ON INDEX "remoteSchemaUsers_name_email_yount_idx" IS 'abcd'`.execute(
			kysely,
		);

		const expectedSchema = {
			table: {
				remoteSchemaUsers: {
					name: "remoteSchemaUsers",
					columns: {
						id: {
							characterMaximumLength: null,
							columnName: "id",
							dataType: "integer",
							datetimePrecision: null,
							defaultValue: null,
							identity: "BY DEFAULT",
							isNullable: false,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "remoteSchemaUsers",
							enum: false,
						},
						name: {
							characterMaximumLength: null,
							columnName: "name",
							dataType: "character varying",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "remoteSchemaUsers",
							enum: false,
						},
						book_id: {
							characterMaximumLength: null,
							columnName: "book_id",
							dataType: "integer",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "remoteSchemaUsers",
							enum: false,
						},
						email: {
							characterMaximumLength: null,
							columnName: "email",
							dataType: "character varying",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "remoteSchemaUsers",
							enum: false,
						},
					},
				},
				remoteSchemaBooks: {
					name: "remoteSchemaBooks",
					columns: {
						id: {
							characterMaximumLength: null,
							columnName: "id",
							dataType: "serial",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: false,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "remoteSchemaBooks",
							enum: false,
						},
						name: {
							characterMaximumLength: null,
							columnName: "name",
							dataType: "character varying",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "remoteSchemaBooks",
							enum: false,
						},
					},
				},
			},
			index: {
				remoteSchemaUsers: {
					remoteSchemaUsers_name_email_yount_idx:
						'abcd:CREATE INDEX "remoteSchemaUsers_name_email_yount_idx" ON public."remoteSchemaUsers" USING btree (name, email)',
				},
			},
			uniqueConstraints: {
				remoteSchemaUsers: {
					remoteSchemaUsers_name_yount_key:
						'"remoteSchemaUsers_name_yount_key" UNIQUE NULLS NOT DISTINCT ("name")',
				},
			},
			checkConstraints: {},
			foreignKeyConstraints: {
				remoteSchemaUsers: {
					remoteSchemaUsers_5aa711d0_yount_fk:
						'"remoteSchemaUsers_5aa711d0_yount_fk" FOREIGN KEY ("book_id") REFERENCES remoteSchemaBooks ("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
				},
			},
			primaryKey: {
				remoteSchemaUsers: {
					remoteSchemaUsers_yount_pk:
						'"remoteSchemaUsers_yount_pk" PRIMARY KEY ("id")',
				},
			},
			enums: {},
			triggers: {},
		};

		expect(await remoteSchema(kysely)).toStrictEqual(expectedSchema);
	});

	test<DbContext>("returns schema with empty tables", async ({
		tableNames,
		kysely,
	}) => {
		tableNames.push("schema_with_empty_tables_users");
		tableNames.push("schema_with_empty_tables_books");

		await kysely.schema
			.createTable("schema_with_empty_tables_books")
			.addColumn("id", "serial", (col) => col.primaryKey())
			.addColumn("name", "varchar", (col) => col.unique())
			.execute();

		await kysely.schema.createTable("schema_with_empty_tables_users").execute();

		const expectedSchema = {
			table: {
				schema_with_empty_tables_users: {
					name: "schema_with_empty_tables_users",
					columns: {},
				},
				schema_with_empty_tables_books: {
					name: "schema_with_empty_tables_books",
					columns: {
						id: {
							characterMaximumLength: null,
							columnName: "id",
							dataType: "serial",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: false,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "schema_with_empty_tables_books",
							enum: false,
						},
						name: {
							characterMaximumLength: null,
							columnName: "name",
							dataType: "character varying",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "schema_with_empty_tables_books",
							enum: false,
						},
					},
				},
			},
			index: {},
			uniqueConstraints: {},
			foreignKeyConstraints: {},
			checkConstraints: {},
			primaryKey: {},
			triggers: {},
			enums: {},
		};

		expect(await remoteSchema(kysely)).toStrictEqual(expectedSchema);
	});

	test<DbContext>("column default value casts", async ({
		tableNames,
		kysely,
	}) => {
		tableNames.push("test_column_default_value");

		await kysely.schema
			.createTable("test_column_default_value")
			.addColumn("bigint", "bigint", (col) => col.defaultTo(sql`'1'::bigint`))
			.addColumn("boolean", "boolean", (col) =>
				col.defaultTo(sql`'false'::boolean`),
			)
			.addColumn("bytea", "bytea", (col) =>
				col.defaultTo(sql`'\\x74727565'::bytea`),
			)
			.addColumn("char", "char", (col) => col.defaultTo(sql`'a'::char`))
			.addColumn("char_10", "char(10)", (col) =>
				col.defaultTo(sql`'abc'::char`),
			)
			.addColumn("date", "date", (col) =>
				col.defaultTo(sql`'January 8, 1999'::date`),
			)
			.addColumn("double_precision", "double precision", (col) =>
				col.defaultTo(sql`'1'::double precision`),
			)
			.addColumn("float4", "float4", (col) => col.defaultTo(sql`'1'::float4`))
			.addColumn("float8", "float8", (col) => col.defaultTo(sql`'1'::float8`))
			.addColumn("smallint", "smallint", (col) =>
				col.defaultTo(sql`'1'::smallint`),
			)
			.addColumn("int4", "int4", (col) => col.defaultTo(sql`'1'::int4`))
			.addColumn("int8", "int8", (col) => col.defaultTo(sql`'1'::bigint`))
			.addColumn("integer", "integer", (col) =>
				col.defaultTo(sql`'1'::integer`),
			)
			.addColumn("json", "json", (col) => col.defaultTo(sql`'1'::json`))
			.addColumn("jsonb", "jsonb", (col) => col.defaultTo(sql`'1'::jsonb`))
			.addColumn("numeric", "numeric", (col) =>
				col.defaultTo(sql`'1'::numeric`),
			)
			.addColumn("real", "real", (col) => col.defaultTo(sql`'1'::real`))
			.addColumn("time", "time", (col) =>
				col.defaultTo(sql`'04:05:06'::time without time zone`),
			)
			.addColumn("timetz", "timetz", (col) =>
				col.defaultTo(sql`'04:05:06'::time with time zone`),
			)
			.addColumn("timestamp", "timestamp", (col) =>
				col.defaultTo(sql`'2004-10-19 10:23:54'::timestamp without time zone`),
			)
			.addColumn("timestamptz", "timestamptz", (col) =>
				col.defaultTo(sql`'2004-10-19 10:23:54'::timestamp with time zone`),
			)
			.addColumn("text", "text", (col) => col.defaultTo(sql`'1'::text`))
			.addColumn("uuid", "uuid", (col) =>
				col.defaultTo(sql`'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'::uuid`),
			)
			.addColumn("varchar", "varchar", (col) =>
				col.defaultTo(sql`'1'::character varying`),
			)
			.execute();

		await sql`COMMENT ON COLUMN "test_column_default_value"."bigint" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."boolean" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."bytea" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."char" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."char_10" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."date" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."double_precision" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."bigint" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."float4" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."float8" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."smallint" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."int4" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."int8" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."integer" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."json" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."jsonb" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."numeric" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."real" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."time" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."timetz" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."timestamp" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."timestamptz" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."text" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."uuid" IS 'abcd'`.execute(
			kysely,
		);
		await sql`COMMENT ON COLUMN "test_column_default_value"."varchar" IS 'abcd'`.execute(
			kysely,
		);

		const schema = await remoteSchema(kysely);
		const columns = schema.table.test_column_default_value!.columns;
		const columDefaults = Object.entries(columns || {}).reduce(
			(acc, [key, value]) => {
				acc[key] = value.defaultValue as string;
				return acc;
			},
			{} as Record<string, string>,
		);

		const expected = {
			bigint: "abcd:'1'::bigint",
			boolean: "abcd:false",
			bytea: "abcd:'\\x74727565'::bytea",
			char: "abcd:'a'::character(1)",
			char_10: "abcd:'abc'::character(1)",
			date: "abcd:'1999-01-08'::date",
			double_precision: "abcd:'1'::double precision",
			float4: "abcd:'1'::real",
			float8: "abcd:'1'::double precision",
			smallint: "abcd:'1'::smallint",
			int4: "abcd:1",
			int8: "abcd:'1'::bigint",
			integer: "abcd:1",
			json: "abcd:'1'::json",
			jsonb: "abcd:'1'::jsonb",
			numeric: "abcd:'1'::numeric",
			real: "abcd:'1'::real",
			time: "abcd:'04:05:06'::time without time zone",
			timetz: "abcd:'04:05:06+00'::time with time zone",
			timestamp: "abcd:'2004-10-19 10:23:54'::timestamp without time zone",
			timestamptz: "abcd:'2004-10-19 10:23:54+00'::timestamp with time zone",
			text: "abcd:'1'::text",
			uuid: "abcd:'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid",
			varchar: "abcd:'1'::character varying",
		};
		expect(columDefaults).toStrictEqual(expected);
	});

	test<DbContext>("use native column data types", async ({
		tableNames,
		kysely,
	}) => {
		tableNames.push("user_native_data_types_test");

		await kysely.schema
			.createTable("user_native_data_types_test")
			.addColumn("bigint", "bigint")
			.addColumn("char", "char")
			.addColumn("doublePrecision", "double precision")
			.addColumn("smallint", "smallint")
			.addColumn("int4", "int4")
			.addColumn("int8", "int8")
			.addColumn("integer", "integer")
			.addColumn("float4", "float4")
			.addColumn("float8", "float8")
			.addColumn("timetz", "timetz")
			.addColumn("timestamptz", "timestamptz")
			.addColumn("varchar", "varchar")
			.execute();

		const expectedSchema = {
			table: {
				user_native_data_types_test: {
					name: "user_native_data_types_test",
					columns: {
						bigint: {
							characterMaximumLength: null,
							columnName: "bigint",
							dataType: "bigint",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "user_native_data_types_test",
							enum: false,
						},
						doublePrecision: {
							characterMaximumLength: null,
							columnName: "doublePrecision",
							dataType: "double precision",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "user_native_data_types_test",
							enum: false,
						},
						integer: {
							characterMaximumLength: null,
							columnName: "integer",
							dataType: "integer",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "user_native_data_types_test",
							enum: false,
						},
						float4: {
							characterMaximumLength: null,
							columnName: "float4",
							dataType: "real",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "user_native_data_types_test",
							enum: false,
						},
						float8: {
							characterMaximumLength: null,
							columnName: "float8",
							dataType: "double precision",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "user_native_data_types_test",
							enum: false,
						},
						smallint: {
							characterMaximumLength: null,
							columnName: "smallint",
							dataType: "smallint",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "user_native_data_types_test",
							enum: false,
						},
						int4: {
							characterMaximumLength: null,
							columnName: "int4",
							dataType: "integer",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "user_native_data_types_test",
							enum: false,
						},
						int8: {
							characterMaximumLength: null,
							columnName: "int8",
							dataType: "bigint",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "user_native_data_types_test",
							enum: false,
						},
						varchar: {
							characterMaximumLength: null,
							columnName: "varchar",
							dataType: "character varying",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "user_native_data_types_test",
							enum: false,
						},
						char: {
							characterMaximumLength: 1,
							columnName: "char",
							dataType: "character(1)",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "user_native_data_types_test",
							enum: false,
						},
						timetz: {
							characterMaximumLength: null,
							columnName: "timetz",
							dataType: "time with time zone",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "user_native_data_types_test",
							enum: false,
						},
						timestamptz: {
							characterMaximumLength: null,
							columnName: "timestamptz",
							dataType: "timestamp with time zone",
							datetimePrecision: null,
							defaultValue: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "user_native_data_types_test",
							enum: false,
						},
					},
				},
			},
			index: {},
			uniqueConstraints: {},
			foreignKeyConstraints: {},
			checkConstraints: {},
			primaryKey: {},
			triggers: {},
			enums: {},
		};

		expect(await remoteSchema(kysely)).toStrictEqual(expectedSchema);
	});
});
