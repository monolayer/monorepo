import { Kysely, PostgresDialect } from "kysely";
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

		await kysely.schema
			.createTable("remote_schema_books")
			.addColumn("id", "serial", (col) => col.primaryKey())
			.addColumn("name", "varchar", (col) => col.unique())
			.execute();

		await kysely.schema
			.createTable("remote_schema_users")
			.addColumn("id", "integer", (col) => col.generatedByDefaultAsIdentity())
			.addColumn("name", "varchar")
			.addColumn("email", "varchar")
			.addColumn("book_id", "integer")
			.addPrimaryKeyConstraint("remote_schema_users_id_kinetic_pk", ["id"])
			.addForeignKeyConstraint(
				"remote_schema_users_book_id_remote_schema_books_id_kinetic_fk",
				["book_id"],
				"remote_schema_books",
				["id"],
			)
			.addUniqueConstraint(
				"remote_schema_users_name_kinetic_key",
				["name"],
				(builder) => builder.nullsNotDistinct(),
			)
			.execute();

		await kysely.schema
			.createIndex("remote_schema_users_name_email_kinetic_idx")
			.on("remote_schema_users")
			.columns(["name", "email"])
			.execute();

		const expectedSchema = {
			status: "Success",
			result: {
				table: {
					remote_schema_users: {
						id: {
							characterMaximumLength: null,
							columnName: "id",
							dataType: "integer",
							datetimePrecision: null,
							defaultValue: null,
							foreignKeyConstraint: null,
							identity: "BY DEFAULT",
							isNullable: false,
							numericPrecision: null,
							numericScale: null,
							primaryKey: true,
							renameFrom: null,
							tableName: "remote_schema_users",
							unique: null,
						},
						name: {
							characterMaximumLength: null,
							columnName: "name",
							dataType: "varchar",
							datetimePrecision: null,
							defaultValue: null,
							foreignKeyConstraint: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							primaryKey: null,
							renameFrom: null,
							tableName: "remote_schema_users",
							unique: "NullsNotDistinct",
						},
						book_id: {
							characterMaximumLength: null,
							columnName: "book_id",
							dataType: "integer",
							datetimePrecision: null,
							defaultValue: null,
							foreignKeyConstraint: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							primaryKey: null,
							renameFrom: null,
							tableName: "remote_schema_users",
							unique: null,
						},
						email: {
							characterMaximumLength: null,
							columnName: "email",
							dataType: "varchar",
							datetimePrecision: null,
							defaultValue: null,
							foreignKeyConstraint: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							primaryKey: null,
							renameFrom: null,
							tableName: "remote_schema_users",
							unique: null,
						},
					},
					remote_schema_books: {
						id: {
							characterMaximumLength: null,
							columnName: "id",
							dataType: "serial",
							datetimePrecision: null,
							defaultValue: null,
							foreignKeyConstraint: null,
							identity: null,
							isNullable: false,
							numericPrecision: null,
							numericScale: null,
							primaryKey: true,
							renameFrom: null,
							tableName: "remote_schema_books",
							unique: null,
						},
						name: {
							characterMaximumLength: null,
							columnName: "name",
							dataType: "varchar",
							datetimePrecision: null,
							defaultValue: null,
							foreignKeyConstraint: null,
							identity: null,
							isNullable: true,
							numericPrecision: null,
							numericScale: null,
							primaryKey: null,
							renameFrom: null,
							tableName: "remote_schema_books",
							unique: "NullsDistinct",
						},
					},
				},
				index: {
					remote_schema_users: {
						remote_schema_users_name_email_kinetic_idx:
							"CREATE INDEX remote_schema_users_name_email_kinetic_idx ON public.remote_schema_users USING btree (name, email)",
					},
				},
				uniqueConstraints: {
					remote_schema_users: {
						remote_schema_users_name_kinetic_key:
							"CONSTRAINT remote_schema_users_name_kinetic_key UNIQUE NULLS NOT DISTINCT (name)",
					},
				},
				foreignKeyConstraints: {
					remote_schema_users: {
						remote_schema_users_book_id_remote_schema_books_id_kinetic_fk:
							"CONSTRAINT remote_schema_users_book_id_remote_schema_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES remote_schema_books (id) ON DELETE NO ACTION ON UPDATE NO ACTION",
					},
				},
				primaryKey: {
					remote_schema_users: {
						remote_schema_users_id_kinetic_pk:
							"CONSTRAINT remote_schema_users_id_kinetic_pk PRIMARY KEY (id)",
					},
				},
			},
		};

		expect(await remoteSchema(kysely)).toStrictEqual(expectedSchema);
	});
});
