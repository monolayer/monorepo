/* eslint-disable max-lines */
import { check } from "@monorepo/pg/schema/check.js";
import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { text } from "@monorepo/pg/schema/column/data-types/text.js";
import { foreignKey } from "@monorepo/pg/schema/foreign-key.js";
import { index } from "@monorepo/pg/schema/index.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { unique } from "@monorepo/pg/schema/unique.js";
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test, vi } from "vitest";

import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "~tests/__setup__/helpers/test-context.js";
import { mockColumnDiffOnce } from "~tests/__setup__/setup.js";

describe("without camel case plugin", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
		vi.restoreAllMocks();
	});

	test<DbContext>("renames unique constraint", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_a91945e0_monolayer_key", ["id"], (col) =>
				col.nullsNotDistinct(),
			)
			.execute();

		const books = table({
			columns: {
				book_id: integer(),
			},
			constraints: {
				unique: [unique(["book_id"]).nullsNotDistinct()],
			},
		});

		const dbSchema = schema({
			tables: {
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
				phase: "alter",
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
				schemaName: "public",
				tableName: "books",
				currentTableName: "books",
				type: "renameUniqueConstraint",
				phase: "alter",
				up: [
					[
						'await sql`ALTER TABLE "public"."books" RENAME CONSTRAINT books_a91945e0_monolayer_key TO books_c9bd02ff_monolayer_key`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" RENAME CONSTRAINT books_c9bd02ff_monolayer_key TO books_a91945e0_monolayer_key`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
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
					],
				});
			},
		});
	});

	test<DbContext>("renames check constraint", async (context) => {
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

		const books = table({
			columns: {
				book_id: integer(),
			},
			constraints: {
				checks: [
					check(sql`${sql.ref("book_id")} > 5`),
					check(sql`${sql.ref("book_id")} < 50000`),
				],
			},
		});

		const dbSchema = schema({
			tables: {
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
				phase: "alter",
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
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameCheckConstraint",
				phase: "alter",
				up: [
					[
						'await sql`ALTER TABLE "public"."books" RENAME CONSTRAINT books_2f1f415e_monolayer_chk TO books_dc912898_monolayer_chk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" RENAME CONSTRAINT books_dc912898_monolayer_chk TO books_2f1f415e_monolayer_chk`',
						"execute(db);",
					],
				],
			},
			{
				priority: 5002,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameCheckConstraint",
				phase: "alter",
				up: [
					[
						'await sql`ALTER TABLE "public"."books" RENAME CONSTRAINT books_e37c55a5_monolayer_chk TO books_f685097b_monolayer_chk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" RENAME CONSTRAINT books_f685097b_monolayer_chk TO books_e37c55a5_monolayer_chk`',
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
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
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key child column and parent column", async (context) => {
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

		const users = table({
			columns: {
				id: integer(),
				document_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["document_id"], books, ["book_id"])
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
				phase: "alter",
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
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "renameColumn",
				phase: "alter",
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
				phase: "alter",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO users_3d08c4bf_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_3d08c4bf_monolayer_fk TO users_58e6ca22_monolayer_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
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

	test<DbContext>("rename primary key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_pkey", ["id"])
			.execute();

		const books = table({
			columns: {
				identifier: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["identifier"]),
			},
		});

		const dbSchema = schema({
			tables: {
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
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "identifier",
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
						'renameColumn("id", "identifier")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("identifier", "id")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "id",
							to: "identifier",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename column and add index", async (context) => {
		await context.kysely.schema
			.createTable("users_pk1")
			.addColumn("name", "text")
			.addColumn("book_id", "integer")
			.execute();

		const users = table({
			columns: {
				name: text(),
				bookId: integer(),
			},
			indexes: [index(["bookId"])],
		});

		const dbSchema = schema({
			tables: {
				users_pk1: users,
			},
		});

		const expected = [
			{
				priority: 3000,
				tableName: "users_pk1",
				currentTableName: "users_pk1",
				schemaName: "public",
				type: "renameColumn",
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "bookId",
						},
						schema: "public",
						table: "users_pk1",
						type: "backwardIncompatible",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users_pk1")',
						'renameColumn("book_id", "bookId")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users_pk1")',
						'renameColumn("bookId", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "users_pk1",
				currentTableName: "users_pk1",
				schemaName: "public",
				type: "createIndex",
				phase: "alter",
				transaction: false,
				up: [
					[
						`try {
    await sql\`\${sql.raw('create index concurrently "users_pk1_08bf5869_monolayer_idx" on "public"."users_pk1" ("bookId")')}\`.execute(db);
  }
  catch (error: any) {
    if (error.code === '23505') {
      await db.withSchema("public").schema.dropIndex("users_pk1_08bf5869_monolayer_idx").ifExists().execute();
    }
    throw error;
  }`,
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("users_pk1_08bf5869_monolayer_idx")',
						"ifExists()",
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					users_pk1: [
						{
							from: "book_id",
							to: "bookId",
						},
					],
				});
			},
		});
	});

	test<DbContext>("rename column and add complex index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		const books = table({
			columns: {
				id: integer(),
				examples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["id", "examples"])
					.where("examples", ">", 20)
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "samples",
							to: "examples",
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
						'renameColumn("samples", "examples")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("examples", "samples")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createIndex",
				phase: "alter",
				transaction: false,
				up: [
					[
						`try {
    await sql\`\${sql.raw('create unique index concurrently "books_85f9c9be_monolayer_idx" on "public"."books" using btree ("id", "examples") nulls not distinct where "examples" > 20 and "ratings" > 5')}\`.execute(db);
  }
  catch (error: any) {
    if (error.code === '23505') {
      await db.withSchema("public").schema.dropIndex("books_85f9c9be_monolayer_idx").ifExists().execute();
    }
    throw error;
  }`,
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_85f9c9be_monolayer_idx")',
						"ifExists()",
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "samples",
							to: "examples",
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

		const books = table({
			columns: {
				book_id: integer(),
			},
			indexes: [index(["book_id"])],
		});

		const dbSchema = schema({
			tables: {
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
				phase: "alter",
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
				phase: "alter",
				up: [
					[
						"await sql`ALTER INDEX books_0c84fd75_monolayer_idx RENAME TO books_03cf58de_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX books_03cf58de_monolayer_idx RENAME TO books_0c84fd75_monolayer_idx`",
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
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

	test<DbContext>("keep index multiple existing", async (context) => {
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

		const books = table({
			columns: {
				id: integer(),
				book_count: integer(),
			},
			indexes: [index(["id"]), index(["book_count"])],
		});

		const dbSchema = schema({
			tables: {
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
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "count",
							to: "book_count",
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
						'renameColumn("count", "book_count")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("book_count", "count")',
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
				phase: "alter",
				up: [
					[
						"await sql`ALTER INDEX books_457992e0_monolayer_idx RENAME TO books_2b1ab334_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX books_2b1ab334_monolayer_idx RENAME TO books_457992e0_monolayer_idx`",
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
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
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_6b9be986_monolayer_idx")
			.on("books")
			.columns(["id", "samples"])
			.where("samples", ">", 20)
			.where(sql.ref("ratings"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const books = table({
			columns: {
				book_id: integer(),
				examples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["book_id", "examples"])
					.where("examples", ">", 20)
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "alter",
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
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "samples",
							to: "examples",
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
						'renameColumn("samples", "examples")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("examples", "samples")',
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
				phase: "alter",
				up: [
					[
						"await sql`ALTER INDEX books_6b9be986_monolayer_idx RENAME TO books_f58de7d0_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX books_f58de7d0_monolayer_idx RENAME TO books_6b9be986_monolayer_idx`",
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "samples",
							to: "examples",
						},
						{
							from: "id",
							to: "book_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("keep complex index multiple exising", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_9187151c_monolayer_idx")
			.on("books")
			.columns(["id"])
			.execute();

		await context.kysely.schema
			.createIndex("books_332ef767_monolayer_idx")
			.on("books")
			.columns(["id"])
			.execute();

		await context.kysely.schema
			.createIndex("books_6b9be986_monolayer_idx")
			.on("books")
			.columns(["id", "samples"])
			.where("samples", ">", 20)
			.where(sql.ref("ratings"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const books = table({
			columns: {
				book_id: integer(),
				test_samples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["book_id"]).where(sql.ref("book_id"), ">", 5).unique(),
				index(["book_id", "test_samples"])
					.where("test_samples", ">", 20)
					.where(sql.ref("ratings"), ">", 5)
					.nullsNotDistinct()
					.using("btree")
					.unique(),
				index(["ratings"]),
			],
		});

		const dbSchema = schema({
			tables: {
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
				phase: "alter",
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
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "samples",
							to: "test_samples",
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
						'renameColumn("samples", "test_samples")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("test_samples", "samples")',
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
				phase: "alter",
				up: [
					[
						"await sql`ALTER INDEX books_6b9be986_monolayer_idx RENAME TO books_e92fba06_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX books_e92fba06_monolayer_idx RENAME TO books_6b9be986_monolayer_idx`",
						"execute(db);",
					],
				],
			},
			{
				priority: 5001,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameIndex",
				phase: "alter",
				up: [
					[
						"await sql`ALTER INDEX books_9187151c_monolayer_idx RENAME TO books_70c58f47_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX books_70c58f47_monolayer_idx RENAME TO books_9187151c_monolayer_idx`",
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "samples",
							to: "test_samples",
						},
						{
							from: "id",
							to: "book_id",
						},
					],
				});
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

		const books = table({
			columns: {
				book_id: integer(),
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
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropIndex",
				phase: "alter",
				transaction: false,
				up: [
					[
						'await sql`DROP INDEX CONCURRENTLY IF EXISTS "public"."books_0c84fd75_monolayer_idx"`',
						"execute(db);",
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "alter",
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
		];
		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
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

	test<DbContext>("drop complex index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_6b9be986_monolayer_idx")
			.on("books")
			.columns(["id", "samples"])
			.where("samples", ">", 20)
			.where(sql.ref("ratings"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const books = table({
			columns: {
				book_id: integer(),
				examples: integer(),
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
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropIndex",
				phase: "alter",
				transaction: false,
				up: [
					[
						'await sql`DROP INDEX CONCURRENTLY IF EXISTS "public"."books_6b9be986_monolayer_idx"`',
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`CREATE UNIQUE INDEX books_6b9be986_monolayer_idx ON public.books USING btree (id, samples) NULLS NOT DISTINCT WHERE ((samples > 20) AND (ratings > 5))`",
						"execute(db);",
					],
				],
			},
			{
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "alter",
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
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "samples",
							to: "examples",
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
						'renameColumn("samples", "examples")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("examples", "samples")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "samples",
							to: "examples",
						},
						{
							from: "id",
							to: "book_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("drop multiple indexes", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_0c84fd75_monolayer_idx")
			.on("books")
			.columns(["id"])
			.execute();

		await context.kysely.schema
			.createIndex("books_6b9be986_monolayer_idx")
			.on("books")
			.columns(["id", "samples"])
			.where("samples", ">", 20)
			.where(sql.ref("ratings"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const books = table({
			columns: {
				book_id: integer(),
				examples: integer(),
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
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropIndex",
				phase: "alter",
				transaction: false,
				up: [
					[
						'await sql`DROP INDEX CONCURRENTLY IF EXISTS "public"."books_0c84fd75_monolayer_idx"`',
						"execute(db);",
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
				priority: 800,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropIndex",
				phase: "alter",
				transaction: false,
				up: [
					[
						'await sql`DROP INDEX CONCURRENTLY IF EXISTS "public"."books_6b9be986_monolayer_idx"`',
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`CREATE UNIQUE INDEX books_6b9be986_monolayer_idx ON public.books USING btree (id, samples) NULLS NOT DISTINCT WHERE ((samples > 20) AND (ratings > 5))`",
						"execute(db);",
					],
				],
			},
			{
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "alter",
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
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "samples",
							to: "examples",
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
						'renameColumn("samples", "examples")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("examples", "samples")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected: expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "samples",
							to: "examples",
						},
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

describe("Rename column with camel case plugin", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
		vi.restoreAllMocks();
	});

	test<DbContext>("renames unique constraint", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_a91945e0_monolayer_key", ["id"], (col) =>
				col.nullsNotDistinct(),
			)
			.execute();

		const books = table({
			columns: {
				bookId: integer(),
			},
			constraints: {
				unique: [unique(["bookId"]).nullsNotDistinct()],
			},
		});

		const dbSchema = schema({
			tables: {
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
				phase: "alter",
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
				schemaName: "public",
				tableName: "books",
				currentTableName: "books",
				type: "renameUniqueConstraint",
				phase: "alter",
				up: [
					[
						'await sql`ALTER TABLE "public"."books" RENAME CONSTRAINT books_a91945e0_monolayer_key TO books_c9bd02ff_monolayer_key`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" RENAME CONSTRAINT books_c9bd02ff_monolayer_key TO books_a91945e0_monolayer_key`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
				camelCase: true,
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
					],
				});
			},
		});
	});

	test<DbContext>("renames check constraint", async (context) => {
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

		const books = table({
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
				phase: "alter",
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
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameCheckConstraint",
				phase: "alter",
				up: [
					[
						'await sql`ALTER TABLE "public"."books" RENAME CONSTRAINT books_2f1f415e_monolayer_chk TO books_dc912898_monolayer_chk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" RENAME CONSTRAINT books_dc912898_monolayer_chk TO books_2f1f415e_monolayer_chk`',
						"execute(db);",
					],
				],
			},
			{
				priority: 5002,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameCheckConstraint",
				phase: "alter",
				up: [
					[
						'await sql`ALTER TABLE "public"."books" RENAME CONSTRAINT books_e37c55a5_monolayer_chk TO books_f685097b_monolayer_chk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."books" RENAME CONSTRAINT books_f685097b_monolayer_chk TO books_e37c55a5_monolayer_chk`',
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
				camelCase: true,
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
					],
				});
			},
		});
	});

	test<DbContext>("rename foreign key child column, and parent column", async (context) => {
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

		const users = table({
			columns: {
				id: integer(),
				documentId: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["documentId"], books, ["bookId"])
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
				phase: "alter",
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
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "renameColumn",
				phase: "alter",
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
				phase: "alter",
				up: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_58e6ca22_monolayer_fk TO users_3d08c4bf_monolayer_fk`',
						"execute(db);",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "public"."users" RENAME CONSTRAINT users_3d08c4bf_monolayer_fk TO users_58e6ca22_monolayer_fk`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
				camelCase: true,
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

	test<DbContext>("rename primary key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_pkey", ["id"])
			.execute();

		const books = table({
			columns: {
				newId: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["newId"]),
			},
		});

		const dbSchema = schema({
			tables: {
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
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "id",
							to: "new_id",
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
						'renameColumn("id", "new_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("new_id", "id")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
				camelCase: true,
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "id",
							to: "new_id",
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

		const books = table({
			columns: {
				bookId: integer(),
			},
			indexes: [index(["bookId"])],
		});

		const dbSchema = schema({
			tables: {
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
				phase: "alter",
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
				phase: "alter",
				up: [
					[
						"await sql`ALTER INDEX books_0c84fd75_monolayer_idx RENAME TO books_03cf58de_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX books_03cf58de_monolayer_idx RENAME TO books_0c84fd75_monolayer_idx`",
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
				camelCase: true,
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
					],
				});
			},
		});
	});

	test<DbContext>("keep index multiple existing", async (context) => {
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

		const books = table({
			columns: {
				id: integer(),
				bookCount: integer(),
			},
			indexes: [index(["id"]), index(["bookCount"])],
		});

		const dbSchema = schema({
			tables: {
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
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "count",
							to: "book_count",
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
						'renameColumn("count", "book_count")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("book_count", "count")',
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
				phase: "alter",
				up: [
					[
						"await sql`ALTER INDEX books_457992e0_monolayer_idx RENAME TO books_2b1ab334_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX books_2b1ab334_monolayer_idx RENAME TO books_457992e0_monolayer_idx`",
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
				camelCase: true,
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
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
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_6b9be986_monolayer_idx")
			.on("books")
			.columns(["id", "samples"])
			.where("samples", ">", 20)
			.where(sql.ref("ratings"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const books = table({
			columns: {
				bookId: integer(),
				testSamples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["bookId", "testSamples"])
					.where("testSamples", ">", 20)
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "alter",
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
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "samples",
							to: "test_samples",
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
						'renameColumn("samples", "test_samples")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("test_samples", "samples")',
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
				phase: "alter",
				up: [
					[
						"await sql`ALTER INDEX books_6b9be986_monolayer_idx RENAME TO books_e92fba06_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX books_e92fba06_monolayer_idx RENAME TO books_6b9be986_monolayer_idx`",
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
				camelCase: true,
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "samples",
							to: "test_samples",
						},
						{
							from: "id",
							to: "book_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("keep complex index multiple exising", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_9187151c_monolayer_idx")
			.on("books")
			.columns(["id"])
			.execute();

		await context.kysely.schema
			.createIndex("books_332ef767_monolayer_idx")
			.on("books")
			.columns(["id"])
			.execute();

		await context.kysely.schema
			.createIndex("books_6b9be986_monolayer_idx")
			.on("books")
			.columns(["id", "samples"])
			.where("samples", ">", 20)
			.where(sql.ref("ratings"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const books = table({
			columns: {
				bookId: integer(),
				testSamples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["bookId"]).where(sql.ref("bookId"), ">", 5).unique(),
				index(["bookId", "testSamples"])
					.where("testSamples", ">", 20)
					.where(sql.ref("ratings"), ">", 5)
					.nullsNotDistinct()
					.using("btree")
					.unique(),
				index(["ratings"]),
			],
		});

		const dbSchema = schema({
			tables: {
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
				phase: "alter",
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
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "samples",
							to: "test_samples",
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
						'renameColumn("samples", "test_samples")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("test_samples", "samples")',
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
				phase: "alter",
				up: [
					[
						"await sql`ALTER INDEX books_6b9be986_monolayer_idx RENAME TO books_e92fba06_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX books_e92fba06_monolayer_idx RENAME TO books_6b9be986_monolayer_idx`",
						"execute(db);",
					],
				],
			},
			{
				priority: 5001,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameIndex",
				phase: "alter",
				up: [
					[
						"await sql`ALTER INDEX books_9187151c_monolayer_idx RENAME TO books_70c58f47_monolayer_idx`",
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`ALTER INDEX books_70c58f47_monolayer_idx RENAME TO books_9187151c_monolayer_idx`",
						"execute(db);",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
				camelCase: true,
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "samples",
							to: "test_samples",
						},
						{
							from: "id",
							to: "book_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("add index", async (context) => {
		await context.kysely.schema
			.createTable("users_pk1")
			.addColumn("name", "text")
			.addColumn("book_id", "integer")
			.execute();

		const users = table({
			columns: {
				name: text(),
				documentId: integer(),
			},
			indexes: [index(["documentId"])],
		});

		const dbSchema = schema({
			tables: {
				users_pk1: users,
			},
		});

		const expected = [
			{
				priority: 3000,
				tableName: "users_pk1",
				currentTableName: "users_pk1",
				schemaName: "public",
				type: "renameColumn",
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "book_id",
							to: "document_id",
						},
						schema: "public",
						table: "users_pk1",
						type: "backwardIncompatible",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users_pk1")',
						'renameColumn("book_id", "document_id")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users_pk1")',
						'renameColumn("document_id", "book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "users_pk1",
				currentTableName: "users_pk1",
				schemaName: "public",
				type: "createIndex",
				phase: "alter",
				transaction: false,
				up: [
					[
						`try {
    await sql\`\${sql.raw('create index concurrently "users_pk1_14f4de9c_monolayer_idx" on "public"."users_pk1" ("document_id")')}\`.execute(db);
  }
  catch (error: any) {
    if (error.code === '23505') {
      await db.withSchema("public").schema.dropIndex("users_pk1_14f4de9c_monolayer_idx").ifExists().execute();
    }
    throw error;
  }`,
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("users_pk1_14f4de9c_monolayer_idx")',
						"ifExists()",
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
				camelCase: true,
			},
			expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					users_pk1: [
						{
							from: "book_id",
							to: "document_id",
						},
					],
				});
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

		const books = table({
			columns: {
				id: integer(),
				testSamples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["id", "testSamples"])
					.where("testSamples", ">", 20)
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "samples",
							to: "test_samples",
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
						'renameColumn("samples", "test_samples")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("test_samples", "samples")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "createIndex",
				phase: "alter",
				transaction: false,
				up: [
					[
						`try {
    await sql\`\${sql.raw('create unique index concurrently "books_70e67ee1_monolayer_idx" on "public"."books" using btree ("id", "test_samples") nulls not distinct where "test_samples" > 20 and "ratings" > 5')}\`.execute(db);
  }
  catch (error: any) {
    if (error.code === '23505') {
      await db.withSchema("public").schema.dropIndex("books_70e67ee1_monolayer_idx").ifExists().execute();
    }
    throw error;
  }`,
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_70e67ee1_monolayer_idx")',
						"ifExists()",
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
				camelCase: true,
			},
			expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "samples",
							to: "test_samples",
						},
					],
				});
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

		const books = table({
			columns: {
				bookId: integer(),
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
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropIndex",
				phase: "alter",
				transaction: false,
				up: [
					[
						'await sql`DROP INDEX CONCURRENTLY IF EXISTS "public"."books_0c84fd75_monolayer_idx"`',
						"execute(db);",
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
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "alter",
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
		];

		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
				camelCase: true,
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
					],
				});
			},
		});
	});

	test<DbContext>("drop complex index", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_6b9be986_monolayer_idx")
			.on("books")
			.columns(["id", "samples"])
			.where("samples", ">", 20)
			.where(sql.ref("ratings"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const books = table({
			columns: {
				bookId: integer(),
				testSamples: integer(),
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
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropIndex",
				phase: "alter",
				transaction: false,
				up: [
					[
						'await sql`DROP INDEX CONCURRENTLY IF EXISTS "public"."books_6b9be986_monolayer_idx"`',
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`CREATE UNIQUE INDEX books_6b9be986_monolayer_idx ON public.books USING btree (id, samples) NULLS NOT DISTINCT WHERE ((samples > 20) AND (ratings > 5))`",
						"execute(db);",
					],
				],
			},
			{
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "alter",
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
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "samples",
							to: "test_samples",
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
						'renameColumn("samples", "test_samples")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("test_samples", "samples")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
				camelCase: true,
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "samples",
							to: "test_samples",
						},
						{
							from: "id",
							to: "book_id",
						},
					],
				});
			},
		});
	});

	test<DbContext>("drop multiple indexes", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("samples", "integer")
			.addColumn("ratings", "integer")
			.execute();

		await context.kysely.schema
			.createIndex("books_0c84fd75_monolayer_idx")
			.on("books")
			.columns(["id"])
			.execute();

		await context.kysely.schema
			.createIndex("books_6b9be986_monolayer_idx")
			.on("books")
			.columns(["id", "samples"])
			.where("samples", ">", 20)
			.where(sql.ref("ratings"), ">", 5)
			.nullsNotDistinct()
			.unique()
			.execute();

		const books = table({
			columns: {
				bookId: integer(),
				testSamples: integer(),
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
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropIndex",
				phase: "alter",
				transaction: false,
				up: [
					[
						'await sql`DROP INDEX CONCURRENTLY IF EXISTS "public"."books_0c84fd75_monolayer_idx"`',
						"execute(db);",
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
				priority: 800,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "dropIndex",
				phase: "alter",
				transaction: false,
				up: [
					[
						'await sql`DROP INDEX CONCURRENTLY IF EXISTS "public"."books_6b9be986_monolayer_idx"`',
						"execute(db);",
					],
				],
				down: [
					[
						"await sql`CREATE UNIQUE INDEX books_6b9be986_monolayer_idx ON public.books USING btree (id, samples) NULLS NOT DISTINCT WHERE ((samples > 20) AND (ratings > 5))`",
						"execute(db);",
					],
				],
			},
			{
				priority: 3000,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				type: "renameColumn",
				phase: "alter",
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
				phase: "alter",
				warnings: [
					{
						code: "BI002",
						columnRename: {
							from: "samples",
							to: "test_samples",
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
						'renameColumn("samples", "test_samples")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'renameColumn("test_samples", "samples")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: {
				id: "default",
				schemas: [dbSchema],
				camelCase: true,
			},
			expected: expected,
			down: "same",
			mock: () => {
				mockColumnDiffOnce({
					books: [
						{
							from: "samples",
							to: "test_samples",
						},
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
