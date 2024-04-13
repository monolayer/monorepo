/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { text } from "~/database/schema/table/column/data-types/text.js";
import { index } from "~/database/schema/table/index/index.js";
import { table } from "~/database/schema/table/table.js";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "../__setup__/helpers/test-context.js";

describe("Database migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("add indexes", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("fullName", "text")
			.execute();

		await context.kysely.schema
			.createIndex("81f0b9e5_yount_idx")
			.on("users")
			.column("fullName")
			.execute();
		await sql`COMMENT ON INDEX "81f0b9e5_yount_idx" IS \'81f0b9e5\'`.execute(
			context.kysely,
		);

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
				type: "createIndex",
				up: [
					[
						'await sql`create index "83f9e13d_yount_idx" on "public"."users" ("name")`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON INDEX "public"."83f9e13d_yount_idx" IS \'83f9e13d\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("83f9e13d_yount_idx")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
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
			.createIndex("users_fullName_yount_idx")
			.on("users")
			.column("fullName")
			.execute();
		await sql`COMMENT ON INDEX "users_fullName_yount_idx" IS \'ad74f314\'`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.createIndex("83f9e13d_yount_idx")
			.on("users")
			.column("name")
			.execute();
		await sql`COMMENT ON INDEX "83f9e13d_yount_idx" IS \'83f9e13d\'`.execute(
			context.kysely,
		);

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
				priority: 1002,
				tableName: "users",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("users_fullName_yount_idx")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`CREATE INDEX "users_fullName_yount_idx" ON public.users USING btree ("fullName")`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON INDEX "public"."users_fullName_yount_idx" IS \'ad74f314\'`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
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
			.createIndex("81f0b9e5_yount_idx")
			.on("users")
			.column("fullName")
			.execute();
		await sql`COMMENT ON INDEX "81f0b9e5_yount_idx" IS \'81f0b9e5\'`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.createIndex("83f9e13d_yount_idx")
			.on("users")
			.column("name")
			.execute();
		await sql`COMMENT ON INDEX "83f9e13d_yount_idx" IS \'83f9e13d\'`.execute(
			context.kysely,
		);

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
				priority: 1002,
				tableName: "users",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("81f0b9e5_yount_idx")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`CREATE INDEX "81f0b9e5_yount_idx" ON public.users USING btree ("fullName")`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON INDEX "public"."81f0b9e5_yount_idx" IS \'81f0b9e5\'`',
						"execute(db);",
					],
				],
			},
			{
				priority: 4003,
				tableName: "users",
				type: "createIndex",
				up: [
					[
						'await sql`create index "c7bd604d_yount_idx" on "public"."users" ("name", "fullName")`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON INDEX "public"."c7bd604d_yount_idx" IS \'c7bd604d\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("c7bd604d_yount_idx")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
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
			.createIndex("81f0b9e5_yount_idx")
			.on("users")
			.column("fullName")
			.execute();
		await sql`COMMENT ON INDEX "81f0b9e5_yount_idx" IS \'81f0b9e5\'`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.createIndex("83f9e13d_yount_idx")
			.on("users")
			.column("name")
			.execute();
		await sql`COMMENT ON INDEX "83f9e13d_yount_idx" IS \'83f9e13d\'`.execute(
			context.kysely,
		);

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
				priority: 1002,
				tableName: "users",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("81f0b9e5_yount_idx")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`CREATE INDEX "81f0b9e5_yount_idx" ON public.users USING btree ("fullName")`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON INDEX "public"."81f0b9e5_yount_idx" IS \'81f0b9e5\'`',
						"execute(db);",
					],
				],
			},
			{
				priority: 4003,
				tableName: "users",
				type: "createIndex",
				up: [
					[
						'await sql`create unique index "1790ab15_yount_idx" on "public"."users" ("fullName")`',
						"execute(db);",
					],
					[
						'await sql`COMMENT ON INDEX "public"."1790ab15_yount_idx" IS \'1790ab15\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("1790ab15_yount_idx")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});
});
