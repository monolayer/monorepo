/* eslint-disable max-lines */
import { sql } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { remoteExtensions } from "~/introspection/introspection.js";
import { dropTables } from "~tests/__setup__/helpers/drop-tables.js";
import {
	kyselyWithCustomDB,
	type DbContext,
} from "~tests/__setup__/helpers/kysely.js";
import { globalPool } from "~tests/__setup__/setup.js";

describe("#remoteSchema", () => {
	beforeEach<DbContext>(async (context) => {
		const pool = globalPool();
		await pool.query("DROP DATABASE IF EXISTS test_remote_schema");
		await pool.query("CREATE DATABASE test_remote_schema");
		context.kysely = await kyselyWithCustomDB("test_remote_schema");
		context.tableNames = [];
		await dropTables(context);
	});

	afterEach<DbContext>(async (context) => {
		await dropTables(context);
		await context.kysely.destroy();
		const pool = globalPool();
		await pool.query("DROP DATABASE IF EXISTS test_remote_schema");
	});

	test<DbContext>("returns extensions in database", async ({ kysely }) => {
		await sql`CREATE EXTENSION moddatetime`.execute(kysely);
		await sql`CREATE EXTENSION btree_gin`.execute(kysely);

		const expectedSchema = {
			extensions: {
				btree_gin: true,
				moddatetime: true,
			},
		};

		expect(await remoteExtensions(kysely)).toStrictEqual(expectedSchema);
	});
});
