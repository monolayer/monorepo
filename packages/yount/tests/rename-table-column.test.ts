/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test, vi } from "vitest";
import {
	bigint,
	check,
	foreignKey,
	index,
	integer,
	primaryKey,
	schema,
	table,
	unique,
} from "~/pg.js";
import type { DbContext } from "./__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "./__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "./__setup__/helpers/test-context.js";
import { mockColumnDiffOnce, mockTableDiffOnce } from "./__setup__/setup.js";

describe("Rename table and column without camel case plugin", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
		vi.restoreAllMocks();
	});

	test<DbContext>("table and columns", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				publication_id: integer(),
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "publication_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("publication_id", "id")',
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "publication_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("table and column and type", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				publication_id: bigint(),
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "publication_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("publication_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3001,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("publication_id", (col) => col.setDataType(sql`bigint`))',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("publication_id", (col) => col.setDataType(sql`integer`))',
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "publication_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("kepp check constraint", async (context) => {
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
				identifier: integer(),
			},
			constraints: {
				checks: [
					check(sql`${sql.ref("identifier")} > 5`),
					check(sql`${sql.ref("identifier")} < 50000`),
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "identifier")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("identifier", "id")',
						"execute();",
					],
				],
			},
			{
				down: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT publications_a80ce83d_yount_chk TO books_2f1f415e_yount_chk`',
						"execute(db);",
					],
				],
				priority: 5002,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeCheckConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT books_2f1f415e_yount_chk TO publications_a80ce83d_yount_chk`',
						"execute(db);",
					],
				],
			},
			{
				down: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT publications_b3606c7d_yount_chk TO books_e37c55a5_yount_chk`',
						"execute(db);",
					],
				],
				priority: 5002,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeCheckConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT books_e37c55a5_yount_chk TO publications_b3606c7d_yount_chk`',
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "identifier",
						},
					],
				});
			},
		});
	});

	test<DbContext>("add check constraint", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				identifier: integer(),
			},
			constraints: {
				checks: [
					check(sql`${sql.ref("identifier")} > 5`),
					check(sql`${sql.ref("identifier")} < 50000`),
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "identifier")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("identifier", "id")',
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
    .addCheckConstraint("publications_a80ce83d_yount_chk", sql\`"identifier" > 5\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."publications" VALIDATE CONSTRAINT "publications_a80ce83d_yount_chk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_a80ce83d_yount_chk")',
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
    .addCheckConstraint("publications_b3606c7d_yount_chk", sql\`"identifier" < 50000\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."publications" VALIDATE CONSTRAINT "publications_b3606c7d_yount_chk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_b3606c7d_yount_chk")',
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "identifier",
						},
					],
				});
			},
		});
	});

	test<DbContext>("drop check constraint", async (context) => {
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
				identifier: integer(),
			},
			constraints: {
				checks: [check(sql`${sql.ref("identifier")} < 50000`)],
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
				currentTableName: "publications",
				schemaName: "public",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "identifier")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("identifier", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeCheckConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT books_e37c55a5_yount_chk TO publications_b3606c7d_yount_chk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT publications_b3606c7d_yount_chk TO books_e37c55a5_yount_chk`',
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "identifier",
						},
					],
				});
			},
		});
	});

	test<DbContext>("drop all checks constraints", async (context) => {
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
				identifier: integer(),
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
				currentTableName: "publications",
				schemaName: "public",
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
				currentTableName: "publications",
				schemaName: "public",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "identifier")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("identifier", "id")',
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "identifier",
						},
					],
				});
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
				identifier: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["identifier"]),
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "identifier")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("identifier", "id")',
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "identifier",
						},
					],
				});
			},
		});
	});

	test<DbContext>("add primary key on renamed column", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				identifier: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["identifier"]),
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "identifier")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("identifier", "id")',
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
						'alterColumn("identifier", (col) => col.dropNotNull())',
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
						'addPrimaryKeyConstraint("publications_yount_pk", ["identifier"])',
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "identifier",
						},
					],
				});
			},
		});
	});

	test<DbContext>("add primary key on renamed column not null", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const publications = table({
			columns: {
				identifier: integer().notNull(),
			},
			constraints: {
				primaryKey: primaryKey(["identifier"]),
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "identifier")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("identifier", "id")',
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
						'alterColumn("identifier", (col) => col.setNotNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("identifier", (col) => col.dropNotNull())',
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
						'addPrimaryKeyConstraint("publications_yount_pk", ["identifier"])',
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "identifier",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key parent table and parent column", async (context) => {
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
				document_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["document_id"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], documents, ["document_id"])
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("document_id", "id")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_44bd42ca_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_44bd42ca_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					documents: [
						{
							from: "id",
							to: "document_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key parent table and child column", async (context) => {
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
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], documents, ["id"])
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
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_id", "book_id")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_c234a11e_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c234a11e_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					users: [
						{
							from: "book_id",
							to: "document_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key child table and child column", async (context) => {
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
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], books, ["id"])
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
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_id", "book_id")',
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
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_12f9128c_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_12f9128c_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					persons: [
						{
							from: "book_id",
							to: "document_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key child table and parent column", async (context) => {
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
				book_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["book_id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], books, ["book_id"])
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("book_id", "id")',
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
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_c3276eac_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_c3276eac_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					books: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key child table, parent table, and child column", async (context) => {
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
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], documents, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
				persons,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "documents",
				schemaName: "public",
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
				currentTableName: "persons",
				schemaName: "public",
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
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_id", "book_id")',
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
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_c234a11e_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_c234a11e_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					persons: [
						{
							from: "book_id",
							to: "document_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key child table, parent table, and parent column", async (context) => {
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
				book_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["book_id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], documents, ["book_id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
				persons,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "documents",
				schemaName: "public",
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
				currentTableName: "persons",
				schemaName: "public",
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("book_id", "id")',
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
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_ba2ce7c9_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_ba2ce7c9_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					documents: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key parent table, parent column, and child column", async (context) => {
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
				book_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["book_id"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], documents, ["book_id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
				users,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "documents",
				schemaName: "public",
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_id", "book_id")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_c0179c30_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c0179c30_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					documents: [
						{
							from: "id",
							to: "book_id",
						},
					],
					users: [
						{
							from: "book_id",
							to: "document_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key child table, child column, and parent column", async (context) => {
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
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], documents, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
				persons,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "documents",
				schemaName: "public",
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
				currentTableName: "persons",
				schemaName: "public",
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
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_id", "book_id")',
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
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_c234a11e_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_c234a11e_yount_fk TO users_c02e3d7d_yount_fk`',
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
					{
						from: "books",
						to: "documents",
					},
				]);
				mockColumnDiffOnce({
					persons: [
						{
							from: "book_id",
							to: "document_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key child table, parent table, parent column, and child column", async (context) => {
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
				book_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["book_id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], documents, ["book_id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
				persons,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "documents",
				schemaName: "public",
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
				currentTableName: "persons",
				schemaName: "public",
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_id", "book_id")',
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
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_c0179c30_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_c0179c30_yount_fk TO users_c02e3d7d_yount_fk`',
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
					{
						from: "books",
						to: "documents",
					},
				]);
				mockColumnDiffOnce({
					documents: [
						{
							from: "id",
							to: "book_id",
						},
					],
					persons: [
						{
							from: "book_id",
							to: "document_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key parent table and parent column", async (context) => {
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

		const documents = table({
			columns: {
				document_id: integer(),
				new_location_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["document_id", "new_location_id"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				book_id: integer(),
				book_location_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id", "book_location_id"], documents, [
						"document_id",
						"new_location_id",
					])
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("document_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("location_id", "new_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("new_location_id", "location_id")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_d3091021_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_d3091021_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					documents: [
						{
							from: "id",
							to: "document_id",
						},
						{
							from: "location_id",
							to: "new_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key parent table and child column", async (context) => {
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

		const documents = table({
			columns: {
				id: integer(),
				location_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id", "location_id"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				document_id: integer(),
				document_location_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id", "document_location_id"], documents, [
						"id",
						"location_id",
					])
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
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_location_id", "document_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_location_id", "book_location_id")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_4ac9e5d2_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_4ac9e5d2_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					users: [
						{
							from: "book_id",
							to: "document_id",
						},
						{
							from: "book_location_id",
							to: "document_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key child table and child column", async (context) => {
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
				location_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id", "location_id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				document_id: integer(),
				document_location_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id", "document_location_id"], books, [
						"id",
						"location_id",
					])
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
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_location_id", "document_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_location_id", "book_location_id")',
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
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_73ffb2a8_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_73ffb2a8_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					persons: [
						{
							from: "book_id",
							to: "document_id",
						},
						{
							from: "book_location_id",
							to: "document_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key child table and parent column", async (context) => {
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
				book_id: integer(),
				new_location_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["book_id", "new_location_id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				book_id: integer(),
				book_location_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id", "book_location_id"], books, [
						"book_id",
						"new_location_id",
					])
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("location_id", "new_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("new_location_id", "location_id")',
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
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_8e7302ef_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_8e7302ef_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					books: [
						{
							from: "id",
							to: "book_id",
						},
						{
							from: "location_id",
							to: "new_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key child column and parent column", async (context) => {
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
				book_id: integer(),
				new_location_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["book_id", "new_location_id"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				document_id: integer(),
				document_location_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id", "document_location_id"], books, [
						"book_id",
						"new_location_id",
					])
						.updateRule("set null")
						.deleteRule("set null"),
				],
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("location_id", "new_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("new_location_id", "location_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_location_id", "document_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_location_id", "book_location_id")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_998f2e77_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_998f2e77_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					books: [
						{
							from: "id",
							to: "book_id",
						},
						{
							from: "location_id",
							to: "new_location_id",
						},
					],
					users: [
						{
							from: "book_id",
							to: "document_id",
						},
						{
							from: "book_location_id",
							to: "document_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key child table, parent table, and child column", async (context) => {
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

		const documents = table({
			columns: {
				id: integer(),
				location_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id", "location_id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				document_id: integer(),
				document_location_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id", "document_location_id"], documents, [
						"id",
						"location_id",
					])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
				persons,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "documents",
				schemaName: "public",
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
				currentTableName: "persons",
				schemaName: "public",
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
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_location_id", "document_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_location_id", "book_location_id")',
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
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_4ac9e5d2_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_4ac9e5d2_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					persons: [
						{
							from: "book_id",
							to: "document_id",
						},
						{
							from: "book_location_id",
							to: "document_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key child table, parent table, and parent column", async (context) => {
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

		const documents = table({
			columns: {
				book_id: integer(),
				new_location_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["book_id", "new_location_id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				book_id: integer(),
				book_location_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id", "book_location_id"], documents, [
						"book_id",
						"new_location_id",
					])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
				persons,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "documents",
				schemaName: "public",
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
				currentTableName: "persons",
				schemaName: "public",
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("location_id", "new_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("new_location_id", "location_id")',
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
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_585d1288_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_585d1288_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					documents: [
						{
							from: "id",
							to: "book_id",
						},
						{
							from: "location_id",
							to: "new_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key parent table, parent column, and child column", async (context) => {
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

		const documents = table({
			columns: {
				book_id: integer(),
				new_location_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["book_id", "new_location_id"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				document_id: integer(),
				document_location_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id", "document_location_id"], documents, [
						"book_id",
						"new_location_id",
					])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
				users,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "documents",
				schemaName: "public",
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("location_id", "new_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("new_location_id", "location_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_location_id", "document_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_location_id", "book_location_id")',
						"execute();",
					],
				],
			},
			{
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_01ac2967_yount_fk TO users_c02e3d7d_yount_fk`',
						"execute(db);",
					],
				],
				priority: 5002,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "renameForeignKey",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_01ac2967_yount_fk`',
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
				mockColumnDiffOnce({
					documents: [
						{
							from: "id",
							to: "book_id",
						},
						{
							from: "location_id",
							to: "new_location_id",
						},
					],
					users: [
						{
							from: "book_id",
							to: "document_id",
						},
						{
							from: "book_location_id",
							to: "document_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key child table, child column, and parent column", async (context) => {
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

		const documents = table({
			columns: {
				id: integer(),
				location_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id", "location_id"]),
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				document_id: integer(),
				document_location_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id", "document_location_id"], documents, [
						"id",
						"location_id",
					])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
				persons,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "documents",
				schemaName: "public",
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
				currentTableName: "persons",
				schemaName: "public",
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
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_location_id", "document_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_location_id", "book_location_id")',
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
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO persons_4ac9e5d2_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_4ac9e5d2_yount_fk TO users_c02e3d7d_yount_fk`',
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
					{
						from: "books",
						to: "documents",
					},
				]);
				mockColumnDiffOnce({
					persons: [
						{
							from: "book_id",
							to: "document_id",
						},
						{
							from: "book_location_id",
							to: "document_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key child table, parent table, parent column, and child column", async (context) => {
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
				"users_6de35d86_yount_fk",
				["book_id", "book_location_id"],
				"books",
				["id", "location_id"],
			)
			.onDelete("set null")
			.onUpdate("set null")
			.execute();

		const documents = table({
			columns: {
				book_id: integer(),
				new_location_id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["book_id", "new_location_id"]),
				unique: [unique(["new_location_id"])],
			},
		});

		const persons = table({
			columns: {
				id: integer(),
				document_id: integer(),
				new_book_location_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["new_book_location_id"], documents, ["new_location_id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				documents,
				persons,
			},
		});

		const expected = [
			{
				priority: 810,
				tableName: "users",
				currentTableName: "persons",
				schemaName: "public",
				type: "dropForeignKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_6de35d86_yount_fk")',
						"execute();",
					],
				],
				down: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_6de35d86_yount_fk", ["book_id", "book_location_id"], "books", ["id", "location_id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_6de35d86_yount_fk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				currentTableName: "documents",
				schemaName: "public",
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
				currentTableName: "persons",
				schemaName: "public",
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("location_id", "new_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'renameColumn("new_location_id", "location_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("book_location_id", "new_book_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'renameColumn("new_book_location_id", "book_location_id")',
						"execute();",
					],
				],
			},
			{
				priority: 4010,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "createUniqueConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'addUniqueConstraint("documents_c78003f2_yount_key", ["new_location_id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'dropConstraint("documents_c78003f2_yount_key")',
						"execute();",
					],
				],
			},
			{
				priority: 4011,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "createForeignKey",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("persons")
    .addForeignKeyConstraint("persons_63ccbc6d_yount_fk", ["new_book_location_id"], "documents", ["new_location_id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."persons" VALIDATE CONSTRAINT "persons_63ccbc6d_yount_fk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'dropConstraint("persons_63ccbc6d_yount_fk")',
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
						to: "persons",
					},
					{
						from: "books",
						to: "documents",
					},
				]);
				mockColumnDiffOnce({
					documents: [
						{
							from: "id",
							to: "book_id",
						},
						{
							from: "location_id",
							to: "new_location_id",
						},
					],
					persons: [
						{
							from: "book_id",
							to: "document_id",
						},
						{
							from: "book_location_id",
							to: "new_book_location_id",
						},
					],
				});
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
				identifier: integer(),
			},
			constraints: {
				unique: [unique(["identifier"])],
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "identifier")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("identifier", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeUniqueConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT books_acdd8fa3_yount_key TO publications_1c0982e8_yount_key`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT publications_1c0982e8_yount_key TO books_acdd8fa3_yount_key`',
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "identifier",
						},
					],
				});
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
				identifier: integer(),
			},
			constraints: {
				unique: [unique(["identifier"])],
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "identifier")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("identifier", "id")',
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
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'addUniqueConstraint("publications_1c0982e8_yount_key", ["identifier"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_1c0982e8_yount_key")',
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "identifier",
						},
					],
				});
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
				book_id: integer(),
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
				currentTableName: "publications",
				schemaName: "public",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("book_id", "id")',
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
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
				book_id: integer(),
				book_count: integer(),
			},
			constraints: {
				unique: [unique(["book_count"])],
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
				currentTableName: "publications",
				schemaName: "public",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("count", "book_count")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("book_count", "count")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeUniqueConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT books_d0c857aa_yount_key TO publications_f2bf9399_yount_key`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT publications_f2bf9399_yount_key TO books_d0c857aa_yount_key`',
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "book_id",
						},
						{
							from: "count",
							to: "book_count",
						},
					],
				});
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
				book_id: integer(),
				book_count: integer(),
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
				currentTableName: "publications",
				schemaName: "public",
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
				currentTableName: "publications",
				schemaName: "public",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("count", "book_count")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("book_count", "count")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("book_id", "id")',
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "book_id",
						},
						{
							from: "count",
							to: "book_count",
						},
					],
				});
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
				book_id: integer(),
			},
			indexes: [index(["book_id"])],
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 5001,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeIndex",
				up: [
					[
						"await sql`ALTER INDEX books_0c84fd75_yount_idx RENAME TO publications_03cf58de_yount_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX publications_03cf58de_yount_idx RENAME TO books_0c84fd75_yount_idx`",
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
				mockColumnDiffOnce({
					publications: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
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
				book_id: integer(),
				samples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["book_id", "samples"])
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 5001,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "changeIndex",
				up: [
					[
						"await sql`ALTER INDEX publications_6b9be986_yount_idx RENAME TO books_a338e985_yount_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX books_a338e985_yount_idx RENAME TO publications_6b9be986_yount_idx`",
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
				mockColumnDiffOnce({
					books: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
			},
		});
	});
});

describe("Rename table and column with camel case plugin", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
		vi.restoreAllMocks();
	});

	test<DbContext>("table and columns camel case", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const newBooks = table({
			columns: {
				publicationId: integer(),
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
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("id", "publication_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("publication_id", "id")',
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
							to: "publication_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("table and columns and type camel case", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const newBooks = table({
			columns: {
				publicationId: bigint(),
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
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("id", "publication_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("publication_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3001,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "changeColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'alterColumn("publication_id", (col) => col.setDataType(sql`bigint`))',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'alterColumn("publication_id", (col) => col.setDataType(sql`integer`))',
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
							to: "publication_id",
						},
					],
				});
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeCheckConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_2f1f415e_yount_chk TO books_and_documents_dc912898_yount_chk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_and_documents_dc912898_yount_chk TO books_2f1f415e_yount_chk`',
						"execute(db);",
					],
				],
			},
			{
				priority: 5002,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeCheckConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_e37c55a5_yount_chk TO books_and_documents_f685097b_yount_chk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_and_documents_f685097b_yount_chk TO books_e37c55a5_yount_chk`',
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("add check constraint", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
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
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
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
				bookId: integer(),
			},
			constraints: {
				checks: [check(sql`${sql.ref("bookId")} < 50000`)],
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
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeCheckConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_e37c55a5_yount_chk TO books_and_documents_f685097b_yount_chk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_and_documents_f685097b_yount_chk TO books_e37c55a5_yount_chk`',
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
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

		const booksAndDocuments = table({
			columns: {
				book_id: integer(),
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
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename table and primary key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
			.execute();

		const newBooks = table({
			columns: {
				newId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["newId"]),
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
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("id", "new_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("new_id", "id")',
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
							to: "new_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("add primary key on renamed column", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
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
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("book_id", "id")',
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

	test<DbContext>("add primary key on renamed column not null", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
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
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("book_id", "id")',
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

	test<DbContext>("rename foreign key parent table, and parent column", async (context) => {
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
				documentId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["documentId"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				bookId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["bookId"], booksAndDocuments, ["documentId"])
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("document_id", "id")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_53048e1b_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_53048e1b_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "document_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key parent table, and child column", async (context) => {
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
				documentId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["documentId"], booksAndDocuments, ["id"])
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
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_id", "book_id")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_216959d6_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_216959d6_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					users: [
						{
							from: "book_id",
							to: "document_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key child table, and child column", async (context) => {
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
				documentId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["documentId"], books, ["id"])
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
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("document_id", "book_id")',
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
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_12f9128c_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_12f9128c_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					user_books: [
						{
							from: "book_id",
							to: "document_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key child table, and parent column", async (context) => {
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
				bookId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["bookId"]),
			},
		});

		const userBooks = table({
			columns: {
				id: integer(),
				bookId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["bookId"], books, ["bookId"])
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("book_id", "id")',
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
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_c3276eac_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_c3276eac_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					books: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key child table, parent table, and child column", async (context) => {
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
				documentId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["documentId"], booksAndDocuments, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
				userBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				currentTableName: "user_books",
				schemaName: "public",
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
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("document_id", "book_id")',
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
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_216959d6_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_216959d6_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					user_books: [
						{
							from: "book_id",
							to: "document_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key child table, parent table, and parent column", async (context) => {
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
				bookId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["bookId"]),
			},
		});

		const userBooks = table({
			columns: {
				id: integer(),
				bookId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["bookId"], booksAndDocuments, ["bookId"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
				userBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				currentTableName: "user_books",
				schemaName: "public",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
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
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_bf145a2d_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_bf145a2d_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key parent table, parent column, and child column", async (context) => {
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
				bookId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["bookId"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				documentId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["documentId"], booksAndDocuments, ["bookId"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
				users,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_id", "book_id")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_9e7627f3_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_9e7627f3_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
					],
					users: [
						{
							from: "book_id",
							to: "document_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key child table, child column, and parent column", async (context) => {
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
				documentId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["documentId"], booksAndDocuments, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
				userBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				currentTableName: "user_books",
				schemaName: "public",
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
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("document_id", "book_id")',
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
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_216959d6_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_216959d6_yount_fk TO users_c02e3d7d_yount_fk`',
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
					{
						from: "books",
						to: "books_and_documents",
					},
				]);
				mockColumnDiffOnce({
					user_books: [
						{
							from: "book_id",
							to: "document_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key child table, parent table, parent column, and child column", async (context) => {
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
				bookId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["bookId"]),
			},
		});

		const userBooks = table({
			columns: {
				id: integer(),
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], booksAndDocuments, ["bookId"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
				userBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				currentTableName: "user_books",
				schemaName: "public",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("document_id", "book_id")',
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
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_9e7627f3_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_9e7627f3_yount_fk TO users_c02e3d7d_yount_fk`',
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
					{
						from: "books",
						to: "books_and_documents",
					},
				]);
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
					],
					user_books: [
						{
							from: "book_id",
							to: "document_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key parent table, and parent column", async (context) => {
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
				documentId: integer(),
				newLocationId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["documentId", "newLocationId"]),
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
						"documentId",
						"newLocationId",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("document_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("location_id", "new_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("new_location_id", "location_id")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_43da5779_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_43da5779_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "document_id",
						},
						{
							from: "location_id",
							to: "new_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key parent table, and child column", async (context) => {
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
				documentId: integer(),
				documentLocationId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["documentId", "documentLocationId"], booksAndDocuments, [
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
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_location_id", "document_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_location_id", "book_location_id")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_a8017e4b_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_a8017e4b_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					users: [
						{
							from: "book_id",
							to: "document_id",
						},
						{
							from: "book_location_id",
							to: "document_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key child table, and child column", async (context) => {
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

		const userBooks = table({
			columns: {
				id: integer(),
				documentId: integer(),
				documentLocationId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["documentId", "documentLocationId"], books, [
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
				books,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "users",
				currentTableName: "user_books",
				schemaName: "public",
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
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("book_location_id", "document_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("document_location_id", "book_location_id")',
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
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_73ffb2a8_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_73ffb2a8_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					user_books: [
						{
							from: "book_id",
							to: "document_id",
						},
						{
							from: "book_location_id",
							to: "document_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key child table, and parent column", async (context) => {
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
				bookId: integer(),
				newLocationId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["bookId", "newLocationId"]),
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
					foreignKey(["bookId", "bookLocationId"], books, [
						"bookId",
						"newLocationId",
					])
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("location_id", "new_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("new_location_id", "location_id")',
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
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_8e7302ef_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_8e7302ef_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					books: [
						{
							from: "id",
							to: "book_id",
						},
						{
							from: "location_id",
							to: "new_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key child column, and parent column", async (context) => {
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
				bookId: integer(),
				newLocationId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["bookId", "newLocationId"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				documentId: integer(),
				documentLocationId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["documentId", "documentLocationId"], books, [
						"bookId",
						"newLocationId",
					])
						.updateRule("set null")
						.deleteRule("set null"),
				],
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("location_id", "new_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("new_location_id", "location_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_location_id", "document_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_location_id", "book_location_id")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_998f2e77_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_998f2e77_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					books: [
						{
							from: "id",
							to: "book_id",
						},
						{
							from: "location_id",
							to: "new_location_id",
						},
					],
					users: [
						{
							from: "book_id",
							to: "document_id",
						},
						{
							from: "book_location_id",
							to: "document_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key child table, parent table, and child column", async (context) => {
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
				documentId: integer(),
				documentLocationId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["documentId", "documentLocationId"], booksAndDocuments, [
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
				booksAndDocuments,
				userBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				currentTableName: "user_books",
				schemaName: "public",
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
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("book_location_id", "document_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("document_location_id", "book_location_id")',
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
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_a8017e4b_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_a8017e4b_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					user_books: [
						{
							from: "book_id",
							to: "document_id",
						},
						{
							from: "book_location_id",
							to: "document_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key child table, parent table, and parent column", async (context) => {
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
				bookId: integer(),
				newLocationId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["bookId", "newLocationId"]),
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
						"bookId",
						"newLocationId",
					])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
				userBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				currentTableName: "user_books",
				schemaName: "public",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("location_id", "new_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("new_location_id", "location_id")',
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
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_9ffb5f4c_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_9ffb5f4c_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
						{
							from: "location_id",
							to: "new_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key parent table, parent column, and child column", async (context) => {
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
				bookId: integer(),
				newLocationId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["bookId", "newLocationId"]),
			},
		});

		const users = table({
			columns: {
				id: integer(),
				documentId: integer(),
				documentLocationId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["documentId", "documentLocationId"], booksAndDocuments, [
						"bookId",
						"newLocationId",
					])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
				users,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("location_id", "new_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("new_location_id", "location_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("book_location_id", "document_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'renameColumn("document_location_id", "book_location_id")',
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
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO users_32ae36b2_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_32ae36b2_yount_fk TO users_c02e3d7d_yount_fk`',
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
						{
							from: "location_id",
							to: "new_location_id",
						},
					],
					users: [
						{
							from: "book_id",
							to: "document_id",
						},
						{
							from: "book_location_id",
							to: "document_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key child table, child column, and parent column", async (context) => {
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
				documentId: integer(),
				documentLocationId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["documentId", "documentLocationId"], booksAndDocuments, [
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
				booksAndDocuments,
				userBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				currentTableName: "user_books",
				schemaName: "public",
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
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("book_location_id", "document_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("document_location_id", "book_location_id")',
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
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_a8017e4b_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_a8017e4b_yount_fk TO users_c02e3d7d_yount_fk`',
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
					{
						from: "books",
						to: "books_and_documents",
					},
				]);
				mockColumnDiffOnce({
					user_books: [
						{
							from: "book_id",
							to: "document_id",
						},
						{
							from: "book_location_id",
							to: "document_location_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename composite foreign key child table, parent table, parent column, and child column", async (context) => {
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
				bookId: integer(),
				newLocationId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["bookId", "newLocationId"]),
			},
		});

		const userBooks = table({
			columns: {
				id: integer(),
				documentId: integer(),
				newBookLocationId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["documentId", "newBookLocationId"], booksAndDocuments, [
						"bookId",
						"newLocationId",
					])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				booksAndDocuments,
				userBooks,
			},
		});

		const expected = [
			{
				priority: 900,
				tableName: "books",
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				currentTableName: "user_books",
				schemaName: "public",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("location_id", "new_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("new_location_id", "location_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("book_location_id", "new_book_location_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("user_books")',
						'renameColumn("new_book_location_id", "book_location_id")',
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
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_c02e3d7d_yount_fk TO user_books_2c6c4875_yount_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_2c6c4875_yount_fk TO users_c02e3d7d_yount_fk`',
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
					{
						from: "books",
						to: "books_and_documents",
					},
				]);
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
						{
							from: "location_id",
							to: "new_location_id",
						},
					],
					user_books: [
						{
							from: "book_id",
							to: "document_id",
						},
						{
							from: "book_location_id",
							to: "new_book_location_id",
						},
					],
				});
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

		const booksAndDocuments = table({
			columns: {
				bookId: integer(),
			},
			constraints: {
				unique: [unique(["bookId"])],
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeUniqueConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_acdd8fa3_yount_key TO books_and_documents_b663df16_yount_key`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_and_documents_b663df16_yount_key TO books_acdd8fa3_yount_key`',
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
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
				bookId: integer(),
			},
			constraints: {
				unique: [unique(["bookId"])],
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
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
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'addUniqueConstraint("books_and_documents_b663df16_yount_key", ["book_id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'dropConstraint("books_and_documents_b663df16_yount_key")',
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
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
				bookId: integer(),
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
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
					],
				});
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
				bookId: integer(),
				bookCount: integer(),
			},
			constraints: {
				unique: [unique(["bookCount"])],
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
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("count", "book_count")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_count", "count")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 5002,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeUniqueConstraint",
				up: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_d0c857aa_yount_key TO books_and_documents_f2bf9399_yount_key`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_and_documents_f2bf9399_yount_key TO books_d0c857aa_yount_key`',
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
						{
							from: "count",
							to: "book_count",
						},
					],
				});
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
				bookId: integer(),
				bookCount: integer(),
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
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				currentTableName: "books_and_documents",
				schemaName: "public",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("count", "book_count")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_count", "count")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'renameColumn("book_id", "id")',
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
				mockColumnDiffOnce({
					books_and_documents: [
						{
							from: "id",
							to: "book_id",
						},
						{
							from: "count",
							to: "book_count",
						},
					],
				});
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
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("id", "book_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("book_id", "id")',
						"execute();",
					],
				],
			},
			{
				priority: 5001,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "changeIndex",
				up: [
					[
						"await sql`ALTER INDEX books_0c84fd75_yount_idx RENAME TO new_books_03cf58de_yount_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX new_books_03cf58de_yount_idx RENAME TO books_0c84fd75_yount_idx`",
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
				selectionCount: integer(),
				gradingCount: integer(),
			},
			indexes: [
				index(["id", "selectionCount"])
					.where("selectionCount", ">", 20)
					.where(sql.ref("gradingCount"), ">", 5)
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
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("rating_count", "grading_count")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("grading_count", "rating_count")',
						"execute();",
					],
				],
			},
			{
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "changeColumnName",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("sample_count", "selection_count")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'renameColumn("selection_count", "sample_count")',
						"execute();",
					],
				],
			},
			{
				priority: 5001,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "changeIndex",
				up: [
					[
						"await sql`ALTER INDEX books_07ceb5ca_yount_idx RENAME TO new_books_a2402dca_yount_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX new_books_a2402dca_yount_idx RENAME TO books_07ceb5ca_yount_idx`",
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
				mockColumnDiffOnce({
					new_books: [
						{
							from: "sample_count",
							to: "selection_count",
						},
						{
							from: "rating_count",
							to: "grading_count",
						},
					],
				});
			},
		});
	});
});
