/* eslint-disable max-lines */
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { env } from "process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { remoteSchema } from "~/database/introspection/schemas.js";
import { dropTables } from "~tests/helpers/dropTables.js";
import { globalPool, type DbContext } from "~tests/setup.js";

describe("#remoteSchema", () => {
	beforeEach<DbContext>(async (context) => {
		const pool = globalPool();
		await pool.query("DROP DATABASE IF EXISTS test_remote_schema");
		await pool.query("CREATE DATABASE test_remote_schema");
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		context.kysely = new Kysely<any>({
			dialect: new PostgresDialect({
				pool: new pg.Pool({
					connectionString: `${env.POSTGRES_URL}/test_remote_schema?schema=public`,
				}),
			}),
		});
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
			.createType("not_kinetic")
			.asEnum(["failed", "success"])
			.execute();

		await sql`COMMENT ON TYPE status IS 'kinetic'`.execute(kysely);
		await sql`COMMENT ON TYPE role IS 'kinetic'`.execute(kysely);

		await kysely.schema
			.createTable("remote_schema_books")
			.addColumn("id", "serial", (col) => col.primaryKey())
			.addColumn("name", "varchar", (col) => col.unique())
			.addColumn("updated_at", "timestamp", (col) =>
				col.defaultTo(sql`CURRENT_TIMESTAMP`),
			)
			.addColumn("status", sql`status`)
			.execute();

		await kysely.schema
			.createTable("remote_schema_users")
			.addColumn("id", "integer", (col) => col.generatedByDefaultAsIdentity())
			.addColumn("name", "varchar", (col) => col.unique().nullsNotDistinct())
			.addColumn("email", "varchar")
			.addColumn("book_id", "integer")
			.addColumn("updated_at", "timestamp", (col) =>
				col.defaultTo(sql`CURRENT_TIMESTAMP`),
			)
			.addPrimaryKeyConstraint("remote_schema_users_id_kinetic_pk", ["id"])
			.addForeignKeyConstraint(
				"remote_schema_users_book_id_remote_schema_books_id_kinetic_fk",
				["book_id"],
				"remote_schema_books",
				["id"],
			)
			.addUniqueConstraint(
				"remote_schema_users_email_kinetic_key",
				["email"],
				(builder) => builder.nullsNotDistinct(),
			)
			.execute();

		await kysely.schema
			.createIndex("remote_schema_users_name_email_kntc_idx")
			.on("remote_schema_users")
			.columns(["name", "email"])
			.execute();

		await sql`COMMENT ON INDEX remote_schema_users_name_email_kntc_idx IS 'abcd'`.execute(
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

		const expectedSchema = {
			status: "Success",
			result: {
				extensions: {
					btree_gin: true,
					moddatetime: true,
				},
				table: {
					remote_schema_users: {
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
							dataType: "varchar",
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
							dataType: "varchar",
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
							defaultValue: "CURRENT_TIMESTAMP",
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							renameFrom: null,
							tableName: "remote_schema_users",
							enum: false,
						},
					},
					remote_schema_books: {
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
							dataType: "varchar",
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
							defaultValue: "CURRENT_TIMESTAMP",
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
				index: {
					remote_schema_users: {
						remote_schema_users_name_email_kntc_idx:
							"abcd:CREATE INDEX remote_schema_users_name_email_kntc_idx ON public.remote_schema_users USING btree (name, email)",
					},
				},
				uniqueConstraints: {
					remote_schema_users: {
						remote_schema_users_email_kinetic_key:
							'"remote_schema_users_email_kinetic_key" UNIQUE NULLS NOT DISTINCT ("email")',
					},
				},
				foreignKeyConstraints: {
					remote_schema_users: {
						remote_schema_users_book_id_remote_schema_books_id_kinetic_fk:
							'"remote_schema_users_book_id_remote_schema_books_id_kinetic_fk" FOREIGN KEY ("book_id") REFERENCES remote_schema_books ("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
					},
				},
				primaryKey: {
					remote_schema_users: {
						remote_schema_users_id_kinetic_pk:
							'"remote_schema_users_id_kinetic_pk" PRIMARY KEY ("id")',
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
			.addPrimaryKeyConstraint("remoteSchemaUsers_id_kinetic_pk", ["id"])
			.addForeignKeyConstraint(
				"remoteSchemaUsers_book_id_remoteSchemaBooks_id_kinetic_fk",
				["book_id"],
				"remoteSchemaBooks",
				["id"],
			)
			.addUniqueConstraint(
				"remoteSchemaUsers_name_kinetic_key",
				["name"],
				(builder) => builder.nullsNotDistinct(),
			)
			.execute();

		await kysely.schema
			.createIndex("remoteSchemaUsers_name_email_kntc_idx")
			.on("remoteSchemaUsers")
			.columns(["name", "email"])
			.execute();

		await sql`COMMENT ON INDEX "remoteSchemaUsers_name_email_kntc_idx" IS 'abcd'`.execute(
			kysely,
		);

		const expectedSchema = {
			status: "Success",
			result: {
				table: {
					remoteSchemaUsers: {
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
							dataType: "varchar",
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
							dataType: "varchar",
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
					remoteSchemaBooks: {
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
							dataType: "varchar",
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
				index: {
					remoteSchemaUsers: {
						remoteSchemaUsers_name_email_kntc_idx:
							'abcd:CREATE INDEX "remoteSchemaUsers_name_email_kntc_idx" ON public."remoteSchemaUsers" USING btree (name, email)',
					},
				},
				uniqueConstraints: {
					remoteSchemaUsers: {
						remoteSchemaUsers_name_kinetic_key:
							'"remoteSchemaUsers_name_kinetic_key" UNIQUE NULLS NOT DISTINCT ("name")',
					},
				},
				foreignKeyConstraints: {
					remoteSchemaUsers: {
						remoteSchemaUsers_book_id_remoteSchemaBooks_id_kinetic_fk:
							'"remoteSchemaUsers_book_id_remoteSchemaBooks_id_kinetic_fk" FOREIGN KEY ("book_id") REFERENCES remoteSchemaBooks ("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
					},
				},
				primaryKey: {
					remoteSchemaUsers: {
						remoteSchemaUsers_id_kinetic_pk:
							'"remoteSchemaUsers_id_kinetic_pk" PRIMARY KEY ("id")',
					},
				},
				enums: {},
				extensions: {},
				triggers: {},
			},
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
			status: "Success",
			result: {
				table: {
					schema_with_empty_tables_users: {},
					schema_with_empty_tables_books: {
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
							dataType: "varchar",
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
				index: {},
				uniqueConstraints: {},
				foreignKeyConstraints: {},
				primaryKey: {},
				extensions: {},
				triggers: {},
				enums: {},
			},
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
			.addColumn("int2", "int2", (col) => col.defaultTo(sql`'1'::int2`))
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

		const schema = await remoteSchema(kysely);
		if (schema.status === "Error") {
			throw new Error("Error fetching schema");
		}
		const columns = schema.result.table.test_column_default_value;
		const columDefaults = Object.entries(columns || {}).reduce(
			(acc, [key, value]) => {
				acc[key] = value.defaultValue as string;
				return acc;
			},
			{} as Record<string, string>,
		);

		const expected = {
			bigint: "'1'::bigint",
			boolean: "false",
			bytea: "'\\x74727565'::bytea",
			char: "'a'::character(1)",
			char_10: "'abc'::character(1)",
			date: "'1999-01-08'::date",
			double_precision: "'1'::double precision",
			float4: "'1'::real",
			float8: "'1'::double precision",
			int2: "'1'::smallint",
			int4: "1",
			int8: "'1'::bigint",
			integer: "1",
			json: "'1'::json",
			jsonb: "'1'::jsonb",
			numeric: "'1'::numeric",
			real: "'1'::real",
			time: "'04:05:06'::time without time zone",
			timetz: "'04:05:06+00'::time with time zone",
			timestamp: "'2004-10-19 10:23:54'::timestamp without time zone",
			timestamptz: "'2004-10-19 10:23:54+00'::timestamp with time zone",
			text: "'1'::text",
			uuid: "'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid",
			varchar: "'1'::character varying",
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
			.addColumn("int2", "int2")
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
			status: "Success",
			result: {
				extensions: {},
				table: {
					user_native_data_types_test: {
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
						int2: {
							characterMaximumLength: null,
							columnName: "int2",
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
							dataType: "varchar",
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
							dataType: "char(1)",
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
							dataType: "timetz",
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
							dataType: "timestamptz",
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
				index: {},
				uniqueConstraints: {},
				foreignKeyConstraints: {},
				primaryKey: {},
				triggers: {},
				enums: {},
			},
		};

		expect(await remoteSchema(kysely)).toStrictEqual(expectedSchema);
	});
});
