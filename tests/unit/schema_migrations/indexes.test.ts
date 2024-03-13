import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { text } from "~/schema/pg_column.js";
import { pgDatabase } from "~/schema/pg_database.js";
import { index } from "~/schema/pg_index.js";
import { table } from "~/schema/pg_table.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration_success.js";
import { type DbContext } from "~tests/setup/kysely.js";
import { setUpContext, teardownContext } from "../../helpers/test_context.js";

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
			.createIndex("users_fullName_kntc_idx")
			.on("users")
			.column("fullName")
			.execute();
		await sql`COMMENT ON INDEX "users_fullName_kntc_idx" IS \'ad74f314032ddf2bfaa4c8df84eda0879a9c47265237c8fa3db2b788ebbb3c9c\'`.execute(
			context.kysely,
		);

		const users = table({
			columns: {
				fullName: text(),
				name: text(),
			},
			indexes: [index(["fullName"]), index(["name"])],
		});

		const database = pgDatabase({
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
						'await sql`create index "users_name_kntc_idx" on "users" ("name");COMMENT ON INDEX "users_name_kntc_idx" IS \'f873e4a8464da05b0b0978fff8711714af80a8c32d067955877ae60792414d45\'`.execute(db);',
					],
				],
				down: [['await db.schema.dropIndex("users_name_kntc_idx").execute();']],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("remove indexes", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("fullName", "text")
			.execute();

		await context.kysely.schema
			.createIndex("users_fullName_kntc_idx")
			.on("users")
			.column("fullName")
			.execute();
		await sql`COMMENT ON INDEX "users_fullName_kntc_idx" IS \'ad74f314032ddf2bfaa4c8df84eda0879a9c47265237c8fa3db2b788ebbb3c9c\'`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.createIndex("users_name_kntc_idx")
			.on("users")
			.column("name")
			.execute();
		await sql`COMMENT ON INDEX "users_name_kntc_idx" IS \'f873e4a8464da05b0b0978fff8711714af80a8c32d067955877ae60792414d45\'`.execute(
			context.kysely,
		);

		const users = table({
			columns: {
				fullName: text(),
				name: text(),
			},
			indexes: [index(["name"])],
		});

		const database = pgDatabase({
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
					['await db.schema.dropIndex("users_fullName_kntc_idx").execute();'],
				],
				down: [
					[
						'await sql`CREATE INDEX "users_fullName_kntc_idx" ON public.users USING btree ("fullName");COMMENT ON INDEX "users_fullName_kntc_idx" IS \'ad74f314032ddf2bfaa4c8df84eda0879a9c47265237c8fa3db2b788ebbb3c9c\'`.execute(db);',
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("add and remove indexes", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("fullName", "text")
			.execute();

		await context.kysely.schema
			.createIndex("users_fullName_kntc_idx")
			.on("users")
			.column("fullName")
			.execute();
		await sql`COMMENT ON INDEX "users_fullName_kntc_idx" IS \'ad74f314032ddf2bfaa4c8df84eda0879a9c47265237c8fa3db2b788ebbb3c9c\'`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.createIndex("users_name_kntc_idx")
			.on("users")
			.column("name")
			.execute();
		await sql`COMMENT ON INDEX "users_name_kntc_idx" IS \'f873e4a8464da05b0b0978fff8711714af80a8c32d067955877ae60792414d45\'`.execute(
			context.kysely,
		);

		const users = table({
			columns: {
				fullName: text(),
				name: text(),
			},
			indexes: [index(["name"]), index(["name", "fullName"])],
		});

		const database = pgDatabase({
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
					['await db.schema.dropIndex("users_fullName_kntc_idx").execute();'],
				],
				down: [
					[
						'await sql`CREATE INDEX "users_fullName_kntc_idx" ON public.users USING btree ("fullName");COMMENT ON INDEX "users_fullName_kntc_idx" IS \'ad74f314032ddf2bfaa4c8df84eda0879a9c47265237c8fa3db2b788ebbb3c9c\'`.execute(db);',
					],
				],
			},
			{
				priority: 4003,
				tableName: "users",
				type: "createIndex",
				up: [
					[
						'await sql`create index "users_name_fullName_kntc_idx" on "users" ("name", "fullName");COMMENT ON INDEX "users_name_fullName_kntc_idx" IS \'94f56c57e18c098a2ab70fd783fdeeaa660799088965d10d271817a7369bf4d7\'`.execute(db);',
					],
				],
				down: [
					[
						'await db.schema.dropIndex("users_name_fullName_kntc_idx").execute();',
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});

	test<DbContext>("change index", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("name", "text")
			.addColumn("fullName", "text")
			.execute();

		await context.kysely.schema
			.createIndex("users_fullName_kntc_idx")
			.on("users")
			.column("fullName")
			.execute();
		await sql`COMMENT ON INDEX "users_fullName_kntc_idx" IS \'ad74f314032ddf2bfaa4c8df84eda0879a9c47265237c8fa3db2b788ebbb3c9c\'`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.createIndex("users_name_kntc_idx")
			.on("users")
			.column("name")
			.execute();
		await sql`COMMENT ON INDEX "users_name_kntc_idx" IS \'f873e4a8464da05b0b0978fff8711714af80a8c32d067955877ae60792414d45\'`.execute(
			context.kysely,
		);

		const users = table({
			columns: {
				fullName: text(),
				name: text(),
			},
			indexes: [index(["name"]), index(["fullName"]).unique()],
		});

		const database = pgDatabase({
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 5001,
				tableName: "users",
				type: "changeIndex",
				up: [
					[
						'await sql`DROP INDEX "users_fullName_kntc_idx";create unique index "users_fullName_kntc_idx" on "users" ("fullName");COMMENT ON INDEX "users_fullName_kntc_idx" IS \'713f9d140066f05644109e679bfb1f0307cda86277f6d7393ad1b0bfc78429a5\'`.execute(db);',
					],
				],
				down: [
					[
						'await sql`DROP INDEX "users_fullName_kntc_idx";CREATE INDEX "users_fullName_kntc_idx" ON public.users USING btree ("fullName");COMMENT ON INDEX "users_fullName_kntc_idx" IS \'ad74f314032ddf2bfaa4c8df84eda0879a9c47265237c8fa3db2b788ebbb3c9c\'`.execute(db);',
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "reverse",
		});
	});
});
