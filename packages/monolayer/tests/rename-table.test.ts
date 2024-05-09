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
				currentTableName: "teams",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "users",
							to: "teams",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
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
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: { schemas: [dbSchema] },
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
			.addCheckConstraint(
				"books_2f1f415e_monolayer_chk",
				sql`${sql.ref("id")} > 5`,
			)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint(
				"books_e37c55a5_monolayer_chk",
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
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: { schemas: [dbSchema] },
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
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "publications",
				schemaName: "public",
				type: "createCheckConstraint",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("publications")
    .addCheckConstraint("publications_2f1f415e_monolayer_chk", sql\`"id" > 5\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."publications" VALIDATE CONSTRAINT "publications_2f1f415e_monolayer_chk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_2f1f415e_monolayer_chk")',
						"execute();",
					],
				],
			},
			{
				priority: 4012,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "createCheckConstraint",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("publications")
    .addCheckConstraint("publications_e37c55a5_monolayer_chk", sql\`"id" < 50000\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."publications" VALIDATE CONSTRAINT "publications_e37c55a5_monolayer_chk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_e37c55a5_monolayer_chk")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
			.addCheckConstraint(
				"books_2f1f415e_monolayer_chk",
				sql`${sql.ref("id")} > 5`,
			)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint(
				"books_e37c55a5_monolayer_chk",
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
				currentTableName: "publications",
				schemaName: "public",
				type: "dropCheckConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_2f1f415e_monolayer_chk")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_2f1f415e_monolayer_chk" CHECK ((id > 5)) NOT VALID`',
						"execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_2f1f415e_monolayer_chk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: { schemas: [dbSchema] },
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
			.addCheckConstraint(
				"books_2f1f415e_monolayer_chk",
				sql`${sql.ref("id")} > 5`,
			)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint(
				"books_e37c55a5_monolayer_chk",
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
				currentTableName: "publications",
				schemaName: "public",
				type: "dropCheckConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_2f1f415e_monolayer_chk")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_2f1f415e_monolayer_chk" CHECK ((id > 5)) NOT VALID`',
						"execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_2f1f415e_monolayer_chk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 812,
				tableName: "books",
				currentTableName: "publications",
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
			{
				priority: 900,
				tableName: "books",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: { schemas: [dbSchema] },
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
			.addPrimaryKeyConstraint("books_id_monolayer_pk", ["id"])
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
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: { schemas: [dbSchema] },
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
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
				schemaName: "public",
				tableName: "publications",
				currentTableName: "publications",
				type: "changeColumn",
				up: [],
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
				currentTableName: "publications",
				schemaName: "public",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addPrimaryKeyConstraint("publications_monolayer_pk", ["id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_monolayer_pk")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "publications",
				schemaName: "public",
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
				currentTableName: "publications",
				schemaName: "public",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addPrimaryKeyConstraint("publications_monolayer_pk", ["id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_monolayer_pk")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["id"])
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
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "publications",
				schemaName: "public",
				type: "dropPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("books_monolayer_pk")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addPrimaryKeyConstraint("books_monolayer_pk", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 3008,
				schemaName: "public",
				tableName: "publications",
				currentTableName: "publications",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("id", (col) => col.dropNotNull())',
						"execute();",
					],
				],
				down: [],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["id"])
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
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "publications",
				schemaName: "public",
				type: "dropPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("books_monolayer_pk")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addPrimaryKeyConstraint("books_monolayer_pk", ["id"])',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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

	test<DbContext>("rename self foreign key table", async (context) => {
		await context.kysely.schema
			.createTable("tree")
			.addColumn("node_id", "integer", (col) => col.generatedAlwaysAsIdentity())
			.addColumn("parent_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("tree")
			.addPrimaryKeyConstraint("tree_monolayer_pk", ["node_id"])
			.execute();

		await context.kysely.schema
			.alterTable("tree")
			.addForeignKeyConstraint(
				"tree_136bac6e_monolayer_fk",
				["parent_id"],
				"tree",
				["node_id"],
			)
			.onDelete("no action")
			.onUpdate("no action")
			.execute();

		const trees = table({
			columns: {
				node_id: integer().generatedAlwaysAsIdentity(),
				parent_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["node_id"]),
				foreignKeys: [foreignKey(["parent_id"], ["node_id"])],
			},
		});

		const dbSchema = schema({
			tables: {
				trees,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "tree",
				currentTableName: "trees",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "tree",
							to: "trees",
						},
						type: "backwardIncompatible",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("tree")',
						'renameTo("trees")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("trees")',
						'renameTo("tree")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "trees",
				currentTableName: "trees",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."trees" RENAME CONSTRAINT tree_136bac6e_monolayer_fk TO trees_66cc3267_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."trees" RENAME CONSTRAINT trees_66cc3267_monolayer_fk TO tree_136bac6e_monolayer_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "tree",
						to: "trees",
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
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
				currentTableName: "persons",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "users",
							to: "persons",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "persons",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO persons_16f1d83f_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_16f1d83f_monolayer_fk TO users_58e6ca22_monolayer_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
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
				currentTableName: "documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "documents",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "users",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO users_58b24530_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_58b24530_monolayer_fk TO users_58e6ca22_monolayer_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
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
				currentTableName: "documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "documents",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "persons",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "users",
							to: "persons",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "persons",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO persons_6c80eabf_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_6c80eabf_monolayer_fk TO users_58e6ca22_monolayer_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
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
				currentTableName: "persons",
				schemaName: "public",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "users",
							to: "persons",
						},
						type: "backwardIncompatible",
					},
				],
				type: "renameTable",
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
				currentTableName: "persons",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO persons_16f1d83f_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_16f1d83f_monolayer_fk TO users_58e6ca22_monolayer_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
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
				currentTableName: "documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "documents",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "users",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO users_58b24530_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_58b24530_monolayer_fk TO users_58e6ca22_monolayer_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
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
				currentTableName: "documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "documents",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "persons",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "users",
							to: "persons",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "persons",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO persons_6c80eabf_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_6c80eabf_monolayer_fk TO users_58e6ca22_monolayer_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
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
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: { schemas: [dbSchema] },
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
				currentTableName: "publications",
				schemaName: "public",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
				type: "renameTable",
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
				currentTableName: "publications",
				schemaName: "public",
				type: "createUniqueConstraint",
				up: [
					[
						`await db.withSchema("public").schema`,
						`alterTable("publications")`,
						`addUniqueConstraint("publications_acdd8fa3_monolayer_key", ["id"])`,
						`execute();`,
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_acdd8fa3_monolayer_key")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
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
				currentTableName: "publications",
				schemaName: "public",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_monolayer_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: { schemas: [dbSchema] },
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_d0c857aa_monolayer_key", ["count"])
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
				currentTableName: "publications",
				schemaName: "public",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_monolayer_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: { schemas: [dbSchema] },
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_d0c857aa_monolayer_key", ["count"])
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
				currentTableName: "publications",
				schemaName: "public",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_monolayer_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 811,
				tableName: "books",
				currentTableName: "publications",
				schemaName: "public",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_d0c857aa_monolayer_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_d0c857aa_monolayer_key", ["count"])',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: { schemas: [dbSchema] },
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
			.createIndex("books_0c84fd75_monolayer_idx")
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
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "publications",
				schemaName: "public",
				type: "renameIndex",
				up: [
					[
						"await sql`ALTER INDEX books_0c84fd75_monolayer_idx RENAME TO publications_0c84fd75_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX publications_0c84fd75_monolayer_idx RENAME TO books_0c84fd75_monolayer_idx`",
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
			.createIndex("publications_6b9be986_monolayer_idx")
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
				currentTableName: "books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "publications",
							to: "books",
						},
						type: "backwardIncompatible",
					},
				],
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
						"await sql`ALTER INDEX books_6b9be986_monolayer_idx RENAME TO publications_6b9be986_monolayer_idx`",
						"execute(db);",
					],
				],
				priority: 5001,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameIndex",
				up: [
					[
						"await sql`ALTER INDEX publications_6b9be986_monolayer_idx RENAME TO books_6b9be986_monolayer_idx`",
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "publications",
				schemaName: "public",
				type: "createIndex",
				up: [
					[
						'await sql`create index "publications_0c84fd75_monolayer_idx" on "public"."publications" ("id")`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_0c84fd75_monolayer_idx")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "publications",
				schemaName: "public",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "publications_6b9be986_monolayer_idx" on "public"."publications" using btree ("id", "samples") nulls not distinct where "samples" > 20 and "ratings" > 5`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_6b9be986_monolayer_idx")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "publications",
				schemaName: "public",
				type: "createIndex",
				up: [
					[
						'await sql`create index "publications_0c84fd75_monolayer_idx" on "public"."publications" ("id")`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_0c84fd75_monolayer_idx")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "publications_6b9be986_monolayer_idx" on "public"."publications" using btree ("id", "samples") nulls not distinct where "samples" > 20 and "ratings" > 5`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_6b9be986_monolayer_idx")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
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
			.createIndex("books_0c84fd75_monolayer_idx")
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
				currentTableName: "publications",
				schemaName: "public",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_0c84fd75_monolayer_idx")',
						"execute();",
					],
				],
				down: [
					[
						"await sql`CREATE INDEX books_0c84fd75_monolayer_idx ON public.books USING btree (id)`",
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: { schemas: [dbSchema] },
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
			.createIndex("publications_6b9be986_monolayer_idx")
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
				currentTableName: "books",
				schemaName: "public",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_6b9be986_monolayer_idx")',
						"execute();",
					],
				],
				down: [
					[
						"await sql`CREATE UNIQUE INDEX publications_6b9be986_monolayer_idx ON public.publications USING btree (id, samples) NULLS NOT DISTINCT WHERE ((samples > 20) AND (ratings > 5))`",
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "publications",
				currentTableName: "books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "publications",
							to: "books",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: { schemas: [dbSchema] },
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
				currentTableName: "new_users",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "users",
							to: "new_users",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: {
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "new_books",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: {
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
			.addCheckConstraint(
				"books_2f1f415e_monolayer_chk",
				sql`${sql.ref("id")} > 5`,
			)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint(
				"books_e37c55a5_monolayer_chk",
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "books_and_documents",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: {
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "books_and_documents",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "createCheckConstraint",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("books_and_documents")
    .addCheckConstraint("books_and_documents_dc912898_monolayer_chk", sql\`"book_id" > 5\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."books_and_documents" VALIDATE CONSTRAINT "books_and_documents_dc912898_monolayer_chk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'dropConstraint("books_and_documents_dc912898_monolayer_chk")',
						"execute();",
					],
				],
			},
			{
				priority: 4012,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "createCheckConstraint",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("books_and_documents")
    .addCheckConstraint("books_and_documents_f685097b_monolayer_chk", sql\`"book_id" < 50000\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."books_and_documents" VALIDATE CONSTRAINT "books_and_documents_f685097b_monolayer_chk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'dropConstraint("books_and_documents_f685097b_monolayer_chk")',
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
			.addCheckConstraint(
				"books_2f1f415e_monolayer_chk",
				sql`${sql.ref("id")} > 5`,
			)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint(
				"books_e37c55a5_monolayer_chk",
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "dropCheckConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_2f1f415e_monolayer_chk")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_2f1f415e_monolayer_chk" CHECK ((id > 5)) NOT VALID`',
						"execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_2f1f415e_monolayer_chk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "books_and_documents",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: {
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
			.addCheckConstraint(
				"books_2f1f415e_monolayer_chk",
				sql`${sql.ref("id")} > 5`,
			)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint(
				"books_e37c55a5_monolayer_chk",
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
				currentTableName: "publications",
				schemaName: "public",
				type: "dropCheckConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_2f1f415e_monolayer_chk")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_2f1f415e_monolayer_chk" CHECK ((id > 5)) NOT VALID`',
						"execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_2f1f415e_monolayer_chk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 812,
				tableName: "books",
				currentTableName: "publications",
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
			{
				priority: 900,
				tableName: "books",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "publications",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: { schemas: [dbSchema] },
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "new_books",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: {
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "new_books",
						},
						type: "backwardIncompatible",
					},
				],
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
				schemaName: "public",
				tableName: "new_books",
				currentTableName: "new_books",
				type: "changeColumn",
				up: [],
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'addPrimaryKeyConstraint("new_books_monolayer_pk", ["book_id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'dropConstraint("new_books_monolayer_pk")',
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "new_books",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "new_books",
				schemaName: "public",
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'addPrimaryKeyConstraint("new_books_monolayer_pk", ["book_id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'dropConstraint("new_books_monolayer_pk")',
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["book_id"])
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "new_books",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "dropPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'dropConstraint("books_monolayer_pk")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'addPrimaryKeyConstraint("books_monolayer_pk", ["book_id"])',
						"execute();",
					],
				],
			},
			{
				priority: 3008,
				schemaName: "public",
				tableName: "new_books",
				currentTableName: "new_books",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'alterColumn("book_id", (col) => col.dropNotNull())',
						"execute();",
					],
				],
				down: [],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: {
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["book_id"])
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "new_books",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "dropPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'dropConstraint("books_monolayer_pk")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'addPrimaryKeyConstraint("books_monolayer_pk", ["book_id"])',
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

	test<DbContext>("rename self foreign key table", async (context) => {
		await context.kysely.schema
			.createTable("tree")
			.addColumn("node_id", "integer", (col) => col.generatedAlwaysAsIdentity())
			.addColumn("parent_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("tree")
			.addPrimaryKeyConstraint("tree_monolayer_pk", ["node_id"])
			.execute();

		await context.kysely.schema
			.alterTable("tree")
			.addForeignKeyConstraint(
				"tree_136bac6e_monolayer_fk",
				["parent_id"],
				"tree",
				["node_id"],
			)
			.onDelete("no action")
			.onUpdate("no action")
			.execute();

		const myTree = table({
			columns: {
				node_id: integer().generatedAlwaysAsIdentity(),
				parent_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["node_id"]),
				foreignKeys: [foreignKey(["parent_id"], ["node_id"])],
			},
		});

		const dbSchema = schema({
			tables: {
				myTree,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "tree",
				currentTableName: "my_tree",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "tree",
							to: "my_tree",
						},
						type: "backwardIncompatible",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("tree")',
						'renameTo("my_tree")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("my_tree")',
						'renameTo("tree")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "my_tree",
				currentTableName: "my_tree",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."my_tree" RENAME CONSTRAINT tree_136bac6e_monolayer_fk TO my_tree_a8a26230_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."my_tree" RENAME CONSTRAINT my_tree_a8a26230_monolayer_fk TO tree_136bac6e_monolayer_fk`',
						"execute(db);",
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
			expected: expected,
			down: "same",
			mock: () => {
				mockTableDiffOnce([
					{
						from: "tree",
						to: "my_tree",
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
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
				currentTableName: "user_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "users",
							to: "user_books",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "user_books",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO user_books_80865747_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_80865747_monolayer_fk TO users_58e6ca22_monolayer_fk`',
						"execute(db);",
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "books_and_documents",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "users",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO users_33c2dce1_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_33c2dce1_monolayer_fk TO users_58e6ca22_monolayer_fk`',
						"execute(db);",
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "books_and_documents",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "user_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "users",
							to: "user_books",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "user_books",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO user_books_33945117_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_33945117_monolayer_fk TO users_58e6ca22_monolayer_fk`',
						"execute(db);",
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["id", "location_id"])
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
				"users_6f4acd2f_monolayer_fk",
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
				currentTableName: "book_users",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "users",
							to: "book_users",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "book_users",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."book_users" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO book_users_9b641e3b_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."book_users" RENAME CONSTRAINT book_users_9b641e3b_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
						"execute(db);",
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["id", "location_id"])
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
				"users_6f4acd2f_monolayer_fk",
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "books_and_documents",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "users",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO users_38362c18_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_38362c18_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
						"execute(db);",
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
			.addPrimaryKeyConstraint("books_monolayer_pk", ["id", "location_id"])
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
				"users_6f4acd2f_monolayer_fk",
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "books_and_documents",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "user_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "users",
							to: "user_books",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "user_books",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO user_books_43c8d0e8_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_43c8d0e8_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
						"execute(db);",
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

	test<DbContext>("keep unique constraint", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "books_and_documents",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: {
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "books_and_documents",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "createUniqueConstraint",
				up: [
					[
						`await db.withSchema("public").schema`,
						`alterTable("books_and_documents")`,
						`addUniqueConstraint("books_and_documents_acdd8fa3_monolayer_key", ["id"])`,
						`execute();`,
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'dropConstraint("books_and_documents_acdd8fa3_monolayer_key")',
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_monolayer_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "books_and_documents",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: {
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_d0c857aa_monolayer_key", ["count"])
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_monolayer_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "books_and_documents",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: {
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_d0c857aa_monolayer_key", ["count"])
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_monolayer_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])',
						"execute();",
					],
				],
			},
			{
				priority: 811,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "dropUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_d0c857aa_monolayer_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_d0c857aa_monolayer_key", ["count"])',
						"execute();",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "books_and_documents",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: {
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
			.createIndex("books_0c84fd75_monolayer_idx")
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "new_books",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameIndex",
				up: [
					[
						"await sql`ALTER INDEX books_0c84fd75_monolayer_idx RENAME TO new_books_0c84fd75_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX new_books_0c84fd75_monolayer_idx RENAME TO books_0c84fd75_monolayer_idx`",
						"execute(db);",
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
			.createIndex("books_07ceb5ca_monolayer_idx")
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "new_books",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameIndex",
				up: [
					[
						"await sql`ALTER INDEX books_07ceb5ca_monolayer_idx RENAME TO new_books_07ceb5ca_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX new_books_07ceb5ca_monolayer_idx RENAME TO books_07ceb5ca_monolayer_idx`",
						"execute(db);",
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "new_books",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "createIndex",
				up: [
					[
						'await sql`create index "new_books_03cf58de_monolayer_idx" on "public"."new_books" ("book_id")`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("new_books_03cf58de_monolayer_idx")',
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "new_books",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "new_books_d92f1fb8_monolayer_idx" on "public"."new_books" using btree ("book_id", "sample_count") nulls not distinct where "sample_count" > 20 and "rating_count" > 5`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("new_books_d92f1fb8_monolayer_idx")',
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "new_books",
						},
						type: "backwardIncompatible",
					},
				],
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "createIndex",
				up: [
					[
						'await sql`create index "new_books_03cf58de_monolayer_idx" on "public"."new_books" ("book_id")`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("new_books_03cf58de_monolayer_idx")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "new_books_d92f1fb8_monolayer_idx" on "public"."new_books" using btree ("book_id", "sample_count") nulls not distinct where "sample_count" > 20 and "rating_count" > 5`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("new_books_d92f1fb8_monolayer_idx")',
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
			.createIndex("books_0c84fd75_monolayer_idx")
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_0c84fd75_monolayer_idx")',
						"execute();",
					],
				],
				down: [
					[
						"await sql`CREATE INDEX books_0c84fd75_monolayer_idx ON public.books USING btree (id)`",
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "new_books",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: {
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
			.createIndex("books_07ceb5ca_monolayer_idx")
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
				currentTableName: "new_books",
				schemaName: "public",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_07ceb5ca_monolayer_idx")',
						"execute();",
					],
				],
				down: [
					[
						"await sql`CREATE UNIQUE INDEX books_07ceb5ca_monolayer_idx ON public.books USING btree (id, sample_count) NULLS NOT DISTINCT WHERE ((sample_count > 20) AND (rating_count > 5))`",
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameTable",
				warnings: [
					{
						code: "BI001",
						schema: "public",
						tableRename: {
							from: "books",
							to: "new_books",
						},
						type: "backwardIncompatible",
					},
				],
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
			configuration: {
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
