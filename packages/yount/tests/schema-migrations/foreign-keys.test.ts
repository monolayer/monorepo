/* eslint-disable max-lines */
import { afterEach, beforeEach, describe, test } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { varchar } from "~/database/schema/table/column/data-types/character-varying.js";
import { integer } from "~/database/schema/table/column/data-types/integer.js";
import { serial } from "~/database/schema/table/column/data-types/serial.js";
import { foreignKey } from "~/database/schema/table/constraints/foreign-key/foreign-key.js";
import { primaryKey } from "~/database/schema/table/constraints/primary-key/primary-key.js";
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

	test<DbContext>("add foreign keys", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("name", "varchar")
			.execute();

		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const users = table({
			columns: {
				id: serial(),
				book_id: integer(),
				name: varchar(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["id"], books, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
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
				priority: 2002,
				tableName: "users",
				type: "createColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("book_id", "integer")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("book_id")',
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
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_61a55869_yount_fk", ["id"], "books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_61a55869_yount_fk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_61a55869_yount_fk")',
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

	test<DbContext>("add multiple first foreign keys", async (context) => {
		await context.kysely.schema
			.createTable("old_books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("old_books")
			.addPrimaryKeyConstraint("old_books_id_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("name", "varchar")
			.execute();

		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const old_books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const users = table({
			columns: {
				id: serial(),
				book_id: integer(),
				second_book_id: integer(),
				name: varchar(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["id"], books, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
					foreignKey(["second_book_id"], old_books, ["id"])
						.updateRule("set null")
						.deleteRule("set null"),
				],
			},
		});

		const dbSchema = schema({
			tables: {
				books,
				old_books,
				users,
			},
		});

		const expected = [
			{
				priority: 2002,
				tableName: "users",
				type: "createColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("book_id", "integer")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("book_id")',
						"execute();",
					],
				],
			},
			{
				priority: 2002,
				tableName: "users",
				type: "createColumn",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("second_book_id", "integer")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("second_book_id")',
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
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_61a55869_yount_fk", ["id"], "books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_61a55869_yount_fk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_61a55869_yount_fk")',
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
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_2e371f6e_yount_fk", ["second_book_id"], "old_books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_2e371f6e_yount_fk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_2e371f6e_yount_fk")',
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

	test<DbContext>("remove foreign keys", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
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

		const users = table({
			columns: {
				id: serial(),
				book_id: integer(),
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
						'dropConstraint("users_c02e3d7d_yount_fk")',
						"execute();",
					],
				],
				down: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_c02e3d7d_yount_fk", ["book_id"], "books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_c02e3d7d_yount_fk"`',
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

	test<DbContext>("remove multiple foreign keys", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("old_books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("old_books")
			.addPrimaryKeyConstraint("old_books_id_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("book_id", "integer")
			.addColumn("old_book_id", "integer")
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

		await context.kysely.schema
			.alterTable("users")
			.addForeignKeyConstraint(
				"users_6e0ceffc_yount_fk",
				["old_book_id"],
				"old_books",
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

		const old_books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});

		const users = table({
			columns: {
				id: serial(),
				book_id: integer(),
				old_book_id: integer(),
			},
		});

		const dbSchema = schema({
			tables: {
				books,
				old_books,
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
						'dropConstraint("users_c02e3d7d_yount_fk")',
						"execute();",
					],
				],
				down: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_c02e3d7d_yount_fk", ["book_id"], "books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_c02e3d7d_yount_fk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 1003,
				tableName: "users",
				type: "dropConstraint",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_6e0ceffc_yount_fk")',
						"execute();",
					],
				],
				down: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_6e0ceffc_yount_fk", ["old_book_id"], "old_books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_6e0ceffc_yount_fk"`',
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

	test<DbContext>("replace foreign key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
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

		const users = table({
			columns: {
				id: serial(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["id"], books, ["id"])
						.updateRule("cascade")
						.deleteRule("set null"),
				],
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
						'dropConstraint("users_c02e3d7d_yount_fk")',
						"execute();",
					],
				],
				down: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_c02e3d7d_yount_fk", ["book_id"], "books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_c02e3d7d_yount_fk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_01f2f16d_yount_fk", ["id"], "books", ["id"])
    .onDelete("set null")
    .onUpdate("cascade")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_01f2f16d_yount_fk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_01f2f16d_yount_fk")',
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

	test<DbContext>("change foreign key", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addPrimaryKeyConstraint("books_id_yount_pk", ["id"])
			.execute();

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
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

		const users = table({
			columns: {
				id: serial(),
				book_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["book_id"], books, ["id"])
						.updateRule("cascade")
						.deleteRule("set null"),
				],
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
						'dropConstraint("users_c02e3d7d_yount_fk")',
						"execute();",
					],
				],
				down: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_c02e3d7d_yount_fk", ["book_id"], "books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_c02e3d7d_yount_fk"`',
						"execute(db);",
					],
				],
			},
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_5c1a35cf_yount_fk", ["book_id"], "books", ["id"])
    .onDelete("set null")
    .onUpdate("cascade")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_5c1a35cf_yount_fk"`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("users_5c1a35cf_yount_fk")',
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