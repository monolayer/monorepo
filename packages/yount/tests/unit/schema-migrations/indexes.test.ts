import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { pgDatabase } from "~/schema/pg-database.js";
import { text } from "~/schema/table/column/data-types/text.js";
import { index } from "~/schema/table/index/index.js";
import { table } from "~/schema/table/table.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration-success.js";
import { type DbContext } from "~tests/setup/kysely.js";
import { setUpContext, teardownContext } from "../../helpers/test-context.js";

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
		await sql`COMMENT ON INDEX "users_fullName_kntc_idx" IS \'ad74f314\'`.execute(
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
						'await sql`create index "users_name_kntc_idx" on "users" ("name")`',
						"execute(db);",
					],
					[
						"await sql`COMMENT ON INDEX \"users_name_kntc_idx\" IS 'f873e4a8'`",
						"execute(db);",
					],
				],
				down: [
					["await db.schema", 'dropIndex("users_name_kntc_idx")', "execute();"],
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
		await sql`COMMENT ON INDEX "users_fullName_kntc_idx" IS \'ad74f314\'`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.createIndex("users_name_kntc_idx")
			.on("users")
			.column("name")
			.execute();
		await sql`COMMENT ON INDEX "users_name_kntc_idx" IS \'f873e4a8\'`.execute(
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
					[
						"await db.schema",
						'dropIndex("users_fullName_kntc_idx")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`CREATE INDEX "users_fullName_kntc_idx" ON public.users USING btree ("fullName")`',
						"execute(db);",
					],
					[
						"await sql`COMMENT ON INDEX \"users_fullName_kntc_idx\" IS 'ad74f314'`",
						"execute(db);",
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
		await sql`COMMENT ON INDEX "users_fullName_kntc_idx" IS \'ad74f314\'`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.createIndex("users_name_kntc_idx")
			.on("users")
			.column("name")
			.execute();
		await sql`COMMENT ON INDEX "users_name_kntc_idx" IS \'f873e4a8\'`.execute(
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
					[
						"await db.schema",
						'dropIndex("users_fullName_kntc_idx")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`CREATE INDEX "users_fullName_kntc_idx" ON public.users USING btree ("fullName")`',
						"execute(db);",
					],
					[
						"await sql`COMMENT ON INDEX \"users_fullName_kntc_idx\" IS 'ad74f314'`",
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
						'await sql`create index "users_name_fullName_kntc_idx" on "users" ("name", "fullName")`',
						"execute(db);",
					],
					[
						"await sql`COMMENT ON INDEX \"users_name_fullName_kntc_idx\" IS '94f56c57'`",
						"execute(db);",
					],
				],
				down: [
					[
						"await db.schema",
						'dropIndex("users_name_fullName_kntc_idx")',
						"execute();",
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
		await sql`COMMENT ON INDEX "users_fullName_kntc_idx" IS \'ad74f314\'`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.createIndex("users_name_kntc_idx")
			.on("users")
			.column("name")
			.execute();
		await sql`COMMENT ON INDEX "users_name_kntc_idx" IS \'f873e4a8\'`.execute(
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
					['await sql`DROP INDEX "users_fullName_kntc_idx"`', "execute(db);"],
					[
						'await sql`create unique index "users_fullName_kntc_idx" on "users" ("fullName")`',
						"execute(db);",
					],
					[
						"await sql`COMMENT ON INDEX \"users_fullName_kntc_idx\" IS '713f9d14'`",
						"execute(db);",
					],
				],
				down: [
					['await sql`DROP INDEX "users_fullName_kntc_idx"`', "execute(db);"],
					[
						'await sql`CREATE INDEX "users_fullName_kntc_idx" ON public.users USING btree ("fullName")`',
						"execute(db);",
					],
					[
						"await sql`COMMENT ON INDEX \"users_fullName_kntc_idx\" IS 'ad74f314'`",
						"execute(db);",
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
