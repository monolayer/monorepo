import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { extension } from "~/database/extension/extension.js";
import { schema } from "~/database/schema/schema.js";
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

	test<DbContext>("add extensions", async (context) => {
		const dbSchema = schema({});
		const expected = [
			{
				priority: 0,
				tableName: "none",
				schemaName: null,
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
				schemaName: null,
				type: "createExtension",
				up: [
					["await sql`CREATE EXTENSION IF NOT EXISTS cube;`", "execute(db);"],
				],
				down: [["await sql`DROP EXTENSION IF EXISTS cube;`", "execute(db);"]],
			},
		];

		await testChangesetAndMigrations({
			context,
			connector: {
				schemas: [dbSchema],
				extensions: [extension("btree_gist"), extension("cube")],
			},
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

		const dbSchema = schema({});

		const expected = [
			{
				priority: 0,
				tableName: "none",
				schemaName: null,
				type: "dropExtension",
				up: [["await sql`DROP EXTENSION IF EXISTS cube;`", "execute(db);"]],
				down: [
					["await sql`CREATE EXTENSION IF NOT EXISTS cube;`", "execute(db);"],
				],
			},
			{
				priority: 0,
				tableName: "none",
				schemaName: null,
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
			connector: { schemas: [dbSchema], extensions: [extension("btree_gin")] },
			expected,
			down: "reverse",
		});
	});
});
