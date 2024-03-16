/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { check } from "~/schema/pg_check.js";
import { integer } from "~/schema/pg_column.js";
import { pgDatabase } from "~/schema/pg_database.js";
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

	test<DbContext>("add check constraints", async (context) => {
		const firstCheck = check(sql`${sql.ref("id")} > 50`);
		const secondCheck = check(sql`${sql.ref("id")} < 50000`);

		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("918b4271_kinetic_chk", sql`"id" > 50`)
			.execute();

		await sql`COMMENT ON CONSTRAINT "918b4271_kinetic_chk" ON "books" IS \'918b4271\'`.execute(
			context.kysely,
		);

		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				checks: [firstCheck, secondCheck],
			},
		});

		const database = pgDatabase({
			tables: {
				books,
			},
		});

		const expected = [
			{
				priority: 4002,
				tableName: "books",
				type: "createConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("books")',
						'addCheckConstraint("e37c55a5_kinetic_chk", sql`"id" < 50000`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON CONSTRAINT "e37c55a5_kinetic_chk" ON "books" IS \'e37c55a5\'`.execute(db);',
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("books")',
						'dropConstraint("e37c55a5_kinetic_chk")',
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

	test<DbContext>("add multiple first check constraints", async (context) => {
		const firstCheck = check(sql`${sql.ref("id")} > 50`);
		const secondCheck = check(sql`${sql.ref("id")} < 50000`);

		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				checks: [firstCheck, secondCheck],
			},
		});

		const database = pgDatabase({
			tables: {
				books,
			},
		});

		const expected = [
			{
				priority: 4002,
				tableName: "books",
				type: "createConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("books")',
						'addCheckConstraint("918b4271_kinetic_chk", sql`"id" > 50`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON CONSTRAINT "918b4271_kinetic_chk" ON "books" IS \'918b4271\'`.execute(db);',
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("books")',
						'dropConstraint("918b4271_kinetic_chk")',
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
						"await db.schema",
						'alterTable("books")',
						'addCheckConstraint("e37c55a5_kinetic_chk", sql`"id" < 50000`)',
						"execute();",
					],
					[
						'await sql`COMMENT ON CONSTRAINT "e37c55a5_kinetic_chk" ON "books" IS \'e37c55a5\'`.execute(db);',
					],
				],
				down: [
					[
						"await db.schema",
						'alterTable("books")',
						'dropConstraint("e37c55a5_kinetic_chk")',
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

	test<DbContext>("remove check constraints", async (context) => {
		const firstCheck = check(sql`"id" > 5`);

		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("2f1f415e_kinetic_chk", sql`"id" > 5`)
			.execute();

		await sql`COMMENT ON CONSTRAINT "2f1f415e_kinetic_chk" ON "books" IS \'2f1f415e\'`.execute(
			context.kysely,
		);

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("e37c55a5_kinetic_chk", sql`"id" < 50000`)
			.execute();

		await sql`COMMENT ON CONSTRAINT "e37c55a5_kinetic_chk" ON "books" IS \'e37c55a5\'`.execute(
			context.kysely,
		);

		const books = table({
			columns: {
				id: integer(),
			},
			constraints: {
				checks: [firstCheck],
			},
		});

		const database = pgDatabase({
			tables: {
				books,
			},
		});

		const expected = [
			{
				priority: 1003,
				tableName: "books",
				type: "dropConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("books")',
						'dropConstraint("e37c55a5_kinetic_chk")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "books" ADD CONSTRAINT "e37c55a5_kinetic_chk" CHECK ((id < 50000))`.execute(db);',
					],
					[
						'await sql`COMMENT ON CONSTRAINT "e37c55a5_kinetic_chk" ON "books" IS \'e37c55a5\'`.execute(db);',
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

	test<DbContext>("remove all check constraints from table", async (context) => {
		await context.kysely.schema
			.createTable("books")
			.addColumn("id", "integer")
			.execute();

		await context.kysely.schema
			.alterTable("books")
			.addCheckConstraint("918b4271_kinetic_chk", sql`"id" < 50000`)
			.execute();

		await sql`COMMENT ON CONSTRAINT "918b4271_kinetic_chk" ON "books" IS \'918b4271\'`.execute(
			context.kysely,
		);

		const books = table({
			columns: {
				id: integer(),
			},
		});

		const database = pgDatabase({
			tables: {
				books,
			},
		});

		const expected = [
			{
				priority: 1003,
				tableName: "books",
				type: "dropConstraint",
				up: [
					[
						"await db.schema",
						'alterTable("books")',
						'dropConstraint("918b4271_kinetic_chk")',
						"execute();",
					],
				],
				down: [
					[
						'await sql`ALTER TABLE "books" ADD CONSTRAINT "918b4271_kinetic_chk" CHECK ((id < 50000))`.execute(db);',
					],
					[
						'await sql`COMMENT ON CONSTRAINT "918b4271_kinetic_chk" ON "books" IS \'918b4271\'`.execute(db);',
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
