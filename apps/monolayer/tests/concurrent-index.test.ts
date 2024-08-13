/* eslint-disable max-lines */
import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { text } from "@monorepo/pg/schema/column/data-types/text.js";
import { index } from "@monorepo/pg/schema/index.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "./__setup__/helpers/test-context.js";

describe("Modify table and add concurrent index", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("add index on table creation", async (context) => {
		const users = table({
			columns: {
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
				priority: 2001,
				schemaName: "public",
				tableName: "users",
				currentTableName: "users",
				type: "createTable",
				phase: "expand",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("name", "text")',
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
				priority: 4003,
				schemaName: "public",
				tableName: "users",
				currentTableName: "users",
				type: "createIndex",
				phase: "expand",
				up: [
					[
						'await sql`create index "users_e42f0227_monolayer_idx" on "public"."users" ("name")`',
						"execute(db);",
					],
				],
				down: [[]],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("add indexes", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.execute();

		const users = table({
			columns: {
				fullName: text(),
				name: text(),
				email: text(),
			},
			indexes: [index(["fullName"])],
		});

		const dbSchema = schema({
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 2003,
				schemaName: "public",
				tableName: "users",
				currentTableName: "users",
				type: "createColumn",
				phase: "expand",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("fullName", "text")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("fullName")',
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
				phase: "expand",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("email", "text")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("email")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				transaction: false,
				type: "createIndex",
				phase: "expand",
				up: [
					[
						`try {
    await sql\`\${sql.raw('create index concurrently "users_3cf2733f_monolayer_idx" on "public"."users" ("fullName")')}\`.execute(db);
  }
  catch (error: any) {
    if (error.code === '23505') {
      await db.withSchema("public").schema.dropIndex("users_3cf2733f_monolayer_idx").ifExists().execute();
    }
    throw error;
  }`,
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("users_3cf2733f_monolayer_idx")',
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
		});
	});

	test<DbContext>("replace indexes", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("fullName", "text")
			.addColumn("name", "text")
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
				email: text(),
				description: text(),
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
				phase: "contract",
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
				priority: 2003,
				schemaName: "public",
				tableName: "users",
				currentTableName: "users",
				type: "createColumn",
				phase: "expand",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("email", "text")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("email")',
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
				phase: "expand",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("description", "text")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("description")',
						"execute();",
					],
				],
			},
			{
				priority: 4003,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				transaction: false,
				type: "createIndex",
				phase: "expand",
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
			configuration: { id: "default", schemas: [dbSchema] },
			expected,
			down: "same",
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
				samples: integer(),
				ratings: integer(),
			},
			indexes: [
				index(["id", "samples"])
					.where("samples", ">", 20)
					.where(sql.ref("ratings"), ">", 5)
					.where((eb) =>
						eb.and([eb("samples", "=", 2), eb(sql.ref("ratings"), ">=", 18)]),
					)
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
				priority: 4003,
				tableName: "books",
				currentTableName: "books",
				schemaName: "public",
				transaction: false,
				type: "createIndex",
				phase: "expand",
				up: [
					[
						`try {
    await sql\`\${sql.raw('create unique index concurrently "books_679ece99_monolayer_idx" on "public"."books" using btree ("id", "samples") nulls not distinct where "samples" > 20 and "ratings" > 5 and ("samples" = 2 and "ratings" >= 18)')}\`.execute(db);
  }
  catch (error: any) {
    if (error.code === '23505') {
      await db.withSchema("public").schema.dropIndex("books_679ece99_monolayer_idx").ifExists().execute();
    }
    throw error;
  }`,
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("books_679ece99_monolayer_idx")',
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
		});
	});
});
