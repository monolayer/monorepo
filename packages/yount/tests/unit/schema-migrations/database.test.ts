import { sql } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { extension } from "~/schema/extension/extension.js";
import { schema } from "~/schema/schema.js";
import { testChangesetAndMigrations } from "~tests/helpers/migration-success.js";
import { type DbContext } from "~tests/setup/kysely.js";
import { computeChangeset } from "../../helpers/compute-changeset.js";
import { setUpContext, teardownContext } from "../../helpers/test-context.js";

describe("Database migrations", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("database without tables", async ({ kysely }) => {
		const dbSchema = schema({});
		const cs = await computeChangeset(kysely, dbSchema);
		expect(cs).toEqual([]);
	});

	test<DbContext>("add extensions", async (context) => {
		const dbSchema = schema({
			extensions: [extension("btree_gist"), extension("cube")],
		});
		const expected = [
			{
				priority: 0,
				tableName: "none",
				type: "createExtension",
				up: [
					[
						"await sql`CREATE EXTENSION IF NOT EXISTS btree_gist;`",
						"execute(db);",
					],
				],
				down: [
					["await sql`DROP EXTENSION IF EXISTS btree_gist;`", "execute(db);"],
				],
			},
			{
				priority: 0,
				tableName: "none",
				type: "createExtension",
				up: [
					["await sql`CREATE EXTENSION IF NOT EXISTS cube;`", "execute(db);"],
				],
				down: [["await sql`DROP EXTENSION IF EXISTS cube;`", "execute(db);"]],
			},
		];

		await testChangesetAndMigrations({
			context,
			database: dbSchema,
			expected,
			down: "same",
		});
	});

	test<DbContext>("drop extensions", async (context) => {
		await sql`CREATE EXTENSION IF NOT EXISTS cube;`.execute(context.kysely);
		await sql`CREATE EXTENSION IF NOT EXISTS btree_gist;`.execute(
			context.kysely,
		);
		await sql`CREATE EXTENSION IF NOT EXISTS btree_gin;`.execute(
			context.kysely,
		);

		const dbSchema = schema({
			extensions: [extension("btree_gin")],
		});

		const expected = [
			{
				priority: 0,
				tableName: "none",
				type: "dropExtension",
				up: [["await sql`DROP EXTENSION IF EXISTS cube;`", "execute(db);"]],
				down: [
					["await sql`CREATE EXTENSION IF NOT EXISTS cube;`", "execute(db);"],
				],
			},
			{
				priority: 0,
				tableName: "none",
				type: "dropExtension",
				up: [
					["await sql`DROP EXTENSION IF EXISTS btree_gist;`", "execute(db);"],
				],
				down: [
					[
						"await sql`CREATE EXTENSION IF NOT EXISTS btree_gist;`",
						"execute(db);",
					],
				],
			},
		];

		await testChangesetAndMigrations({
			context,
			database: dbSchema,
			expected,
			down: "reverse",
		});
	});
});
