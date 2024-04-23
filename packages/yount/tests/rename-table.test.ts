/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test, vi } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { table } from "~/database/schema/table/table.js";
import { check, foreignKey, index, integer, primaryKey, unique } from "~/pg.js";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "~tests/__setup__/helpers/test-context.js";
import {
	mockColumnDiffOnce,
	mockTableDiffOnce,
	tableDiffMock,
} from "~tests/__setup__/setup.js";

describe("Rename table without camel case plugin", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
		vi.restoreAllMocks();
	});

	test<DbContext>("rename empty table", async (context) => {
		await context.kysely.schema.createTable("users").execute();

		const dbSchema = schema({
			tables: {
				teams: table({
					columns: {},
				}),
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "users",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameTo("teams")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("teams")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				tableDiffMock().mockResolvedValueOnce([
					{
						from: "users",
						to: "teams",
					},
				]);
			},
		});
	});

	test<DbContext>("table with columns", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("mantain check", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("books_2f1f415e_yount_chk", sql`${sql.ref("id")} > 5`)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint(
				"books_e37c55a5_yount_chk",
				sql`${sql.ref("id")} < 50000`,
			)
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
			constraints: {
				checks: [
					check(sql`${sql.ref("id")} > 5`),
					check(sql`${sql.ref("id")} < 50000`),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("add check", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
			constraints: {
				checks: [
					check(sql`${sql.ref("id")} > 5`),
					check(sql`${sql.ref("id")} < 50000`),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4012,
				tableName: "publications",
				type: "createCheckConstraint",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("publications")
    .addCheckConstraint("publications_2f1f415e_yount_chk", sql\`"id" > 5\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."publications" VALIDATE CONSTRAINT "publications_2f1f415e_yount_chk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_2f1f415e_yount_chk")',
						"execute();",
					],
				],
			},
			{
				priority: 4012,
				tableName: "publications",
				type: "createCheckConstraint",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("publications")
    .addCheckConstraint("publications_e37c55a5_yount_chk", sql\`"id" < 50000\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."publications" VALIDATE CONSTRAINT "publications_e37c55a5_yount_chk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_e37c55a5_yount_chk")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("drop some check", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("books_2f1f415e_yount_chk", sql`${sql.ref("id")} > 5`)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint(
				"books_e37c55a5_yount_chk",
				sql`${sql.ref("id")} < 50000`,
			)
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
			constraints: {
				checks: [check(sql`${sql.ref("id")} < 50000`)],
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 812,
				tableName: "books",
				type: "dropCheckConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_2f1f415e_yount_chk")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_2f1f415e_yount_chk" CHECK ((id > 5)) NOT VALID`',
						"execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_2f1f415e_yount_chk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("drop all checks", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("books_2f1f415e_yount_chk", sql`${sql.ref("id")} > 5`)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint(
				"books_e37c55a5_yount_chk",
				sql`${sql.ref("id")} < 50000`,
			)
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 812,
				tableName: "books",
				type: "dropCheckConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_2f1f415e_yount_chk")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_2f1f415e_yount_chk" CHECK ((id > 5)) NOT VALID`',
						"execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_2f1f415e_yount_chk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 812,
				tableName: "books",
				type: "dropCheckConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_e37c55a5_yount_chk")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_e37c55a5_yount_chk" CHECK ((id < 50000)) NOT VALID`',
						"execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_e37c55a5_yount_chk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("keep primary key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("add primary key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4001,
				tableName: "publications",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addPrimaryKeyConstraint("publications_yount_pk", ["id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_yount_pk")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("id", (col) => col.dropNotNull())',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("add primary key not null", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				id: integer().notNull(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 3008,
				tableName: "publications",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("id", (col) => col.setNotNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("id", (col) => col.dropNotNull())',
						"execute();",
					],
				],
			},
			{
				priority: 4001,
				tableName: "publications",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addPrimaryKeyConstraint("publications_yount_pk", ["id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_yount_pk")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("drop primary key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id"])
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 1004,
				tableName: "publications",
				type: "dropPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("books_yount_pk")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("id", (col) => col.dropNotNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addPrimaryKeyConstraint("books_yount_pk", ["id"])',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("drop primary key keep not null", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id"])
			.execute();

		const publications = table({
			columns: {
				id: integer().notNull(),
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 1004,
				tableName: "publications",
				type: "dropPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("books_yount_pk")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addPrimaryKeyConstraint("books_yount_pk", ["id"])',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("rename foreign key child table", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_c02e3d7d_yount_fk",
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

		const persons = table({
			columns: {
				id: integer(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], books, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				persons,
				books,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "users",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameTo("persons")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "persons",
				type: "changeForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_c02e3d7d_yount_fk TO users_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "users",
						to: "persons",
					},
				]);
			},
		});
	});

	test<DbContext>("rename foreign key parent table", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_c02e3d7d_yount_fk",
				["book_id"],
				"books",
				["id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const documents = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], documents, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				users,
				documents,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "users",
				type: "changeForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_7e0fa77c_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_7e0fa77c_yount_fk TO users_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "documents",
					},
				]);
			},
		});
	});

	test<DbContext>("rename foreign key parent table and child table", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_c02e3d7d_yount_fk",
				["book_id"],
				"books",
				["id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const documents = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], documents, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				persons,
				documents,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "users",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameTo("persons")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "persons",
				type: "changeForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_7e0fa77c_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_7e0fa77c_yount_fk TO users_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "documents",
					},
					{
						from: "users",
						to: "persons",
					},
				]);
			},
		});
	});

	test<DbContext>("rename composite foreign key child table", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_c02e3d7d_yount_fk",
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

		const persons = table({
			columns: {
				id: integer(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], books, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				persons,
				books,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "users",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameTo("persons")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "persons",
				type: "changeForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_c02e3d7d_yount_fk TO users_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "users",
						to: "persons",
					},
				]);
			},
		});
	});

	test<DbContext>("rename composite foreign key parent table", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_c02e3d7d_yount_fk",
				["book_id"],
				"books",
				["id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const documents = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], documents, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				users,
				documents,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "users",
				type: "changeForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_7e0fa77c_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_7e0fa77c_yount_fk TO users_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "documents",
					},
				]);
			},
		});
	});

	test<DbContext>("rename composite foreign key parent table and child table", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_c02e3d7d_yount_fk",
				["book_id"],
				"books",
				["id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const documents = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], documents, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				persons,
				documents,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "users",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameTo("persons")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "persons",
				type: "changeForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_7e0fa77c_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_7e0fa77c_yount_fk TO users_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "documents",
					},
					{
						from: "users",
						to: "persons",
					},
				]);
			},
		});
	});

	test<DbContext>("keep unique constraint", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
			constraints: {
				unique: [unique(["id"])],
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("add unique constraint", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
			constraints: {
				unique: [unique(["id"])],
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4010,
				tableName: "publications",
				type: "createUniqueConstraint",
				up: [
					[
						`await db.withSchema("public").schema`,
						`alterTable("publications")`,
						`addUniqueConstraint("publications_acdd8fa3_yount_key", ["id"])`,
						`execute();`,
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_acdd8fa3_yount_key")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("drop unique constraint", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 811,
				tableName: "books",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("drop some unique constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("count", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_d0c857aa_yount_key", ["count"])
			.execute();

		const publications = table({
			columns: {
				id: integer(),
				count: integer(),
			},
			constraints: {
				unique: [unique(["count"])],
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 811,
				tableName: "books",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("drop all unique constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("count", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_d0c857aa_yount_key", ["count"])
			.execute();

		const publications = table({
			columns: {
				id: integer(),
				count: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 811,
				tableName: "books",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 811,
				tableName: "books",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_d0c857aa_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_d0c857aa_yount_key", ["count"])',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("keep index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_0c84fd75_yount_idx")
			.on("books")
			.columns(["id"])
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
			indexes: [index(["id"])],
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 5001,
				tableName: "publications",
				type: "changeIndex",
				up: [
					[
						"await sql`ALTER INDEX books_0c84fd75_yount_idx RENAME TO publications_0c84fd75_yount_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX publications_0c84fd75_yount_idx RENAME TO books_0c84fd75_yount_idx`",
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("keep complex index", async (context) => {
		await context.kysely.schema
			.createTable("publications")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("publications_6b9be986_yount_idx")
			.on("publications")
			.columns(["id", "samples"])
			.where("samples", ">", 20)
			.where(sql.ref("ratings"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const books = table({
			columns: {
				id: integer(),
				samples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["id", "samples"])
					.where("samples", ">", 20)
					.where(sql.ref("ratings"), ">", 5)
					.nullsNotDistinct()
					.using("btree")
					.unique(),
			],
		});

		const dbSchema = schema({
			tables: {
				books,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "publications",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
			},
			{
				down: [
					[
						"await sql`ALTER INDEX books_6b9be986_yount_idx RENAME TO publications_6b9be986_yount_idx`",
						"execute(db);",
					],
				],
				priority: 5001,
				tableName: "books",
				type: "changeIndex",
				up: [
					[
						"await sql`ALTER INDEX publications_6b9be986_yount_idx RENAME TO books_6b9be986_yount_idx`",
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "publications",
						to: "books",
					},
				]);
			},
		});
	});

	test<DbContext>("add index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
			indexes: [index(["id"])],
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "publications",
				type: "createIndex",
				up: [
					[
						'await sql`create index "publications_0c84fd75_yount_idx" on "public"."publications" ("id")`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_0c84fd75_yount_idx")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("add complex index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		const publications = table({
			columns: {
				id: integer(),
				samples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["id", "samples"])
					.where("samples", ">", 20)
					.where(sql.ref("ratings"), ">", 5)
					.nullsNotDistinct()
					.using("btree")
					.unique(),
			],
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "publications",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "publications_6b9be986_yount_idx" on "public"."publications" using btree ("id", "samples") nulls not distinct where "samples" > 20 and "ratings" > 5`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_6b9be986_yount_idx")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("add multiple indexes", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		const publications = table({
			columns: {
				id: integer(),
				samples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["id"]),
				index(["id", "samples"])
					.where("samples", ">", 20)
					.where(sql.ref("ratings"), ">", 5)
					.nullsNotDistinct()
					.using("btree")
					.unique(),
			],
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "publications",
				type: "createIndex",
				up: [
					[
						'await sql`create index "publications_0c84fd75_yount_idx" on "public"."publications" ("id")`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_0c84fd75_yount_idx")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "publications",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "publications_6b9be986_yount_idx" on "public"."publications" using btree ("id", "samples") nulls not distinct where "samples" > 20 and "ratings" > 5`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_6b9be986_yount_idx")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("drop index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_0c84fd75_yount_idx")
			.on("books")
			.columns(["id"])
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 800,
				tableName: "books",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_0c84fd75_yount_idx")',
						"execute();",
					],
				],
				down: [
					[
						"await sql`CREATE INDEX books_0c84fd75_yount_idx ON public.books USING btree (id)`",
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("drop complex index", async (context) => {
		await context.kysely.schema
			.createTable("publications")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("publications_6b9be986_yount_idx")
			.on("publications")
			.columns(["id", "samples"])
			.where("samples", ">", 20)
			.where(sql.ref("ratings"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const books = table({
			columns: {
				id: integer(),
				samples: integer(),
				ratings: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				books,
			},
		});

		const expected = [
			{
				priority: 800,
				tableName: "publications",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_6b9be986_yount_idx")',
						"execute();",
					],
				],
				down: [
					[
						"await sql`CREATE UNIQUE INDEX publications_6b9be986_yount_idx ON public.publications USING btree (id, samples) NULLS NOT DISTINCT WHERE ((samples > 20) AND (ratings > 5))`",
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "publications",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "publications",
						to: "books",
					},
				]);
			},
		});
	});
});

describe("Rename table with camel case plugin", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
		vi.restoreAllMocks();
	});

	test<DbContext>("rename empty table camel case", async (context) => {
		tableDiffMock().mockResolvedValueOnce([
			{
				from: "users",
				to: "new_users",
			},
		]);
		await context.kysely.schema.createTable("users").execute();

		const dbSchema = schema({
			tables: {
				newUsers: table({
					columns: {},
				}),
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "users",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameTo("new_users")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_users")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true, options: {} },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "users",
						to: "new_users",
					},
				]);
			},
		});
	});

	test<DbContext>("table with columns camel case", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const newBooks = table({
			columns: {
				id: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				newBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("new_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "new_books",
					},
				]);
			},
		});
	});

	test<DbContext>("keep check constraint", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("books_2f1f415e_yount_chk", sql`${sql.ref("id")} > 5`)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint(
				"books_e37c55a5_yount_chk",
				sql`${sql.ref("id")} < 50000`,
			)
			.execute();

		const booksAndDocuments = table({
			columns: {
				id: integer(),
			},
			constraints: {
				checks: [
					check(sql`${sql.ref("id")} > 5`),
					check(sql`${sql.ref("id")} < 50000`),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("books_and_documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "books_and_documents",
					},
				]);
			},
		});
	});

	test<DbContext>("add check constraint", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("book_id", "integer")
			.execute();

		const booksAndDocuments = table({
			columns: {
				bookId: integer(),
			},
			constraints: {
				checks: [
					check(sql`${sql.ref("bookId")} > 5`),
					check(sql`${sql.ref("bookId")} < 50000`),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("books_and_documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4012,
				tableName: "books_and_documents",
				type: "createCheckConstraint",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("books_and_documents")
    .addCheckConstraint("books_and_documents_dc912898_yount_chk", sql\`"book_id" > 5\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."books_and_documents" VALIDATE CONSTRAINT "books_and_documents_dc912898_yount_chk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'dropConstraint("books_and_documents_dc912898_yount_chk")',
						"execute();",
					],
				],
			},
			{
				priority: 4012,
				tableName: "books_and_documents",
				type: "createCheckConstraint",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("books_and_documents")
    .addCheckConstraint("books_and_documents_f685097b_yount_chk", sql\`"book_id" < 50000\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."books_and_documents" VALIDATE CONSTRAINT "books_and_documents_f685097b_yount_chk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'dropConstraint("books_and_documents_f685097b_yount_chk")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "books_and_documents",
					},
				]);
			},
		});
	});

	test<DbContext>("drop some check constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("books_2f1f415e_yount_chk", sql`${sql.ref("id")} > 5`)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint(
				"books_e37c55a5_yount_chk",
				sql`${sql.ref("id")} < 50000`,
			)
			.execute();

		const booksAndDocuments = table({
			columns: {
				id: integer(),
			},
			constraints: {
				checks: [check(sql`${sql.ref("id")} < 50000`)],
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
			},
		});

		const expected = [
			{
				priority: 812,
				tableName: "books",
				type: "dropCheckConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_2f1f415e_yount_chk")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_2f1f415e_yount_chk" CHECK ((id > 5)) NOT VALID`',
						"execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_2f1f415e_yount_chk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("books_and_documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "books_and_documents",
					},
				]);
			},
		});
	});

	test<DbContext>("drop all check constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("books_2f1f415e_yount_chk", sql`${sql.ref("id")} > 5`)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint(
				"books_e37c55a5_yount_chk",
				sql`${sql.ref("id")} < 50000`,
			)
			.execute();

		const publications = table({
			columns: {
				id: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				publications,
			},
		});

		const expected = [
			{
				priority: 812,
				tableName: "books",
				type: "dropCheckConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_2f1f415e_yount_chk")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_2f1f415e_yount_chk" CHECK ((id > 5)) NOT VALID`',
						"execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_2f1f415e_yount_chk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 812,
				tableName: "books",
				type: "dropCheckConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_e37c55a5_yount_chk")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_e37c55a5_yount_chk" CHECK ((id < 50000)) NOT VALID`',
						"execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_e37c55a5_yount_chk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("publications")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "publications",
					},
				]);
			},
		});
	});

	test<DbContext>("keep primary key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const newBooks = table({
			columns: {
				id: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				newBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("new_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "new_books",
					},
				]);
			},
		});
	});

	test<DbContext>("add primary key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("book_id", "integer")
			.execute();

		const newBooks = table({
			columns: {
				bookId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["bookId"]),
			},
		});

		const dbSchema = schema({
			tables: {
				newBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("new_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4001,
				tableName: "new_books",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'addPrimaryKeyConstraint("new_books_yount_pk", ["book_id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'dropConstraint("new_books_yount_pk")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'alterColumn("book_id", (col) => col.dropNotNull())',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "new_books",
					},
				]);
			},
		});
	});

	test<DbContext>("add primary key not null", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("book_id", "integer")
			.execute();

		const newBooks = table({
			columns: {
				bookId: integer().notNull(),
			},
			constraints: {
				primaryKey: primaryKey(["bookId"]),
			},
		});

		const dbSchema = schema({
			tables: {
				newBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("new_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 3008,
				tableName: "new_books",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'alterColumn("book_id", (col) => col.setNotNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'alterColumn("book_id", (col) => col.dropNotNull())',
						"execute();",
					],
				],
			},
			{
				priority: 4001,
				tableName: "new_books",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'addPrimaryKeyConstraint("new_books_yount_pk", ["book_id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'dropConstraint("new_books_yount_pk")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "new_books",
					},
				]);
			},
		});
	});

	test<DbContext>("drop primary key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["book_id"])
			.execute();

		const newBooks = table({
			columns: {
				bookId: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				newBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("new_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 1004,
				tableName: "new_books",
				type: "dropPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'dropConstraint("books_yount_pk")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'alterColumn("book_id", (col) => col.dropNotNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'addPrimaryKeyConstraint("books_yount_pk", ["book_id"])',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "new_books",
					},
				]);
			},
		});
	});

	test<DbContext>("drop primary key keep not null", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["book_id"])
			.execute();

		const newBooks = table({
			columns: {
				bookId: integer().notNull(),
			},
		});

		const dbSchema = schema({
			tables: {
				newBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("new_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 1004,
				tableName: "new_books",
				type: "dropPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'dropConstraint("books_yount_pk")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'addPrimaryKeyConstraint("books_yount_pk", ["book_id"])',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "new_books",
					},
				]);
			},
		});
	});

	test<DbContext>("rename foreign key child table", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_c02e3d7d_yount_fk",
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

		const userBooks = table({
			columns: {
				id: integer(),
				bookId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["bookId"], books, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				userBooks,
				books,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "users",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameTo("user_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "user_books",
				type: "changeForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_c02e3d7d_yount_fk TO users_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "users",
						to: "user_books",
					},
				]);
			},
		});
	});

	test<DbContext>("rename foreign key parent table", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_c02e3d7d_yount_fk",
				["book_id"],
				"books",
				["id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const booksAndDocuments = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				bookId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["bookId"], booksAndDocuments, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				users,
				booksAndDocuments,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("books_and_documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "users",
				type: "changeForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_0ea2ca34_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_0ea2ca34_yount_fk TO users_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "books_and_documents",
					},
				]);
			},
		});
	});

	test<DbContext>("rename foreign key parent table and child table", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_c02e3d7d_yount_fk",
				["book_id"],
				"books",
				["id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const booksAndDocuments = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const userBooks = table({
			columns: {
				id: integer(),
				bookId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["bookId"], booksAndDocuments, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				userBooks,
				booksAndDocuments,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("books_and_documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "users",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameTo("user_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "user_books",
				type: "changeForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_0ea2ca34_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_0ea2ca34_yount_fk TO users_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "books_and_documents",
					},
					{
						from: "users",
						to: "user_books",
					},
				]);
			},
		});
	});

	test<DbContext>("rename composite foreign keys child table", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("location_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer")
			.addColumn("book_location_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_c02e3d7d_yount_fk",
				["book_id", "book_location_id"],
				"books",
				["id", "location_id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const books = table({
			columns: {
				id: integer(),
				locationId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id", "locationId"]),
			},
		});

		const bookUsers = table({
			columns: {
				id: integer(),
				bookId: integer(),
				bookLocationId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["bookId", "bookLocationId"], books, ["id", "locationId"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				bookUsers,
				books,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "users",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameTo("book_users")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("book_users")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "book_users",
				type: "changeForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."book_users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO book_users_6de35d86_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."book_users" RENAME CONSTRAINT book_users_6de35d86_yount_fk TO users_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "users",
						to: "book_users",
					},
				]);
			},
		});
	});

	test<DbContext>("rename composite foreign keys parent table", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("location_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer")
			.addColumn("book_location_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_c02e3d7d_yount_fk",
				["book_id", "book_location_id"],
				"books",
				["id", "location_id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const booksAndDocuments = table({
			columns: {
				id: integer(),
				locationId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id", "locationId"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				bookId: integer(),
				bookLocationId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["bookId", "bookLocationId"], booksAndDocuments, [
						"id",
						"locationId",
					])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				users,
				booksAndDocuments,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("books_and_documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "users",
				type: "changeForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_462ff70f_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_462ff70f_yount_fk TO users_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "books_and_documents",
					},
				]);
			},
		});
	});

	test<DbContext>("rename composite foreign keys parent table and child table", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("location_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_yount_pk", ["id", "location_id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.addColumn("book_id", "integer")
			.addColumn("book_location_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_c02e3d7d_yount_fk",
				["book_id", "book_location_id"],
				"books",
				["id", "location_id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const booksAndDocuments = table({
			columns: {
				id: integer(),
				locationId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id", "locationId"]),
			},
		});

		const userBooks = table({
			columns: {
				id: integer(),
				bookId: integer(),
				bookLocationId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["bookId", "bookLocationId"], booksAndDocuments, [
						"id",
						"locationId",
					])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				userBooks,
				booksAndDocuments,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("books_and_documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "users",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameTo("user_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameTo("users")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "user_books",
				type: "changeForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_462ff70f_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_462ff70f_yount_fk TO users_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "books_and_documents",
					},
					{
						from: "users",
						to: "user_books",
					},
				]);
			},
		});
	});

	test<DbContext>("kepp unique constraint", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
			.execute();

		const booksAndDocuments = table({
			columns: {
				id: integer(),
			},
			constraints: {
				unique: [unique(["id"])],
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("books_and_documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "books_and_documents",
					},
				]);
			},
		});
	});

	test<DbContext>("add unique constraint", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const booksAndDocuments = table({
			columns: {
				id: integer(),
			},
			constraints: {
				unique: [unique(["id"])],
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("books_and_documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4010,
				tableName: "books_and_documents",
				type: "createUniqueConstraint",
				up: [
					[
						`await db.withSchema("public").schema`,
						`alterTable("books_and_documents")`,
						`addUniqueConstraint("books_and_documents_acdd8fa3_yount_key", ["id"])`,
						`execute();`,
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'dropConstraint("books_and_documents_acdd8fa3_yount_key")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "books_and_documents",
					},
				]);
			},
		});
	});

	test<DbContext>("drop unique constraint", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
			.execute();

		const booksAndDocuments = table({
			columns: {
				id: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
			},
		});

		const expected = [
			{
				priority: 811,
				tableName: "books",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("books_and_documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "books_and_documents",
					},
				]);
			},
		});
	});

	test<DbContext>("drop some unique constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("count", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_d0c857aa_yount_key", ["count"])
			.execute();

		const booksAndDocuments = table({
			columns: {
				id: integer(),
				count: integer(),
			},
			constraints: {
				unique: [unique(["count"])],
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
			},
		});

		const expected = [
			{
				priority: 811,
				tableName: "books",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("books_and_documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "books_and_documents",
					},
				]);
			},
		});
	});

	test<DbContext>("drop all unique constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("count", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_d0c857aa_yount_key", ["count"])
			.execute();

		const booksAndDocuments = table({
			columns: {
				id: integer(),
				count: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
			},
		});

		const expected = [
			{
				priority: 811,
				tableName: "books",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_acdd8fa3_yount_key", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 811,
				tableName: "books",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_d0c857aa_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_d0c857aa_yount_key", ["count"])',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("books_and_documents")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "books_and_documents",
					},
				]);
			},
		});
	});

	test<DbContext>("keep index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_0c84fd75_yount_idx")
			.on("books")
			.columns(["id"])
			.execute();

		const newBooks = table({
			columns: {
				id: integer(),
			},
			indexes: [index(["id"])],
		});

		const dbSchema = schema({
			tables: {
				newBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("new_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 5001,
				tableName: "new_books",
				type: "changeIndex",
				up: [
					[
						"await sql`ALTER INDEX books_0c84fd75_yount_idx RENAME TO new_books_0c84fd75_yount_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX new_books_0c84fd75_yount_idx RENAME TO books_0c84fd75_yount_idx`",
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "new_books",
					},
				]);
			},
		});
	});

	test<DbContext>("keep complex index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("sample_count", "integer")
			.addColumn("rating_count", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_07ceb5ca_yount_idx")
			.on("books")
			.columns(["id", "sample_count"])
			.where("sample_count", ">", 20)
			.where(sql.ref("rating_count"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const newBooks = table({
			columns: {
				id: integer(),
				sampleCount: integer(),
				ratingCount: integer(),
			},
			indexes: [
				index(["id", "sampleCount"])
					.where("sampleCount", ">", 20)
					.where(sql.ref("ratingCount"), ">", 5)
					.nullsNotDistinct()
					.using("btree")
					.unique(),
			],
		});

		const dbSchema = schema({
			tables: {
				newBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("new_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 5001,
				tableName: "new_books",
				type: "changeIndex",
				up: [
					[
						"await sql`ALTER INDEX books_07ceb5ca_yount_idx RENAME TO new_books_07ceb5ca_yount_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX new_books_07ceb5ca_yount_idx RENAME TO books_07ceb5ca_yount_idx`",
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "new_books",
					},
				]);
			},
		});
	});

	test<DbContext>("add index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("book_id", "integer")
			.execute();

		const newBooks = table({
			columns: {
				bookId: integer(),
			},
			indexes: [index(["bookId"])],
		});

		const dbSchema = schema({
			tables: {
				newBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("new_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "new_books",
				type: "createIndex",
				up: [
					[
						'await sql`create index "new_books_03cf58de_yount_idx" on "public"."new_books" ("book_id")`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("new_books_03cf58de_yount_idx")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "new_books",
					},
				]);
				mockColumnDiffOnce({
					new_books: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("add complex index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("book_id", "integer")
			.addColumn("sample_count", "integer")
			.addColumn("rating_count", "integer")
			.execute();

		const newBooks = table({
			columns: {
				bookId: integer(),
				sampleCount: integer(),
				ratingCount: integer(),
			},
			indexes: [
				index(["bookId", "sampleCount"])
					.where("sampleCount", ">", 20)
					.where(sql.ref("ratingCount"), ">", 5)
					.nullsNotDistinct()
					.using("btree")
					.unique(),
			],
		});

		const dbSchema = schema({
			tables: {
				newBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("new_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "new_books",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "new_books_d92f1fb8_yount_idx" on "public"."new_books" using btree ("book_id", "sample_count") nulls not distinct where "sample_count" > 20 and "rating_count" > 5`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("new_books_d92f1fb8_yount_idx")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "new_books",
					},
				]);
			},
		});
	});

	test<DbContext>("add multiple indexes", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("book_id", "integer")
			.addColumn("sample_count", "integer")
			.addColumn("rating_count", "integer")
			.execute();

		const newBooks = table({
			columns: {
				bookId: integer(),
				sampleCount: integer(),
				ratingCount: integer(),
			},
			indexes: [
				index(["bookId"]),
				index(["bookId", "sampleCount"])
					.where("sampleCount", ">", 20)
					.where(sql.ref("ratingCount"), ">", 5)
					.nullsNotDistinct()
					.using("btree")
					.unique(),
			],
		});

		const dbSchema = schema({
			tables: {
				newBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("new_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "new_books",
				type: "createIndex",
				up: [
					[
						'await sql`create index "new_books_03cf58de_yount_idx" on "public"."new_books" ("book_id")`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("new_books_03cf58de_yount_idx")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "new_books",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "new_books_d92f1fb8_yount_idx" on "public"."new_books" using btree ("book_id", "sample_count") nulls not distinct where "sample_count" > 20 and "rating_count" > 5`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("new_books_d92f1fb8_yount_idx")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "new_books",
					},
				]);
			},
		});
	});

	test<DbContext>("drop index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_0c84fd75_yount_idx")
			.on("books")
			.columns(["id"])
			.execute();

		const newBooks = table({
			columns: {
				id: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				newBooks,
			},
		});

		const expected = [
			{
				priority: 800,
				tableName: "books",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_0c84fd75_yount_idx")',
						"execute();",
					],
				],
				down: [
					[
						"await sql`CREATE INDEX books_0c84fd75_yount_idx ON public.books USING btree (id)`",
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("new_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "new_books",
					},
				]);
			},
		});
	});

	test<DbContext>("drop complex index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("sample_count", "integer")
			.addColumn("rating_count", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_07ceb5ca_yount_idx")
			.on("books")
			.columns(["id", "sample_count"])
			.where("sample_count", ">", 20)
			.where(sql.ref("rating_count"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const newBooks = table({
			columns: {
				id: integer(),
				sampleCount: integer(),
				ratingCount: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				newBooks,
			},
		});

		const expected = [
			{
				priority: 800,
				tableName: "books",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_07ceb5ca_yount_idx")',
						"execute();",
					],
				],
				down: [
					[
						"await sql`CREATE UNIQUE INDEX books_07ceb5ca_yount_idx ON public.books USING btree (id, sample_count) NULLS NOT DISTINCT WHERE ((sample_count > 20) AND (rating_count > 5))`",
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				type: "changeTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameTo("new_books")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameTo("books")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				camelCasePlugin: { enabled: true },
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "books",
						to: "new_books",
					},
				]);
			},
		});
	});
});
