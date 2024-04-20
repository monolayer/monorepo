/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test, vi } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { table } from "~/database/schema/table/table.js";
import { check, integer } from "~/pg.js";
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

describe(
	"Rename check constraint",
	{ concurrent: false, sequential: true },
	() => {
		// { concurrent: false, sequential: true },
		beforeEach<DbContext>(async (context) => {
			await setUpContext(context);
		});

		afterEach<DbContext>(async (context) => {
			await teardownContext(context);
			vi.restoreAllMocks();
		});

		test<DbContext>("table", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint(
					"books_2f1f415e_yount_chk",
					sql`${sql.ref("id")} > 5`,
				)
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

		test<DbContext>("table and column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint(
					"books_2f1f415e_yount_chk",
					sql`${sql.ref("id")} > 5`,
				)
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
					type: "changeConstraint",
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
					type: "changeConstraint",
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

		test<DbContext>("table and add check", async (context) => {
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
					type: "createConstraint",
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
					type: "createConstraint",
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

		test<DbContext>("table column and add check", async (context) => {
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
					type: "createConstraint",
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
					type: "createConstraint",
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

		test<DbContext>("table and drop check", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint(
					"books_2f1f415e_yount_chk",
					sql`${sql.ref("id")} > 5`,
				)
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
					priority: 810,
					tableName: "books",
					type: "dropConstraint",
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

		test<DbContext>("table and drop all checks", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint(
					"books_2f1f415e_yount_chk",
					sql`${sql.ref("id")} > 5`,
				)
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
					priority: 810,
					tableName: "books",
					type: "dropConstraint",
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
					priority: 810,
					tableName: "books",
					type: "dropConstraint",
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
	},
);
