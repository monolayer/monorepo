/* eslint-disable max-lines */
import { enumType } from "@monorepo/pg/schema/column/data-types/enum.js";
import { enumerated } from "@monorepo/pg/schema/column/data-types/enumerated.js";
import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { serial } from "@monorepo/pg/schema/column/data-types/serial.js";
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

describe("Database migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("add enums", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "integer")
			.execute();

		const role = enumType("role", ["admin", "user"]);
		const users = table({
			columns: {
				id: integer(),
				role: enumerated(role),
			},
		});

		const dbSchema = schema({
			types: [role],
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 2,
				tableName: "none",
				currentTableName: "none",
				schemaName: "public",
				type: "createEnum",
				phase: "expand",
				up: [
					[
						'await db.withSchema("public").schema',
						'createType("role")',
						'asEnum(["admin", "user"])',
						"execute();",
					],
					[
						'await sql`COMMENT ON TYPE "public"."role" IS \'monolayer\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropType("role")',
						"execute();",
					],
				],
			},
			{
				priority: 2003,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createColumn",
				phase: "expand",
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("role", sql`"role"`)',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("role")',
						"execute();",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("drop enums", async (context) => {
		await context.kysely.schema
			.createType("role")
			.asEnum(["admin", "user"])
			.execute();
		await sql`COMMENT ON TYPE "role" IS 'monolayer'`.execute(context.kysely);

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("role", sql`role`)
			.execute();

		const users = table({
			columns: {
				id: serial(),
			},
		});

		const dbSchema = schema({
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 1005,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "dropColumn",
				phase: "contract",
				warnings: [
					{
						code: "D003",
						column: "role",
						schema: "public",
						table: "users",
						type: "destructive",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("role")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("role", sql`"role"`)',
						"execute();",
					],
				],
			},
			{
				priority: 6003,
				tableName: "none",
				currentTableName: "none",
				schemaName: "public",
				type: "dropEnum",
				phase: "contract",
				up: [
					[
						'await db.withSchema("public").schema',
						'dropType("role")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'createType("role")',
						'asEnum(["admin", "user"])',
						"execute();",
					],
					[
						'await sql`COMMENT ON TYPE "public"."role" IS \'monolayer\'`',
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("change enums", async (context) => {
		await context.kysely.schema
			.createType("role")
			.asEnum(["admin", "user"])
			.execute();
		await sql`COMMENT ON TYPE "role" IS 'monolayer'`.execute(context.kysely);

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("role", sql`role`)
			.execute();

		const role = enumType("role", ["admin", "user", "superuser"]);
		const users = table({
			columns: {
				id: serial(),
				role: enumerated(role),
			},
		});

		const dbSchema = schema({
			types: [role],
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 3,
				tableName: "none",
				currentTableName: "none",
				schemaName: "public",
				type: "changeEnum",
				phase: "expand",
				up: [
					[
						'await sql`ALTER TYPE "public"."role" ADD VALUE IF NOT EXISTS \'superuser\';`',
						"execute(db);",
					],
				],
				down: [],
			},
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema] },
			expected,
			down: "empty",
		});
	});

	test<DbContext>("add enums across schemas", async (context) => {
		const role = enumType("role", ["admin", "user"]);
		const users = table({
			columns: {
				role: enumerated(role),
			},
		});

		const dbSchema = schema({
			types: [role],
			tables: {
				users,
			},
		});

		const anotherDbSchema = schema({
			name: "users",
			types: [role],
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 2,
				tableName: "none",
				currentTableName: "none",
				schemaName: "public",
				type: "createEnum",
				phase: "expand",
				up: [
					[
						'await db.withSchema("public").schema',
						'createType("role")',
						'asEnum(["admin", "user"])',
						"execute();",
					],
					[
						'await sql`COMMENT ON TYPE "public"."role" IS \'monolayer\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'dropType("role")',
						"execute();",
					],
				],
			},
			{
				priority: 2001,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createTable",
				phase: "expand",
				up: [
					[
						'await db.withSchema("public").schema',
						'createTable("users")',
						'addColumn("role", sql`"role"`)',
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
				priority: 0,
				tableName: "none",
				currentTableName: "none",
				schemaName: "users",
				type: "createSchema",
				phase: "expand",
				up: [
					['await sql`CREATE SCHEMA IF NOT EXISTS "users";`', "execute(db);"],
					[
						"await sql`COMMENT ON SCHEMA \"users\" IS 'monolayer'`",
						"execute(db);",
					],
				],
				down: [['await sql`DROP SCHEMA IF EXISTS "users";`', "execute(db);"]],
			},
			{
				priority: 2,
				tableName: "none",
				currentTableName: "none",
				schemaName: "users",
				type: "createEnum",
				phase: "expand",
				up: [
					[
						'await db.withSchema("users").schema',
						'createType("role")',
						'asEnum(["admin", "user"])',
						"execute();",
					],
					[
						'await sql`COMMENT ON TYPE "users"."role" IS \'monolayer\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("users").schema',
						'dropType("role")',
						"execute();",
					],
				],
			},
			{
				priority: 2001,
				tableName: "users",
				currentTableName: "users",
				schemaName: "users",
				type: "createTable",
				phase: "expand",
				up: [
					[
						'await db.withSchema("users").schema',
						'createTable("users")',
						'addColumn("role", sql`"role"`)',
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
		];

		await testChangesetAndMigrations({
			context,
			configuration: { schemas: [dbSchema, anotherDbSchema] },
			expected,
			down: "same",
		});
	});
});
