import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { env } from "process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { dropTables } from "~tests/helpers/dropTables.js";
import { type DbContext, globalPool } from "~tests/setup.js";
import { remoteSchema } from "./remote_schema.js";

describe("#remoteSchema", () => {
	beforeEach<DbContext>(async (context) => {
		const pool = globalPool();
		await pool.query("DROP DATABASE IF EXISTS test_remote_schema");
		await pool.query("CREATE DATABASE test_remote_schema");
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
							"remote_schema_users_email_kinetic_key UNIQUE NULLS NOT DISTINCT (email)",
					},
				},
				foreignKeyConstraints: {
					remote_schema_users: {
						remote_schema_users_book_id_remote_schema_books_id_kinetic_fk:
							"remote_schema_users_book_id_remote_schema_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES remote_schema_books (id) ON DELETE NO ACTION ON UPDATE NO ACTION",
					},
				},
				primaryKey: {
					remote_schema_users: {
						remote_schema_users_id_kinetic_pk:
							"remote_schema_users_id_kinetic_pk PRIMARY KEY (id)",
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
});
