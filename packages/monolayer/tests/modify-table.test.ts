/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { extension } from "~/database/extension/extension.js";
import { schema } from "~/database/schema/schema.js";
import { varchar } from "~/database/schema/table/column/data-types/character-varying.js";
import { integer } from "~/database/schema/table/column/data-types/integer.js";
import { serial } from "~/database/schema/table/column/data-types/serial.js";
import { text } from "~/database/schema/table/column/data-types/text.js";
import { timestamp } from "~/database/schema/table/column/data-types/timestamp.js";
import { check } from "~/database/schema/table/constraints/check/check.js";
import { foreignKey } from "~/database/schema/table/constraints/foreign-key/foreign-key.js";
import { primaryKey } from "~/database/schema/table/constraints/primary-key/primary-key.js";
import { unique } from "~/database/schema/table/constraints/unique/unique.js";
import { index } from "~/database/schema/table/index/index.js";
import { table } from "~/database/schema/table/table.js";
import { trigger } from "~/database/schema/table/trigger/trigger.js";
import { bigserial, timestamptz } from "~/pg.js";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "./__setup__/helpers/test-context.js";

describe("Modify table", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	describe("primary keys", () => {
		test<DbContext>("add", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.createTable("books")
				.addColumn("name", "text")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["fullName", "name"]),
				},
			});

			const books = table({
				columns: {
					name: text().notNull(),
				},
				constraints: {
					primaryKey: primaryKey(["name"]),
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					books,
				},
			});

			const expected = [
				{
					priority: 3011,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "changeColumn",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("books")
    .addCheckConstraint("temporary_not_null_check_constraint", sql\`"name" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'alterColumn("name", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumn",
					up: [],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("fullName", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumn",
					up: [],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_pkey_idx" on "public"."users" ("fullName", "name")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createIndex",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "books_pkey_idx" on "public"."books" ("name")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("books_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createPrimaryKey",
					up: [
						[
							"await sql`${sql.raw(\n" +
								"  db\n" +
								'    .withSchema("public")\n' +
								'    .schema.alterTable("users")\n' +
								'    .addCheckConstraint("fullName_temporary_not_null_check_constraint", sql`"fullName" IS NOT NULL`)\n' +
								"    .compile()\n" +
								'    .sql.concat(" not valid")\n' +
								")}`.execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "fullName_temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							"await sql`${sql.raw(\n" +
								"  db\n" +
								'    .withSchema("public")\n' +
								'    .schema.alterTable("users")\n' +
								'    .addCheckConstraint("name_temporary_not_null_check_constraint", sql`"name" IS NOT NULL`)\n' +
								"    .compile()\n" +
								'    .sql.concat(" not valid")\n' +
								")}`.execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "name_temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await sql`alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("fullName_temporary_not_null_check_constraint")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("name_temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createPrimaryKey",
					up: [
						[
							"await sql`${sql.raw(\n" +
								"  db\n" +
								'    .withSchema("public")\n' +
								'    .schema.alterTable("books")\n' +
								'    .addCheckConstraint("name_temporary_not_null_check_constraint", sql`"name" IS NOT NULL`)\n' +
								"    .compile()\n" +
								'    .sql.concat(" not valid")\n' +
								")}`.execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "name_temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await sql`alter table "public"."books" add constraint "books_pkey" primary key using index "books_pkey_idx"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("name_temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
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

		test<DbContext>("drop", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_pkey", ["name", "fullName"])
				.execute();

			await context.kysely.schema
				.createTable("books")
				.addColumn("name", "text")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_pkey", ["name"])
				.execute();

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
			});

			const books = table({
				columns: {
					name: text(),
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					books,
				},
			});

			const expected = [
				{
					priority: 1004,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addPrimaryKeyConstraint("books_pkey", ["name"])',
							"execute();",
						],
					],
				},
				{
					priority: 1004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addPrimaryKeyConstraint("users_pkey", ["fullName", "name"])',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("fullName", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("change", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_pkey", ["name", "fullName"])
				.execute();

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("description", sql`character varying(255)`, (col) =>
					col.notNull(),
				)
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_pkey", ["description", "id"])
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
				.execute();

			const books = table({
				columns: {
					id: integer(),
					description: varchar(255).notNull(),
				},
				constraints: {
					primaryKey: primaryKey(["description"]),
					unique: [unique(["id"])],
				},
			});

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["name"]),
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					books,
				},
			});

			const expected = [
				{
					priority: 1004,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addPrimaryKeyConstraint("books_pkey", ["description", "id"])',
							"execute();",
						],
					],
				},
				{
					priority: 1004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addPrimaryKeyConstraint("users_pkey", ["fullName", "name"])',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'alterColumn("id", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumn",
					up: [],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("fullName", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createIndex",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "books_pkey_idx" on "public"."books" ("description")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("books_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_pkey_idx" on "public"."users" ("name")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createPrimaryKey",
					up: [
						[
							"await sql`${sql.raw(\n" +
								"  db\n" +
								'    .withSchema("public")\n' +
								'    .schema.alterTable("books")\n' +
								'    .addCheckConstraint("description_temporary_not_null_check_constraint", sql`"description" IS NOT NULL`)\n' +
								"    .compile()\n" +
								'    .sql.concat(" not valid")\n' +
								")}`.execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "description_temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await sql`alter table "public"."books" add constraint "books_pkey" primary key using index "books_pkey_idx"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("description_temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createPrimaryKey",
					up: [
						[
							"await sql`${sql.raw(\n" +
								"  db\n" +
								'    .withSchema("public")\n' +
								'    .schema.alterTable("users")\n' +
								'    .addCheckConstraint("name_temporary_not_null_check_constraint", sql`"name" IS NOT NULL`)\n' +
								"    .compile()\n" +
								'    .sql.concat(" not valid")\n' +
								")}`.execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "name_temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await sql`alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("name_temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
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

		test<DbContext>("change camel case", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("full_name", "text")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_pkey", ["name", "full_name"])
				.execute();

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", sql`character varying(255)`, (col) =>
					col.notNull(),
				)
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_pkey", ["location_id", "id"])
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
				.execute();

			const books = table({
				columns: {
					id: integer(),
					locationId: varchar(255).notNull(),
				},
				constraints: {
					primaryKey: primaryKey(["locationId"]),
					unique: [unique(["id"])],
				},
			});

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["name"]),
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					books,
				},
			});

			const expected = [
				{
					priority: 1004,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])',
							"execute();",
						],
					],
				},
				{
					priority: 1004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addPrimaryKeyConstraint("users_pkey", ["full_name", "name"])',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'alterColumn("id", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumn",
					up: [],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("full_name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createIndex",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "books_pkey_idx" on "public"."books" ("location_id")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("books_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_pkey_idx" on "public"."users" ("name")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createPrimaryKey",
					up: [
						[
							"await sql`${sql.raw(\n" +
								"  db\n" +
								'    .withSchema("public")\n' +
								'    .schema.alterTable("books")\n' +
								'    .addCheckConstraint("location_id_temporary_not_null_check_constraint", sql`"location_id" IS NOT NULL`)\n' +
								"    .compile()\n" +
								'    .sql.concat(" not valid")\n' +
								")}`.execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "location_id_temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await sql`alter table "public"."books" add constraint "books_pkey" primary key using index "books_pkey_idx"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("location_id_temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createPrimaryKey",
					up: [
						[
							"await sql`${sql.raw(\n" +
								"  db\n" +
								'    .withSchema("public")\n' +
								'    .schema.alterTable("users")\n' +
								'    .addCheckConstraint("name_temporary_not_null_check_constraint", sql`"name" IS NOT NULL`)\n' +
								"    .compile()\n" +
								'    .sql.concat(" not valid")\n' +
								")}`.execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "name_temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await sql`alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("name_temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
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

		test<DbContext>("change with column notNull on affected columns does not remove not null constraint", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_pkey", ["name", "fullName"])
				.execute();

			const users = table({
				columns: {
					fullName: text().notNull(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["name"]),
				},
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 1004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addPrimaryKeyConstraint("users_pkey", ["fullName", "name"])',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumn",
					up: [],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_pkey_idx" on "public"."users" ("name")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createPrimaryKey",
					up: [
						[
							"await sql`${sql.raw(\n" +
								"  db\n" +
								'    .withSchema("public")\n' +
								'    .schema.alterTable("users")\n' +
								'    .addCheckConstraint("name_temporary_not_null_check_constraint", sql`"name" IS NOT NULL`)\n' +
								"    .compile()\n" +
								'    .sql.concat(" not valid")\n' +
								")}`.execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "name_temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await sql`alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("name_temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
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

		test<DbContext>("change drops not null on affected columns with explicit notNull in new primary key", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("email", "text")
				.addColumn("name", "text")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_pkey", ["name"])
				.execute();

			const users = table({
				columns: {
					name: text(),
					email: text().notNull(),
				},
				constraints: {
					primaryKey: primaryKey(["email"]),
				},
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 1004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropPrimaryKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addPrimaryKeyConstraint("users_pkey", ["name"])',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumn",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint", sql\`"email" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("email", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("email", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_pkey_idx" on "public"."users" ("email")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createPrimaryKey",
					up: [
						[
							"await sql`${sql.raw(\n" +
								"  db\n" +
								'    .withSchema("public")\n' +
								'    .schema.alterTable("users")\n' +
								'    .addCheckConstraint("email_temporary_not_null_check_constraint", sql`"email" IS NOT NULL`)\n' +
								"    .compile()\n" +
								'    .sql.concat(" not valid")\n' +
								")}`.execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "email_temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await sql`alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("email_temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
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
	});

	describe("foreign keys", () => {
		test<DbContext>("add", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("name", "varchar")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
					name: varchar(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["id"], books, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
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
					priority: 2003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("book_id", "integer")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("book_id")',
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
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_8abc8e0b_monolayer_fk")',
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

		test<DbContext>("add multiple", async (context) => {
			await context.kysely.schema
				.createTable("old_books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("old_books")
				.addPrimaryKeyConstraint("old_books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("name", "varchar")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const old_books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
					second_book_id: integer(),
					name: varchar(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["id"], books, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
						foreignKey(["second_book_id"], old_books, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					old_books,
					users,
				},
			});

			const expected = [
				{
					priority: 2003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("book_id", "integer")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 2003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("second_book_id", "integer")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("second_book_id")',
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
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_8abc8e0b_monolayer_fk")',
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
    .addForeignKeyConstraint("users_ea23dc14_monolayer_fk", ["second_book_id"], "public.old_books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_ea23dc14_monolayer_fk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_ea23dc14_monolayer_fk")',
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

		test<DbContext>("drop", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_58e6ca22_monolayer_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
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
					priority: 810,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropForeignKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_58e6ca22_monolayer_fk")',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_58e6ca22_monolayer_fk", ["book_id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_58e6ca22_monolayer_fk"`',
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

		test<DbContext>("drop multiple", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("old_books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("old_books")
				.addPrimaryKeyConstraint("old_books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("book_id", "integer")
				.addColumn("old_book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_58e6ca22_monolayer_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_8875a5c8_monolayer_fk",
					["old_book_id"],
					"old_books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const old_books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
					old_book_id: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					old_books,
					users,
				},
			});

			const expected = [
				{
					priority: 810,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropForeignKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_58e6ca22_monolayer_fk")',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_58e6ca22_monolayer_fk", ["book_id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_58e6ca22_monolayer_fk"`',
							"execute(db);",
						],
					],
				},
				{
					priority: 810,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropForeignKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_8875a5c8_monolayer_fk")',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_8875a5c8_monolayer_fk", ["old_book_id"], "public.old_books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_8875a5c8_monolayer_fk"`',
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

		test<DbContext>("replace", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_58e6ca22_monolayer_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["id"], books, ["id"])
							.updateRule("cascade")
							.deleteRule("set null"),
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
					priority: 810,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropForeignKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_58e6ca22_monolayer_fk")',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_58e6ca22_monolayer_fk", ["book_id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_58e6ca22_monolayer_fk"`',
							"execute(db);",
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
    .addForeignKeyConstraint("users_35cf8008_monolayer_fk", ["id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("cascade")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_35cf8008_monolayer_fk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_35cf8008_monolayer_fk")',
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

		test<DbContext>("change drops the old and creates a new", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_58e6ca22_monolayer_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["book_id"], books, ["id"])
							.updateRule("cascade")
							.deleteRule("set null"),
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
					priority: 810,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropForeignKey",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_58e6ca22_monolayer_fk")',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_58e6ca22_monolayer_fk", ["book_id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_58e6ca22_monolayer_fk"`',
							"execute(db);",
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
    .addForeignKeyConstraint("users_9fe2ea61_monolayer_fk", ["book_id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("cascade")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_9fe2ea61_monolayer_fk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_9fe2ea61_monolayer_fk")',
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
	});

	describe("check constraints", () => {
		test<DbContext>("add", async (context) => {
			const firstCheck = check(sql`${sql.ref("id")} > 50`);
			const secondCheck = check(sql`${sql.ref("id")} < 50000`);

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint("books_918b4271_monolayer_chk", sql`"id" > 50`)
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
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
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_e37c55a5_monolayer_chk")',
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

		test<DbContext>("add multiple", async (context) => {
			const firstCheck = check(sql`${sql.ref("id")} > 50`);
			const secondCheck = check(sql`${sql.ref("id")} < 50000`);

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
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
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_918b4271_monolayer_chk")',
							"execute();",
						],
					],
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
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_e37c55a5_monolayer_chk")',
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

		test<DbContext>("drop", async (context) => {
			const firstCheck = check(sql`"id" > 5`);

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint("books_2f1f415e_monolayer_chk", sql`"id" > 5`)
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint("books_e37c55a5_monolayer_chk", sql`"id" < 50000`)
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					checks: [firstCheck],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
				},
			});

			const expected = [
				{
					priority: 812,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropCheckConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_e37c55a5_monolayer_chk")',
							"execute();",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_e37c55a5_monolayer_chk" CHECK ((id < 50000)) NOT VALID`',
							"execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_e37c55a5_monolayer_chk"`',
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

		test<DbContext>("drop all", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint("books_918b4271_monolayer_chk", sql`"id" < 50000`)
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					books,
				},
			});

			const expected = [
				{
					priority: 812,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropCheckConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_918b4271_monolayer_chk")',
							"execute();",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_918b4271_monolayer_chk" CHECK ((id < 50000)) NOT VALID`',
							"execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_918b4271_monolayer_chk"`',
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

		test<DbContext>("add across schemas", async (context) => {
			const users = table({
				columns: {
					id: serial(),
				},
				constraints: {
					checks: [check(sql`${sql.ref("id")} > 50`)],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const usersSchema = schema({
				name: "users",
				tables: {
					users,
				},
			});

			const expected = [
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
					priority: 4012,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createCheckConstraint",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("users_918b4271_monolayer_chk", sql\`"id" > 50\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_918b4271_monolayer_chk"`',
							"execute(db);",
						],
					],
					down: [[]],
				},
				{
					priority: 0,
					tableName: "none",
					currentTableName: "none",
					schemaName: "users",
					type: "createSchema",
					up: [
						['await sql`CREATE SCHEMA IF NOT EXISTS "users";`', "execute(db);"],
						[
							"await sql`COMMENT ON SCHEMA \"users\" IS 'monolayer'`",
							"execute(db);",
						],
					],
					down: [['await sql`DROP SCHEMA IF EXISTS "users";`', "execute(db);"]],
				},
				{
					priority: 2001,
					tableName: "users",
					currentTableName: "users",
					schemaName: "users",
					type: "createTable",
					up: [
						[
							'await db.withSchema("users").schema',
							'createTable("users")',
							'addColumn("id", "serial", (col) => col.notNull())',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("users").schema',
							'dropTable("users")',
							"execute();",
						],
					],
				},
				{
					priority: 4012,
					tableName: "users",
					currentTableName: "users",
					schemaName: "users",
					type: "createCheckConstraint",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("users")
    .schema.alterTable("users")
    .addCheckConstraint("users_918b4271_monolayer_chk", sql\`"id" > 50\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "users"."users" VALIDATE CONSTRAINT "users_918b4271_monolayer_chk"`',
							"execute(db);",
						],
					],
					down: [[]],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { schemas: [dbSchema, usersSchema] },
				expected,
				down: "same",
			});
		});
	});

	describe("unique constraints", () => {
		test<DbContext>("add unique constraints", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("name", "varchar")
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("fullName", "varchar")
				.execute();

			const books = table({
				columns: {
					id: integer(),
					name: varchar(),
				},
				constraints: {
					unique: [unique(["id"]).nullsNotDistinct(), unique(["name"])],
				},
			});

			const users = table({
				columns: {
					id: serial(),
					fullName: varchar(),
				},
				constraints: {
					unique: [unique(["id", "fullName"])],
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
					priority: 4003,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createIndex",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "books_a91945e0_monolayer_key_monolayer_uc_idx" on "public"."books" ("id") nulls not distinct\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("books_a91945e0_monolayer_key_monolayer_uc_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_a91945e0_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createIndex",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "books_adbefd84_monolayer_key_monolayer_uc_idx" on "public"."books" ("name") nulls distinct\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("books_adbefd84_monolayer_key_monolayer_uc_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_adbefd84_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_83137b76_monolayer_key_monolayer_uc_idx" on "public"."users" ("fullName", "id") nulls distinct\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_83137b76_monolayer_key_monolayer_uc_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_83137b76_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createUniqueConstraint",
					up: [
						[
							'await sql`alter table "public"."books" add constraint "books_a91945e0_monolayer_key" unique using index "books_a91945e0_monolayer_key_monolayer_uc_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_a91945e0_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_a91945e0_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createUniqueConstraint",
					up: [
						[
							'await sql`alter table "public"."books" add constraint "books_adbefd84_monolayer_key" unique using index "books_adbefd84_monolayer_key_monolayer_uc_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_adbefd84_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_adbefd84_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createUniqueConstraint",
					up: [
						[
							'await sql`alter table "public"."users" add constraint "users_83137b76_monolayer_key" unique using index "users_83137b76_monolayer_key_monolayer_uc_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_83137b76_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_83137b76_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
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

		test<DbContext>("remove unique constraints", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("name", "varchar")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_a91945e0_monolayer_key", ["id"], (uc) =>
					uc.nullsNotDistinct(),
				)
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_adbefd84_monolayer_key", ["name"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("fullName", "varchar")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addUniqueConstraint("users_83137b76_monolayer_key", ["id", "fullName"])
				.execute();

			const books = table({
				columns: {
					id: integer(),
					name: varchar(),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					fullName: varchar(),
				},
				constraints: {
					unique: [unique(["fullName", "id"])],
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
					priority: 811,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropUniqueConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_a91945e0_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_a91945e0_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addUniqueConstraint("books_a91945e0_monolayer_key", ["id"], (col) => col.nullsNotDistinct())',
							"execute();",
						],
					],
				},
				{
					priority: 811,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropUniqueConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_adbefd84_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_adbefd84_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addUniqueConstraint("books_adbefd84_monolayer_key", ["name"])',
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

		test<DbContext>("replace unique constraints", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_a91945e0_monolayer_key", ["id"], (uc) =>
					uc.nullsNotDistinct(),
				)
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("fullName", "varchar")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addUniqueConstraint("users_83137b76_monolayer_key", ["id", "fullName"])
				.execute();

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
					priority: 811,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropUniqueConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_83137b76_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_83137b76_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addUniqueConstraint("users_83137b76_monolayer_key", ["fullName", "id"])',
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_acdd8fa3_monolayer_key_monolayer_uc_idx" on "public"."users" ("id") nulls distinct\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_acdd8fa3_monolayer_key_monolayer_uc_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_acdd8fa3_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createUniqueConstraint",
					up: [
						[
							'await sql`alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique using index "users_acdd8fa3_monolayer_key_monolayer_uc_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_acdd8fa3_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_acdd8fa3_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
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

		test<DbContext>("change unique constraints", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_a91945e0_monolayer_key", ["id"], (uc) =>
					uc.nullsNotDistinct(),
				)
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("fullName", "varchar")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addUniqueConstraint("users_83137b76_monolayer_key", ["id", "fullName"])
				.execute();
			// users_fbf55213_monolayer_key
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
					unique: [unique(["id", "fullName"]).nullsNotDistinct()],
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
					priority: 811,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropUniqueConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_83137b76_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_83137b76_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addUniqueConstraint("users_83137b76_monolayer_key", ["fullName", "id"])',
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_fbf55213_monolayer_key_monolayer_uc_idx" on "public"."users" ("fullName", "id") nulls not distinct\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_fbf55213_monolayer_key_monolayer_uc_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_fbf55213_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createUniqueConstraint",
					up: [
						[
							'await sql`alter table "public"."users" add constraint "users_fbf55213_monolayer_key" unique using index "users_fbf55213_monolayer_key_monolayer_uc_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_fbf55213_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_fbf55213_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
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

		test<DbContext>("unique constraints across schemas", async (context) => {
			const users = table({
				columns: {
					id: serial(),
					email: varchar(255).notNull(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
					unique: [unique(["email"])],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const usersSchema = schema({
				name: "users",
				tables: {
					users,
				},
			});

			const expected = [
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
							'addColumn("email", sql`character varying(255)`, (col) => col.notNull())',
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
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createUniqueConstraint",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addUniqueConstraint("users_f368ca51_monolayer_key", ["email"])',
							"execute();",
						],
					],
					down: [[]],
				},
				{
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
					down: [[]],
				},
				{
					priority: 0,
					tableName: "none",
					currentTableName: "none",
					schemaName: "users",
					type: "createSchema",
					up: [
						['await sql`CREATE SCHEMA IF NOT EXISTS "users";`', "execute(db);"],
						[
							"await sql`COMMENT ON SCHEMA \"users\" IS 'monolayer'`",
							"execute(db);",
						],
					],
					down: [['await sql`DROP SCHEMA IF EXISTS "users";`', "execute(db);"]],
				},
				{
					priority: 2001,
					tableName: "users",
					currentTableName: "users",
					schemaName: "users",
					type: "createTable",
					up: [
						[
							'await db.withSchema("users").schema',
							'createTable("users")',
							'addColumn("id", "serial", (col) => col.notNull())',
							'addColumn("email", sql`character varying(255)`, (col) => col.notNull())',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("users").schema',
							'dropTable("users")',
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					tableName: "users",
					currentTableName: "users",
					schemaName: "users",
					type: "createUniqueConstraint",
					up: [
						[
							'await db.withSchema("users").schema',
							'alterTable("users")',
							'addUniqueConstraint("users_f368ca51_monolayer_key", ["email"])',
							"execute();",
						],
					],
					down: [[]],
				},
				{
					priority: 4013,
					tableName: "users",
					currentTableName: "users",
					schemaName: "users",
					type: "createPrimaryKey",
					up: [
						[
							'await db.withSchema("users").schema',
							'alterTable("users")',
							'addPrimaryKeyConstraint("users_pkey", ["id"])',
							"execute();",
						],
					],
					down: [[]],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { schemas: [dbSchema, usersSchema] },
				expected,
				down: "same",
			});
		});
	});

	describe("indexes", () => {
		test<DbContext>("add indexes", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.createIndex("users_3cf2733f_monolayer_idx")
				.on("users")
				.column("fullName")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
				indexes: [index(["fullName"]), index(["name"])],
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 4003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createIndex",
					transaction: false,
					up: [
						[
							`try {
    await sql\`\${sql.raw('create index concurrently "users_e42f0227_monolayer_idx" on "public"."users" ("name")')}\`.execute(db);
  }
  catch (error: any) {
    if (error.code === '23505') {
      await db.withSchema("public").schema.dropIndex("users_e42f0227_monolayer_idx").ifExists().execute();
    }
    throw error;
  }`,
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_e42f0227_monolayer_idx")',
							"ifExists()",
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

		test<DbContext>("remove indexes", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.createIndex("users_3cf2733f_monolayer_idx")
				.on("users")
				.column("fullName")
				.execute();

			await context.kysely.schema
				.createIndex("users_e42f0227_monolayer_idx")
				.on("users")
				.column("name")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
				indexes: [index(["name"])],
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 800,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropIndex",
					transaction: false,
					up: [
						[
							'await sql`DROP INDEX CONCURRENTLY IF EXISTS "public"."users_3cf2733f_monolayer_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`CREATE INDEX users_3cf2733f_monolayer_idx ON public.users USING btree ("fullName")`',
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

		test<DbContext>("add and remove indexes", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.createIndex("users_3cf2733f_monolayer_idx")
				.on("users")
				.column("fullName")
				.execute();

			await context.kysely.schema
				.createIndex("users_e42f0227_monolayer_idx")
				.on("users")
				.column("name")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
				indexes: [index(["name"]), index(["name", "fullName"])],
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 800,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropIndex",
					transaction: false,
					up: [
						[
							'await sql`DROP INDEX CONCURRENTLY IF EXISTS "public"."users_3cf2733f_monolayer_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`CREATE INDEX users_3cf2733f_monolayer_idx ON public.users USING btree ("fullName")`',
							"execute(db);",
						],
					],
				},
				{
					priority: 4003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createIndex",
					transaction: false,
					up: [
						[
							`try {
    await sql\`\${sql.raw('create index concurrently "users_2d87ba04_monolayer_idx" on "public"."users" ("name", "fullName")')}\`.execute(db);
  }
  catch (error: any) {
    if (error.code === '23505') {
      await db.withSchema("public").schema.dropIndex("users_2d87ba04_monolayer_idx").ifExists().execute();
    }
    throw error;
  }`,
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_2d87ba04_monolayer_idx")',
							"ifExists()",
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

		test<DbContext>("change index", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.createIndex("users_3cf2733f_monolayer_idx")
				.on("users")
				.column("fullName")
				.execute();

			await context.kysely.schema
				.createIndex("users_e42f0227_monolayer_idx")
				.on("users")
				.column("name")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
				indexes: [index(["name"]), index(["fullName"]).unique()],
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 800,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropIndex",
					transaction: false,
					up: [
						[
							'await sql`DROP INDEX CONCURRENTLY IF EXISTS "public"."users_3cf2733f_monolayer_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`CREATE INDEX users_3cf2733f_monolayer_idx ON public.users USING btree ("fullName")`',
							"execute(db);",
						],
					],
				},
				{
					priority: 4003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createIndex",
					transaction: false,
					up: [
						[
							`try {
    await sql\`\${sql.raw('create unique index concurrently "users_861127a4_monolayer_idx" on "public"."users" ("fullName")')}\`.execute(db);
  }
  catch (error: any) {
    if (error.code === '23505') {
      await db.withSchema("public").schema.dropIndex("users_861127a4_monolayer_idx").ifExists().execute();
    }
    throw error;
  }`,
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_861127a4_monolayer_idx")',
							"ifExists()",
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
	});

	describe("triggers", () => {
		test<DbContext>("add trigger", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("updatedAt", "timestamp", (col) =>
					col.defaultTo(sql`CURRENT_TIMESTAMP`),
				)
				.execute();

			await sql`COMMENT ON COLUMN "users"."updatedAt" IS '9ff7b5b7'`.execute(
				context.kysely,
			);

			const users = table({
				columns: {
					id: integer(),
					updatedAt: timestamp().default(sql`CURRENT_TIMESTAMP`),
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
						fireWhen: "after",
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
						[
							"await sql`DROP EXTENSION IF EXISTS moddatetime;`",
							"execute(db);",
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
					down: [
						[
							'await sql`DROP TRIGGER users_8659ae36_monolayer_trg ON "public"."users"`',
							"execute(db);",
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
							`await sql\`CREATE OR REPLACE TRIGGER users_cd708de3_monolayer_trg
AFTER UPDATE ON "public"."users"
FOR EACH ROW
EXECUTE FUNCTION moddatetime("updatedAt")\``,
							`execute(db);`,
						],
					],
					down: [
						[
							'await sql`DROP TRIGGER users_cd708de3_monolayer_trg ON "public"."users"`',
							"execute(db);",
						],
					],
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

		test<DbContext>("drop trigger", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))
				.execute();

			await sql`COMMENT ON COLUMN "users"."updatedAt" IS '28a4dae0'`.execute(
				context.kysely,
			);

			await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(
				context.kysely,
			);

			await sql`CREATE OR REPLACE TRIGGER users_c2304485_monolayer_trg
									BEFORE UPDATE ON users
									FOR EACH ROW
									EXECUTE FUNCTION moddatetime(updatedAt);`.execute(context.kysely);

			await sql`CREATE OR REPLACE TRIGGER users_9463c7cd_monolayer_trg
									AFTER UPDATE ON users
									FOR EACH ROW
									EXECUTE FUNCTION moddatetime(updatedAt);`.execute(context.kysely);

			const users = table({
				columns: {
					id: integer(),
					updatedAt: timestamp().default(sql`now()`),
				},
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 1001,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropTrigger",
					up: [
						[
							'await sql`DROP TRIGGER users_c2304485_monolayer_trg ON "public"."users"`',
							"execute(db);",
						],
					],
					down: [
						[
							"await sql`CREATE OR REPLACE TRIGGER users_c2304485_monolayer_trg BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedat')`",
							"execute(db);",
						],
					],
				},
				{
					priority: 1001,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropTrigger",
					up: [
						[
							'await sql`DROP TRIGGER users_9463c7cd_monolayer_trg ON "public"."users"`',
							"execute(db);",
						],
					],
					down: [
						[
							"await sql`CREATE OR REPLACE TRIGGER users_9463c7cd_monolayer_trg AFTER UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedat')`",
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: {
					schemas: [dbSchema],
					extensions: [extension("moddatetime")],
				},
				expected,
				down: "reverse",
			});
		});

		test<DbContext>("change trigger", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))
				.execute();

			await sql`COMMENT ON COLUMN "users"."updatedAt" IS '28a4dae0'`.execute(
				context.kysely,
			);

			await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(
				context.kysely,
			);

			await sql`CREATE OR REPLACE TRIGGER users_c2304485_monolayer_trg
									BEFORE UPDATE ON users
									FOR EACH ROW
									EXECUTE FUNCTION moddatetime(updatedAt);`.execute(context.kysely);

			const users = table({
				columns: {
					id: integer(),
					updatedAt: timestamp().default(sql`now()`),
				},
				triggers: [
					trigger({
						fireWhen: "after",
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
				tables: {
					users,
				},
			});

			const expected = [
				{
					down: [
						[
							"await sql`CREATE OR REPLACE TRIGGER users_c2304485_monolayer_trg BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedat')`",
							"execute(db);",
						],
					],
					priority: 1001,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropTrigger",
					up: [
						[
							'await sql`DROP TRIGGER users_c2304485_monolayer_trg ON "public"."users"`',
							"execute(db);",
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
							`await sql\`CREATE OR REPLACE TRIGGER users_cd708de3_monolayer_trg
AFTER UPDATE ON "public"."users"
FOR EACH ROW
EXECUTE FUNCTION moddatetime("updatedAt")\``,
							`execute(db);`,
						],
					],
					down: [
						[
							'await sql`DROP TRIGGER users_cd708de3_monolayer_trg ON "public"."users"`',
							"execute(db);",
						],
					],
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
	});

	describe("identity columns", () => {
		test<DbContext>("add", async (context) => {
			await context.kysely.schema.createTable("users").execute();

			const dbSchema = schema({
				tables: {
					users: table({
						columns: {
							id: integer().generatedAlwaysAsIdentity(),
							count: integer().generatedByDefaultAsIdentity(),
						},
					}),
				},
			});

			const expected = [
				{
					priority: 2003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("id", "integer")',
							"execute();",
						],
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint", sql\`"id" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("id", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("temporary_not_null_check_constraint")',
							"execute();",
						],
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("id")',
							"execute();",
						],
					],
				},
				{
					priority: 2003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("count", "integer")',
							"execute();",
						],
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint", sql\`"count" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("count", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("temporary_not_null_check_constraint")',
							"execute();",
						],
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "count" ADD GENERATED BY DEFAULT AS IDENTITY`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("count")',
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

		test<DbContext>("remove", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer", (col) =>
					col.notNull().generatedAlwaysAsIdentity(),
				)
				.addColumn("count", "integer", (col) =>
					col.notNull().generatedByDefaultAsIdentity(),
				)
				.execute();

			const dbSchema = schema({
				tables: {
					users: table({
						columns: {},
					}),
				},
			});

			const expected = [
				{
					priority: 1005,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropColumn",
					warnings: [
						{
							code: "D003",
							column: "count",
							schema: "public",
							table: "users",
							type: "destructive",
						},
					],
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("count")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("count", "integer", (col) => col.notNull().generatedByDefaultAsIdentity())',
							"execute();",
						],
					],
				},
				{
					priority: 1005,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropColumn",
					warnings: [
						{
							code: "D003",
							column: "id",
							schema: "public",
							table: "users",
							type: "destructive",
						},
					],
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("id", "integer", (col) => col.notNull().generatedAlwaysAsIdentity())',
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

		test<DbContext>("change into", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("count", "integer")
				.execute();

			const dbSchema = schema({
				tables: {
					users: table({
						columns: {
							id: integer().generatedAlwaysAsIdentity(),
							count: integer().generatedByDefaultAsIdentity(),
						},
					}),
				},
			});

			const expected = [
				{
					priority: 3011,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumn",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint", sql\`"count" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("count", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("count", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumn",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint", sql\`"id" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("id", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("id", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3012,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumn",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "count" ADD GENERATED BY DEFAULT AS IDENTITY`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "count" DROP IDENTITY`',
							"execute(db);",
						],
					],
				},
				{
					priority: 3012,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumn",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "id" DROP IDENTITY`',
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

		test<DbContext>("change from", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer", (col) =>
					col.notNull().generatedAlwaysAsIdentity(),
				)
				.addColumn("count", "integer", (col) =>
					col.notNull().generatedByDefaultAsIdentity(),
				)
				.execute();

			const dbSchema = schema({
				tables: {
					users: table({
						columns: {
							id: integer(),
							count: integer(),
						},
					}),
				},
			});

			const expected = [
				{
					priority: 3004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumn",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "count" DROP IDENTITY`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "count" ADD GENERATED BY DEFAULT AS IDENTITY`',
							"execute(db);",
						],
					],
				},
				{
					priority: 3004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumn",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "id" DROP IDENTITY`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY`',
							"execute(db);",
						],
					],
				},
				{
					priority: 3011,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("count", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint", sql\`"count" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("count", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("temporary_not_null_check_constraint")',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("id", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint", sql\`"id" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("id", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("temporary_not_null_check_constraint")',
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
	});

	test<DbContext>("add serial and bigserial columns", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("count", "integer")
			.execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						id: serial(),
						second_id: bigserial(),
						count: integer(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 2003,
				schemaName: "public",
				tableName: "users",
				currentTableName: "users",
				type: "createColumn",
				warnings: [
					{
						code: "B003",
						column: "id",
						schema: "public",
						table: "users",
						type: "blocking",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("id", "serial")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("id")',
						"execute();",
					],
				],
			},
			{
				priority: 2003,
				schemaName: "public",
				tableName: "users",
				currentTableName: "users",
				type: "createColumn",
				warnings: [
					{
						code: "B004",
						column: "second_id",
						schema: "public",
						table: "users",
						type: "blocking",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("second_id", "bigserial")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("second_id")',
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

	test<DbContext>("add non nullable column", async (context) => {
		await context.kysely.schema.createTable("users").execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						name: text().notNull(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 2003,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("name", "text")',
						"execute();",
					],
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint", sql\`"name" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint"`',
						"execute(db);",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("name", (col) => col.setNotNull())',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("temporary_not_null_check_constraint")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("name")',
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

	test<DbContext>("add non nullable column with volatile default", async (context) => {
		await context.kysely.schema.createTable("users").execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						createdAt: timestamptz()
							.default(sql`now()`)
							.notNull(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 2003,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createColumn",
				warnings: [
					{
						code: "B002",
						column: "createdAt",
						schema: "public",
						table: "users",
						type: "blocking",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("createdAt", sql`timestamp with time zone`)',
						"execute();",
					],
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint", sql\`"createdAt" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint"`',
						"execute(db);",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("createdAt", (col) => col.setNotNull())',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("temporary_not_null_check_constraint")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("createdAt", (col) => col.setDefault(sql`now()`))',
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."createdAt" IS \'28a4dae0\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("createdAt")',
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

	test<DbContext>("add column with volatile default", async (context) => {
		await context.kysely.schema.createTable("users").execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						createdAt: timestamptz().default(sql`now()`),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 2003,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createColumn",
				warnings: [
					{
						code: "B002",
						column: "createdAt",
						schema: "public",
						table: "users",
						type: "blocking",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("createdAt", sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))',
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."createdAt" IS \'28a4dae0\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("createdAt")',
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
});
