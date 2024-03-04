import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { pgEnum, pgInteger, pgSerial } from "~/database/schema/pg_column.js";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { pgTable } from "~/database/schema/pg_table.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration_success.js";
import { type DbContext } from "~tests/setup.js";
import { setUpContext, teardownContext } from "../../helpers/test_context.js";

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

		const users = pgTable({
			columns: {
				id: pgInteger(),
				role: pgEnum("role", ["admin", "user"]),
			},
		});

		const database = pgDatabase({
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 0,
				tableName: "none",
				type: "createEnum",
				up: [
					[
						"await db.schema",
						'createType("role")',
						'asEnum(["admin", "user"])',
						"execute();await sql`COMMENT ON TYPE \"role\" IS 'kinetic'`.execute(db)",
					],
				],
				down: [["await db.schema", 'dropType("role")', "execute();"]],
			},
			{
				priority: 2002,
				tableName: "users",
				type: "createColumn",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						'addColumn("role", sql`role`)',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropColumn("role")',
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

	test<DbContext>("drop enums", async (context) => {
		await context.kysely.schema
			.createType("role")
			.asEnum(["admin", "user"])
			.execute();
		await sql`COMMENT ON TYPE "role" IS 'kinetic'`.execute(context.kysely);

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("role", sql`role`)
			.execute();

		const users = pgTable({
			columns: {
				id: pgSerial(),
			},
		});

		const database = pgDatabase({
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 1005,
				tableName: "users",
				type: "dropColumn",
				up: [
					[
						"await db.schema",
						'alterTable("users")',
						'dropColumn("role")',
						"execute();",
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("users")',
						'addColumn("role", sql`role`)',
						"execute();",
					],
				],
			},
			{
				priority: 3009,
				tableName: "none",
				type: "dropEnum",
				up: [["await db.schema", 'dropType("role")', "execute();"]],
				down: [
					[
						"await db.schema",
						'createType("role")',
						'asEnum(["admin", "user"])',
						"execute();await sql`COMMENT ON TYPE \"role\" IS 'kinetic'`.execute(db)",
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

	test<DbContext>("change enums", async (context) => {
		await context.kysely.schema
			.createType("role")
			.asEnum(["admin", "user"])
			.execute();
		await sql`COMMENT ON TYPE "role" IS 'kinetic'`.execute(context.kysely);

		await context.kysely.schema
			.createTable("users")
			.addColumn("id", "serial")
			.addColumn("role", sql`role`)
			.execute();

		const users = pgTable({
			columns: {
				id: pgSerial(),
				role: pgEnum("role", ["admin", "user", "superuser"]),
			},
		});

		const database = pgDatabase({
			tables: {
				users,
			},
		});

		const expected = [
			{
				priority: 0,
				tableName: "none",
				type: "changeEnum",
				up: [
					[
						"await sql`ALTER TYPE role ADD VALUE IF NOT EXISTS 'superuser';`.execute(db);",
					],
				],
				down: [],
			},
		];

		await testChangesetAndMigrations({
			context,
			database,
			expected,
			down: "empty",
		});
	});
});
