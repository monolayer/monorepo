/* eslint-disable max-lines */
import { afterEach, beforeEach, describe, test } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { varchar } from "~/database/schema/table/column/data-types/character-varying.js";
import { integer } from "~/database/schema/table/column/data-types/integer.js";
import { serial } from "~/database/schema/table/column/data-types/serial.js";
import { primaryKey } from "~/database/schema/table/constraints/primary-key/primary-key.js";
import { unique } from "~/database/schema/table/constraints/unique/unique.js";
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

	test<DbContext>("add unique constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("name", "varchar")
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("fullName", "varchar")
			.execute();

		const books = table({
			columns: {
				id: integer(),
				name: varchar(),
			},
			constraints: {
				unique: [unique(["id"]).nullsNotDistinct(), unique(["name"])],
			},
		});

		const users = table({
			columns: {
				id: serial(),
				fullName: varchar(),
			},
			constraints: {
				unique: [unique(["id", "fullName"])],
			},
		});

		const dbSchema = schema({
			tables: {
				books,
				users,
			},
		});

		const expected = [
			{
				priority: 4002,
				tableName: "books",
				type: "createConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_a91945e0_yount_key", ["id"], (col) => col.nullsNotDistinct())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_a91945e0_yount_key")',
						"execute();",
					],
				],
			},
			{
				priority: 4002,
				tableName: "books",
				type: "createConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_adbefd84_yount_key", ["name"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_adbefd84_yount_key")',
						"execute();",
					],
				],
			},
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addUniqueConstraint("users_83137b76_yount_key", ["fullName", "id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_83137b76_yount_key")',
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

	test<DbContext>("remove unique constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.addColumn("name", "varchar")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_a91945e0_yount_key", ["id"], (uc) =>
				uc.nullsNotDistinct(),
			)
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_adbefd84_yount_key", ["name"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("fullName", "varchar")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addUniqueConstraint("users_83137b76_yount_key", ["id", "fullName"])
			.execute();

		const books = table({
			columns: {
				id: integer(),
				name: varchar(),
			},
		});

		const users = table({
			columns: {
				id: serial(),
				fullName: varchar(),
			},
			constraints: {
				unique: [unique(["fullName", "id"])],
			},
		});

		const dbSchema = schema({
			tables: {
				books,
				users,
			},
		});

		const expected = [
			{
				priority: 1003,
				tableName: "books",
				type: "dropConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_a91945e0_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_a91945e0_yount_key", ["id"], (col) => col.nullsNotDistinct())',
						"execute();",
					],
				],
			},
			{
				priority: 1003,
				tableName: "books",
				type: "dropConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'dropConstraint("books_adbefd84_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("books")',
						'addUniqueConstraint("books_adbefd84_yount_key", ["name"])',
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

	test<DbContext>("replace unique constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_a91945e0_yount_key", ["id"], (uc) =>
				uc.nullsNotDistinct(),
			)
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("fullName", "varchar")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addUniqueConstraint("users_83137b76_yount_key", ["id", "fullName"])
			.execute();

		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				unique: [unique(["id"]).nullsNotDistinct()],
			},
		});

		const users = table({
			columns: {
				id: serial(),
				fullName: varchar(),
			},
			constraints: {
				unique: [unique(["id"])],
			},
		});

		const dbSchema = schema({
			tables: {
				books,
				users,
			},
		});

		const expected = [
			{
				priority: 1003,
				tableName: "users",
				type: "dropConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_83137b76_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addUniqueConstraint("users_83137b76_yount_key", ["fullName", "id"])',
						"execute();",
					],
				],
			},
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addUniqueConstraint("users_acdd8fa3_yount_key", ["id"])',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_acdd8fa3_yount_key")',
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

	test<DbContext>("change unique constraints", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addUniqueConstraint("books_a91945e0_yount_key", ["id"], (uc) =>
				uc.nullsNotDistinct(),
			)
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("fullName", "varchar")
			.execute();

		await context.kysely.schema
			.alterTable("users")
			.addUniqueConstraint("users_83137b76_yount_key", ["id", "fullName"])
			.execute();
		// users_fbf55213_yount_key
		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				unique: [unique(["id"]).nullsNotDistinct()],
			},
		});

		const users = table({
			columns: {
				id: serial(),
				fullName: varchar(),
			},
			constraints: {
				unique: [unique(["id", "fullName"]).nullsNotDistinct()],
			},
		});

		const dbSchema = schema({
			tables: {
				books,
				users,
			},
		});

		const expected = [
			{
				priority: 1003,
				tableName: "users",
				type: "dropConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_83137b76_yount_key")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addUniqueConstraint("users_83137b76_yount_key", ["fullName", "id"])',
						"execute();",
					],
				],
			},
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addUniqueConstraint("users_fbf55213_yount_key", ["fullName", "id"], (col) => col.nullsNotDistinct())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_fbf55213_yount_key")',
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

	test<DbContext>("unique constraints across schemas", async (context) => {
		const users = table({
			columns: {
				id: serial(),
				email: varchar(255).notNull(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
				unique: [unique(["email"])],
			},
		});

		const dbSchema = schema({
			tables: {
				users,
			},
		});

		const usersSchema = schema({
			name: "users",
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 2001,
				tableName: "users",
				type: "createTable",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						'addColumn("email", sql`character varying(255)`, (col) => col.notNull())',
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
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addPrimaryKeyConstraint("users_yount_pk", ["id"])',
						"execute();",
					],
				],
				down: [[]],
			},
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addUniqueConstraint("users_f368ca51_yount_key", ["email"])',
						"execute();",
					],
				],
				down: [[]],
			},
			{
				priority: 0,
				tableName: "none",
				type: "createSchema",
				up: [
					['await sql`CREATE SCHEMA IF NOT EXISTS "users";`', "execute(db);"],
				],
				down: [],
			},
			{
				priority: 2001,
				tableName: "users",
				type: "createTable",
				up: [
					[
						'await db.withSchema("users").schema',
						'createTable("users")',
						'addColumn("id", "serial", (col) => col.notNull())',
						'addColumn("email", sql`character varying(255)`, (col) => col.notNull())',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("users").schema',
						'dropTable("users")',
						"execute();",
					],
				],
			},
			{
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					[
						'await db.withSchema("users").schema',
						'alterTable("users")',
						'addPrimaryKeyConstraint("users_yount_pk", ["id"])',
						"execute();",
					],
				],
				down: [[]],
			},
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					[
						'await db.withSchema("users").schema',
						'alterTable("users")',
						'addUniqueConstraint("users_f368ca51_yount_key", ["email"])',
						"execute();",
					],
				],
				down: [[]],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: { schemas: [dbSchema, usersSchema] },
			expected,
			down: "same",
		});
	});
});
