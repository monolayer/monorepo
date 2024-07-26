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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "publication_id",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "publication_id",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				type: "changeColumnDataType",
				phase: "unsafe",
				warnings: [
					{
						code: "B001",
						column: "publication_id",
						schema: "public",
						table: "publications",
						from: "integer",
						to: "bigint",
						type: "blocking",
					},
				],
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "identifier",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT publications_a80ce83d_monolayer_chk TO books_2f1f415e_monolayer_chk`',
						"execute(db);",
					],
				],
				priority: 5002,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameCheckConstraint",
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT books_2f1f415e_monolayer_chk TO publications_a80ce83d_monolayer_chk`',
						"execute(db);",
					],
				],
			},
			{
				down: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT publications_b3606c7d_monolayer_chk TO books_e37c55a5_monolayer_chk`',
						"execute(db);",
					],
				],
				priority: 5002,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameCheckConstraint",
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT books_e37c55a5_monolayer_chk TO publications_b3606c7d_monolayer_chk`',
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "identifier",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("publications")
    .addCheckConstraint("publications_a80ce83d_monolayer_chk", sql\`"identifier" > 5\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."publications" VALIDATE CONSTRAINT "publications_a80ce83d_monolayer_chk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_a80ce83d_monolayer_chk")',
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
				phase: "unsafe",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("publications")
    .addCheckConstraint("publications_b3606c7d_monolayer_chk", sql\`"identifier" < 50000\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."publications" VALIDATE CONSTRAINT "publications_b3606c7d_monolayer_chk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_b3606c7d_monolayer_chk")',
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
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "identifier",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameCheckConstraint",
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT books_e37c55a5_monolayer_chk TO publications_b3606c7d_monolayer_chk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT publications_b3606c7d_monolayer_chk TO books_e37c55a5_monolayer_chk`',
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
				phase: "unsafe",
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
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "identifier",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
			.addPrimaryKeyConstraint("books_id_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "identifier",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "identifier",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				priority: 3011,
				schemaName: "public",
				tableName: "publications",
				currentTableName: "publications",
				type: "changeColumnNullable",
				phase: "unsafe",
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
				priority: 4003,
				schemaName: "public",
				tableName: "publications",
				currentTableName: "publications",
				type: "createIndex",
				phase: "unsafe",
				transaction: false,
				up: [
					[
						"try {\n" +
							'    await sql`${sql.raw(\'create unique index concurrently "publications_pkey_idx" on "public"."publications" ("identifier")\')}`.execute(db);\n' +
							"  }\n" +
							"  catch (error: any) {\n" +
							"    if (error.code === '23505') {\n" +
							'      await db.withSchema("public").schema.dropIndex("publications_pkey_idx").ifExists().execute();\n' +
							"    }\n" +
							"    throw error;\n" +
							"  }",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_pkey_idx")',
						"ifExists()",
						"execute();",
					],
				],
			},
			{
				priority: 4013,
				schemaName: "public",
				tableName: "publications",
				currentTableName: "publications",
				type: "createPrimaryKey",
				phase: "unsafe",
				warnings: [
					{
						code: "MF001",
						columns: ["identifier"],
						schema: "public",
						table: "publications",
						type: "mightFail",
					},
				],
				up: [
					[
						"await sql`${sql.raw(\n" +
							"  db\n" +
							'    .withSchema("public")\n' +
							'    .schema.alterTable("publications")\n' +
							'    .addCheckConstraint("identifier_temporary_not_null_check_constraint", sql`"identifier" IS NOT NULL`)\n' +
							"    .compile()\n" +
							'    .sql.concat(" not valid")\n' +
							")}`.execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."publications" VALIDATE CONSTRAINT "identifier_temporary_not_null_check_constraint"`',
						"execute(db);",
					],
					[
						'await sql`alter table "public"."publications" add constraint "publications_pkey" primary key using index "publications_pkey_idx"`',
						"execute(db);",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("identifier_temporary_not_null_check_constraint")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_pkey")',
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "identifier",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				priority: 3011,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "changeColumnNullable",
				phase: "unsafe",
				warnings: [
					{
						code: "MF005",
						column: "identifier",
						schema: "public",
						table: "publications",
						type: "mightFail",
					},
				],
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("publications")
    .addCheckConstraint("temporary_not_null_check_constraint", sql\`"identifier" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."publications" VALIDATE CONSTRAINT "temporary_not_null_check_constraint"`',
						"execute(db);",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'alterColumn("identifier", (col) => col.setNotNull())',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("temporary_not_null_check_constraint")',
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
				priority: 4003,
				schemaName: "public",
				tableName: "publications",
				currentTableName: "publications",
				type: "createIndex",
				phase: "unsafe",
				transaction: false,
				up: [
					[
						"try {\n" +
							'    await sql`${sql.raw(\'create unique index concurrently "publications_pkey_idx" on "public"."publications" ("identifier")\')}`.execute(db);\n' +
							"  }\n" +
							"  catch (error: any) {\n" +
							"    if (error.code === '23505') {\n" +
							'      await db.withSchema("public").schema.dropIndex("publications_pkey_idx").ifExists().execute();\n' +
							"    }\n" +
							"    throw error;\n" +
							"  }",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_pkey_idx")',
						"ifExists()",
						"execute();",
					],
				],
			},
			{
				priority: 4013,
				schemaName: "public",
				tableName: "publications",
				currentTableName: "publications",
				type: "createPrimaryKey",
				phase: "unsafe",
				warnings: [
					{
						code: "MF001",
						columns: ["identifier"],
						schema: "public",
						table: "publications",
						type: "mightFail",
					},
				],
				up: [
					[
						"await sql`${sql.raw(\n" +
							"  db\n" +
							'    .withSchema("public")\n' +
							'    .schema.alterTable("publications")\n' +
							'    .addCheckConstraint("identifier_temporary_not_null_check_constraint", sql`"identifier" IS NOT NULL`)\n' +
							"    .compile()\n" +
							'    .sql.concat(" not valid")\n' +
							")}`.execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."publications" VALIDATE CONSTRAINT "identifier_temporary_not_null_check_constraint"`',
						"execute(db);",
					],
					[
						'await sql`alter table "public"."publications" add constraint "publications_pkey" primary key using index "publications_pkey_idx"`',
						"execute(db);",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("identifier_temporary_not_null_check_constraint")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_pkey")',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "document_id",
						},
						schema: "public",
						table: "documents",
						type: "backwardIncompatible",
					},
				],
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

				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO users_23a40a64_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_23a40a64_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO users_10f6a685_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_10f6a685_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "persons",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO persons_e17f9ac0_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_e17f9ac0_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO persons_c7007f8e_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_c7007f8e_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "persons",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO persons_75fad375_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_75fad375_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "documents",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO persons_bf00d0e6_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_bf00d0e6_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO users_28a672c8_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_28a672c8_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "persons",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO persons_75fad375_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_75fad375_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "persons",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO persons_19fffdac_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_19fffdac_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "document_id",
						},
						schema: "public",
						table: "documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "location_id",
							to: "new_location_id",
						},
						schema: "public",
						table: "documents",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO users_6260aee4_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_6260aee4_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_location_id",
							to: "document_location_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO users_5f06df12_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_5f06df12_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "persons",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_location_id",
							to: "document_location_id",
						},
						schema: "public",
						table: "persons",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO persons_13cbdbe7_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_13cbdbe7_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "location_id",
							to: "new_location_id",
						},
						schema: "public",
						table: "books",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO persons_8710797a_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_8710797a_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "location_id",
							to: "new_location_id",
						},
						schema: "public",
						table: "books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_location_id",
							to: "document_location_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO users_d2f71aa1_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_d2f71aa1_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "persons",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_location_id",
							to: "document_location_id",
						},
						schema: "public",
						table: "persons",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO persons_608311bd_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_608311bd_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "location_id",
							to: "new_location_id",
						},
						schema: "public",
						table: "documents",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO persons_6f4f3476_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_6f4f3476_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "location_id",
							to: "new_location_id",
						},
						schema: "public",
						table: "documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_location_id",
							to: "document_location_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO users_c8e5c5fa_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_c8e5c5fa_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "persons",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_location_id",
							to: "document_location_id",
						},
						schema: "public",
						table: "persons",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO persons_608311bd_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."persons" RENAME CONSTRAINT persons_608311bd_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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

	test<DbContext>("replace and rename composite foreign key child table, parent table, parent column, and child column", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("location_id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				phase: "unsafe",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_6f4acd2f_monolayer_fk")',
						"execute();",
					],
				],
				down: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_6f4acd2f_monolayer_fk", ["book_id", "book_location_id"], "public.books", ["id", "location_id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_6f4acd2f_monolayer_fk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 900,
				tableName: "books",
				currentTableName: "documents",
				schemaName: "public",
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "documents",
				currentTableName: "documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "location_id",
							to: "new_location_id",
						},
						schema: "public",
						table: "documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "persons",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_location_id",
							to: "new_book_location_id",
						},
						schema: "public",
						table: "persons",
						type: "backwardIncompatible",
					},
				],
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
				priority: 4003,
				schemaName: "public",
				tableName: "documents",
				currentTableName: "documents",
				type: "createIndex",
				phase: "unsafe",
				transaction: false,
				up: [
					[
						"try {\n" +
							'    await sql`${sql.raw(\'create unique index concurrently "documents_c78003f2_monolayer_key_monolayer_uc_idx" on "public"."documents" ("new_location_id") \')}`.execute(db);\n' +
							"  }\n" +
							"  catch (error: any) {\n" +
							"    if (error.code === '23505') {\n" +
							'      await db.withSchema("public").schema.dropIndex("documents_c78003f2_monolayer_key_monolayer_uc_idx").ifExists().execute();\n' +
							"    }\n" +
							"    throw error;\n" +
							"  }",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("documents_c78003f2_monolayer_key_monolayer_uc_idx")',
						"ifExists()",
						"execute();",
					],
				],
			},
			{
				priority: 4010,
				schemaName: "public",
				tableName: "documents",
				currentTableName: "documents",
				type: "createUniqueConstraint",
				phase: "unsafe",
				warnings: [
					{
						code: "MF003",
						columns: ["new_location_id"],
						schema: "public",
						table: "documents",
						type: "mightFail",
					},
				],
				up: [
					[
						'await sql`alter table "public"."documents" add constraint "documents_c78003f2_monolayer_key" unique using index "documents_c78003f2_monolayer_key_monolayer_uc_idx"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("documents")',
						'dropConstraint("documents_c78003f2_monolayer_key")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'dropIndex("documents_c78003f2_monolayer_key_monolayer_uc_idx")',
						"ifExists()",
						"execute();",
					],
				],
			},
			{
				priority: 4014,
				tableName: "persons",
				currentTableName: "persons",
				schemaName: "public",
				type: "createForeignKey",
				phase: "unsafe",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("persons")
    .addForeignKeyConstraint("persons_f1de6b49_monolayer_fk", ["new_book_location_id"], "public.documents", ["new_location_id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."persons" VALIDATE CONSTRAINT "persons_f1de6b49_monolayer_fk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("persons")',
						'dropConstraint("persons_f1de6b49_monolayer_fk")',
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "identifier",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameUniqueConstraint",
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT books_acdd8fa3_monolayer_key TO publications_1c0982e8_monolayer_key`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT publications_1c0982e8_monolayer_key TO books_acdd8fa3_monolayer_key`',
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "identifier",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				priority: 4003,
				schemaName: "public",
				tableName: "publications",
				currentTableName: "publications",
				type: "createIndex",
				phase: "unsafe",
				transaction: false,
				up: [
					[
						"try {\n" +
							'    await sql`${sql.raw(\'create unique index concurrently "publications_1c0982e8_monolayer_key_monolayer_uc_idx" on "public"."publications" ("identifier") \')}`.execute(db);\n' +
							"  }\n" +
							"  catch (error: any) {\n" +
							"    if (error.code === '23505') {\n" +
							'      await db.withSchema("public").schema.dropIndex("publications_1c0982e8_monolayer_key_monolayer_uc_idx").ifExists().execute();\n' +
							"    }\n" +
							"    throw error;\n" +
							"  }",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_1c0982e8_monolayer_key_monolayer_uc_idx")',
						"ifExists()",
						"execute();",
					],
				],
			},
			{
				priority: 4010,
				schemaName: "public",
				tableName: "publications",
				currentTableName: "publications",
				type: "createUniqueConstraint",
				phase: "unsafe",
				warnings: [
					{
						code: "MF003",
						columns: ["identifier"],
						schema: "public",
						table: "publications",
						type: "mightFail",
					},
				],
				up: [
					[
						'await sql`alter table "public"."publications" add constraint "publications_1c0982e8_monolayer_key" unique using index "publications_1c0982e8_monolayer_key_monolayer_uc_idx"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("publications")',
						'dropConstraint("publications_1c0982e8_monolayer_key")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'dropIndex("publications_1c0982e8_monolayer_key_monolayer_uc_idx")',
						"ifExists()",
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
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
				phase: "unsafe",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_monolayer_key")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_acdd8fa3_monolayer_key_monolayer_uc_idx")',
						"ifExists()",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_d0c857aa_monolayer_key", ["count"])
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
				phase: "unsafe",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_monolayer_key")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_acdd8fa3_monolayer_key_monolayer_uc_idx")',
						"ifExists()",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "count",
							to: "book_count",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameUniqueConstraint",
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT books_d0c857aa_monolayer_key TO publications_f2bf9399_monolayer_key`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."publications" RENAME CONSTRAINT publications_f2bf9399_monolayer_key TO books_d0c857aa_monolayer_key`',
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_d0c857aa_monolayer_key", ["count"])
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
				phase: "unsafe",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_monolayer_key")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_acdd8fa3_monolayer_key_monolayer_uc_idx")',
						"ifExists()",
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
				phase: "unsafe",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_d0c857aa_monolayer_key")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_d0c857aa_monolayer_key_monolayer_uc_idx")',
						"ifExists()",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "count",
							to: "book_count",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
			.createIndex("books_0c84fd75_monolayer_idx")
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameIndex",
				phase: "unsafe",
				up: [
					[
						"await sql`ALTER INDEX books_0c84fd75_monolayer_idx RENAME TO publications_03cf58de_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX publications_03cf58de_monolayer_idx RENAME TO books_0c84fd75_monolayer_idx`",
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

	test<DbContext>("keep index multiple present", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("count", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_0c84fd75_monolayer_idx")
			.on("books")
			.columns(["id"])
			.execute();

		await context.kysely.schema
			.createIndex("books_457992e0_monolayer_idx")
			.on("books")
			.columns(["count"])
			.execute();

		const publications = table({
			columns: {
				id: integer(),
				book_count: integer(),
			},
			indexes: [index(["id"]), index(["book_count"])],
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "count",
							to: "book_count",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				priority: 5001,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameIndex",
				phase: "unsafe",
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
			{
				priority: 5001,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameIndex",
				phase: "unsafe",
				up: [
					[
						"await sql`ALTER INDEX books_457992e0_monolayer_idx RENAME TO publications_2b1ab334_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX publications_2b1ab334_monolayer_idx RENAME TO books_457992e0_monolayer_idx`",
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
							from: "count",
							to: "book_count",
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameIndex",
				phase: "unsafe",
				up: [
					[
						"await sql`ALTER INDEX publications_6b9be986_monolayer_idx RENAME TO books_a338e985_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX books_a338e985_monolayer_idx RENAME TO publications_6b9be986_monolayer_idx`",
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "publication_id",
						},
						schema: "public",
						table: "new_books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "publication_id",
						},
						schema: "public",
						table: "new_books",
						type: "backwardIncompatible",
					},
				],
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
				type: "changeColumnDataType",
				phase: "unsafe",
				warnings: [
					{
						code: "B001",
						column: "publication_id",
						schema: "public",
						table: "new_books",
						from: "integer",
						to: "bigint",
						type: "blocking",
					},
				],
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameCheckConstraint",
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_2f1f415e_monolayer_chk TO books_and_documents_dc912898_monolayer_chk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_and_documents_dc912898_monolayer_chk TO books_2f1f415e_monolayer_chk`',
						"execute(db);",
					],
				],
			},
			{
				priority: 5002,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameCheckConstraint",
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_e37c55a5_monolayer_chk TO books_and_documents_f685097b_monolayer_chk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_and_documents_f685097b_monolayer_chk TO books_e37c55a5_monolayer_chk`',
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
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
				phase: "unsafe",
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
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameCheckConstraint",
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_e37c55a5_monolayer_chk TO books_and_documents_f685097b_monolayer_chk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_and_documents_f685097b_monolayer_chk TO books_e37c55a5_monolayer_chk`',
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
				phase: "unsafe",
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "dropCheckConstraint",
				phase: "unsafe",
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
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
			.addPrimaryKeyConstraint("books_id_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "new_id",
						},
						schema: "public",
						table: "new_books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "new_books",
						type: "backwardIncompatible",
					},
				],
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
				priority: 3011,
				schemaName: "public",
				tableName: "new_books",
				currentTableName: "new_books",
				type: "changeColumnNullable",
				phase: "unsafe",
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
				priority: 4003,
				schemaName: "public",
				tableName: "new_books",
				currentTableName: "new_books",
				type: "createIndex",
				phase: "unsafe",
				transaction: false,
				up: [
					[
						"try {\n" +
							'    await sql`${sql.raw(\'create unique index concurrently "new_books_pkey_idx" on "public"."new_books" ("book_id")\')}`.execute(db);\n' +
							"  }\n" +
							"  catch (error: any) {\n" +
							"    if (error.code === '23505') {\n" +
							'      await db.withSchema("public").schema.dropIndex("new_books_pkey_idx").ifExists().execute();\n' +
							"    }\n" +
							"    throw error;\n" +
							"  }",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("new_books_pkey_idx")',
						"ifExists()",
						"execute();",
					],
				],
			},
			{
				priority: 4013,
				schemaName: "public",
				tableName: "new_books",
				currentTableName: "new_books",
				type: "createPrimaryKey",
				phase: "unsafe",
				warnings: [
					{
						code: "MF001",
						columns: ["book_id"],
						schema: "public",
						table: "new_books",
						type: "mightFail",
					},
				],
				up: [
					[
						"await sql`${sql.raw(\n" +
							"  db\n" +
							'    .withSchema("public")\n' +
							'    .schema.alterTable("new_books")\n' +
							'    .addCheckConstraint("book_id_temporary_not_null_check_constraint", sql`"book_id" IS NOT NULL`)\n' +
							"    .compile()\n" +
							'    .sql.concat(" not valid")\n' +
							")}`.execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."new_books" VALIDATE CONSTRAINT "book_id_temporary_not_null_check_constraint"`',
						"execute(db);",
					],
					[
						'await sql`alter table "public"."new_books" add constraint "new_books_pkey" primary key using index "new_books_pkey_idx"`',
						"execute(db);",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'dropConstraint("book_id_temporary_not_null_check_constraint")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'dropConstraint("new_books_pkey")',
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "new_books",
						type: "backwardIncompatible",
					},
				],
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
				priority: 3011,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "changeColumnNullable",
				phase: "unsafe",
				warnings: [
					{
						code: "MF005",
						column: "book_id",
						schema: "public",
						table: "new_books",
						type: "mightFail",
					},
				],
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("new_books")
    .addCheckConstraint("temporary_not_null_check_constraint", sql\`"book_id" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."new_books" VALIDATE CONSTRAINT "temporary_not_null_check_constraint"`',
						"execute(db);",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'alterColumn("book_id", (col) => col.setNotNull())',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'dropConstraint("temporary_not_null_check_constraint")',
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
				priority: 4003,
				schemaName: "public",
				tableName: "new_books",
				currentTableName: "new_books",
				type: "createIndex",
				phase: "unsafe",
				transaction: false,
				up: [
					[
						"try {\n" +
							'    await sql`${sql.raw(\'create unique index concurrently "new_books_pkey_idx" on "public"."new_books" ("book_id")\')}`.execute(db);\n' +
							"  }\n" +
							"  catch (error: any) {\n" +
							"    if (error.code === '23505') {\n" +
							'      await db.withSchema("public").schema.dropIndex("new_books_pkey_idx").ifExists().execute();\n' +
							"    }\n" +
							"    throw error;\n" +
							"  }",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("new_books_pkey_idx")',
						"ifExists()",
						"execute();",
					],
				],
			},
			{
				priority: 4013,
				schemaName: "public",
				tableName: "new_books",
				currentTableName: "new_books",
				type: "createPrimaryKey",
				phase: "unsafe",
				warnings: [
					{
						code: "MF001",
						columns: ["book_id"],
						schema: "public",
						table: "new_books",
						type: "mightFail",
					},
				],
				up: [
					[
						"await sql`${sql.raw(\n" +
							"  db\n" +
							'    .withSchema("public")\n' +
							'    .schema.alterTable("new_books")\n' +
							'    .addCheckConstraint("book_id_temporary_not_null_check_constraint", sql`"book_id" IS NOT NULL`)\n' +
							"    .compile()\n" +
							'    .sql.concat(" not valid")\n' +
							")}`.execute(db);",
					],
					[
						'await sql`ALTER TABLE "public"."new_books" VALIDATE CONSTRAINT "book_id_temporary_not_null_check_constraint"`',
						"execute(db);",
					],
					[
						'await sql`alter table "public"."new_books" add constraint "new_books_pkey" primary key using index "new_books_pkey_idx"`',
						"execute(db);",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'dropConstraint("book_id_temporary_not_null_check_constraint")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("new_books")',
						'dropConstraint("new_books_pkey")',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "document_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO users_fe8c140e_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_fe8c140e_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO users_460912ed_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_460912ed_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "user_books",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO user_books_365f2f70_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_365f2f70_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO user_books_872929b3_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_872929b3_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "user_books",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO user_books_9e23e12e_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_9e23e12e_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO user_books_fd670911_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_fd670911_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO users_622e2dfc_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_622e2dfc_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "user_books",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO user_books_9e23e12e_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_9e23e12e_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "user_books",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO user_books_2c8633b9_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_2c8633b9_monolayer_fk TO users_58e6ca22_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "document_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "location_id",
							to: "new_location_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO users_2004fe40_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_2004fe40_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_location_id",
							to: "document_location_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO users_f8a1fdc9_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_f8a1fdc9_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "user_books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_location_id",
							to: "document_location_id",
						},
						schema: "public",
						table: "user_books",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO user_books_827a56e0_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_827a56e0_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "location_id",
							to: "new_location_id",
						},
						schema: "public",
						table: "books",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO user_books_f99b728b_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_f99b728b_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "location_id",
							to: "new_location_id",
						},
						schema: "public",
						table: "books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_location_id",
							to: "document_location_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO users_d2f71aa1_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_d2f71aa1_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "user_books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_location_id",
							to: "document_location_id",
						},
						schema: "public",
						table: "user_books",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO user_books_a5f1a0ff_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_a5f1a0ff_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "location_id",
							to: "new_location_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO user_books_9a4b62c2_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_9a4b62c2_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "location_id",
							to: "new_location_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_location_id",
							to: "document_location_id",
						},
						schema: "public",
						table: "users",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO users_7b91551f_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_7b91551f_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "user_books",
				currentTableName: "user_books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "user_books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_location_id",
							to: "document_location_id",
						},
						schema: "public",
						table: "user_books",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO user_books_a5f1a0ff_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_a5f1a0ff_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "location_id",
							to: "new_location_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "user_books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_location_id",
							to: "new_book_location_id",
						},
						schema: "public",
						table: "user_books",
						type: "backwardIncompatible",
					},
				],
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
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT users_6f4acd2f_monolayer_fk TO user_books_124b3526_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."user_books" RENAME CONSTRAINT user_books_124b3526_monolayer_fk TO users_6f4acd2f_monolayer_fk`',
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameUniqueConstraint",
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_acdd8fa3_monolayer_key TO books_and_documents_b663df16_monolayer_key`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_and_documents_b663df16_monolayer_key TO books_acdd8fa3_monolayer_key`',
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				priority: 4003,
				schemaName: "public",
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				type: "createIndex",
				phase: "unsafe",
				transaction: false,
				up: [
					[
						"try {\n" +
							'    await sql`${sql.raw(\'create unique index concurrently "books_and_documents_b663df16_monolayer_key_monolayer_uc_idx" on "public"."books_and_documents" ("book_id") \')}`.execute(db);\n' +
							"  }\n" +
							"  catch (error: any) {\n" +
							"    if (error.code === '23505') {\n" +
							'      await db.withSchema("public").schema.dropIndex("books_and_documents_b663df16_monolayer_key_monolayer_uc_idx").ifExists().execute();\n' +
							"    }\n" +
							"    throw error;\n" +
							"  }",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_and_documents_b663df16_monolayer_key_monolayer_uc_idx")',
						"ifExists()",
						"execute();",
					],
				],
			},
			{
				priority: 4010,
				schemaName: "public",
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				type: "createUniqueConstraint",
				phase: "unsafe",
				warnings: [
					{
						code: "MF003",
						columns: ["book_id"],
						schema: "public",
						table: "books_and_documents",
						type: "mightFail",
					},
				],
				up: [
					[
						'await sql`alter table "public"."books_and_documents" add constraint "books_and_documents_b663df16_monolayer_key" unique using index "books_and_documents_b663df16_monolayer_key_monolayer_uc_idx"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books_and_documents")',
						'dropConstraint("books_and_documents_b663df16_monolayer_key")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_and_documents_b663df16_monolayer_key_monolayer_uc_idx")',
						"ifExists()",
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
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
				phase: "unsafe",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_monolayer_key")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_acdd8fa3_monolayer_key_monolayer_uc_idx")',
						"ifExists()",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_d0c857aa_monolayer_key", ["count"])
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
				phase: "unsafe",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_monolayer_key")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_acdd8fa3_monolayer_key_monolayer_uc_idx")',
						"ifExists()",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "count",
							to: "book_count",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameUniqueConstraint",
				phase: "unsafe",
				up: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_d0c857aa_monolayer_key TO books_and_documents_f2bf9399_monolayer_key`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books_and_documents" RENAME CONSTRAINT books_and_documents_f2bf9399_monolayer_key TO books_d0c857aa_monolayer_key`',
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
			.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_d0c857aa_monolayer_key", ["count"])
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
				phase: "unsafe",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_acdd8fa3_monolayer_key")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_acdd8fa3_monolayer_key_monolayer_uc_idx")',
						"ifExists()",
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
				phase: "unsafe",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_d0c857aa_monolayer_key")',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_d0c857aa_monolayer_key_monolayer_uc_idx")',
						"ifExists()",
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "books_and_documents",
				currentTableName: "books_and_documents",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "count",
							to: "book_count",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "books_and_documents",
						type: "backwardIncompatible",
					},
				],
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
			.createIndex("books_0c84fd75_monolayer_idx")
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "book_id",
						},
						schema: "public",
						table: "new_books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameIndex",
				phase: "unsafe",
				up: [
					[
						"await sql`ALTER INDEX books_0c84fd75_monolayer_idx RENAME TO new_books_03cf58de_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX new_books_03cf58de_monolayer_idx RENAME TO books_0c84fd75_monolayer_idx`",
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

	test<DbContext>("keep index multiple present", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("count", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_0c84fd75_monolayer_idx")
			.on("books")
			.columns(["id"])
			.execute();

		await context.kysely.schema
			.createIndex("books_457992e0_monolayer_idx")
			.on("books")
			.columns(["count"])
			.execute();

		const publications = table({
			columns: {
				id: integer(),
				bookCount: integer(),
			},
			indexes: [index(["id"]), index(["bookCount"])],
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
				phase: "unsafe",
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
				priority: 3000,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "count",
							to: "book_count",
						},
						schema: "public",
						table: "publications",
						type: "backwardIncompatible",
					},
				],
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
				priority: 5001,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameIndex",
				phase: "unsafe",
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
			{
				priority: 5001,
				tableName: "publications",
				currentTableName: "publications",
				schemaName: "public",
				type: "renameIndex",
				phase: "unsafe",
				up: [
					[
						"await sql`ALTER INDEX books_457992e0_monolayer_idx RENAME TO publications_2b1ab334_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX publications_2b1ab334_monolayer_idx RENAME TO books_457992e0_monolayer_idx`",
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
						to: "publications",
					},
				]);
				mockColumnDiffOnce({
					publications: [
						{
							from: "count",
							to: "book_count",
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
				type: "renameTable",
				phase: "unsafe",
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
				priority: 3000,
				tableName: "new_books",
				currentTableName: "new_books",
				schemaName: "public",
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "rating_count",
							to: "grading_count",
						},
						schema: "public",
						table: "new_books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameColumn",
				phase: "unsafe",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "sample_count",
							to: "selection_count",
						},
						schema: "public",
						table: "new_books",
						type: "backwardIncompatible",
					},
				],
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
				type: "renameIndex",
				phase: "unsafe",
				up: [
					[
						"await sql`ALTER INDEX books_07ceb5ca_monolayer_idx RENAME TO new_books_a2402dca_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX new_books_a2402dca_monolayer_idx RENAME TO books_07ceb5ca_monolayer_idx`",
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
