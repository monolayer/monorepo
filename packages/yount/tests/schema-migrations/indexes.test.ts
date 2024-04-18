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
			.createIndex("users_3cf2733f_yount_idx")
			.on("users")
			.column("fullName")
			.execute();

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
						'await sql`create index "users_e42f0227_yount_idx" on "public"."users" ("name")`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("users_e42f0227_yount_idx")',
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
			.createIndex("users_3cf2733f_yount_idx")
			.on("users")
			.column("fullName")
			.execute();

		await context.kysely.schema
			.createIndex("users_e42f0227_yount_idx")
			.on("users")
			.column("name")
			.execute();

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
				priority: 800,
				tableName: "users",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("users_3cf2733f_yount_idx")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`CREATE INDEX users_3cf2733f_yount_idx ON public.users USING btree ("fullName")`',
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
			.createIndex("users_3cf2733f_yount_idx")
			.on("users")
			.column("fullName")
			.execute();

		await context.kysely.schema
			.createIndex("users_e42f0227_yount_idx")
			.on("users")
			.column("name")
			.execute();

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
				priority: 800,
				tableName: "users",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("users_3cf2733f_yount_idx")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`CREATE INDEX users_3cf2733f_yount_idx ON public.users USING btree ("fullName")`',
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
						'await sql`create index "users_2d87ba04_yount_idx" on "public"."users" ("name", "fullName")`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("users_2d87ba04_yount_idx")',
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
			.createIndex("users_3cf2733f_yount_idx")
			.on("users")
			.column("fullName")
			.execute();

		await context.kysely.schema
			.createIndex("users_e42f0227_yount_idx")
			.on("users")
			.column("name")
			.execute();

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
				priority: 800,
				tableName: "users",
				type: "dropIndex",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("users_3cf2733f_yount_idx")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`CREATE INDEX users_3cf2733f_yount_idx ON public.users USING btree ("fullName")`',
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
						'await sql`create unique index "users_861127a4_yount_idx" on "public"."users" ("fullName")`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropIndex("users_861127a4_yount_idx")',
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
