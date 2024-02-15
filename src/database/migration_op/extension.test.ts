import microdiff from "microdiff";
import { describe, expect, test } from "vitest";
import { migrationSchemaFactory } from "~tests/helpers/factories/migration_schema.js";
import { extensionMigrationOpGenerator } from "./extensions.js";

describe("extension migration Ops", () => {
	test("add extension", () => {
		const local = migrationSchemaFactory({
			extensions: {
				btree_gist: true,
				cube: true,
			},
		});
		const remote = migrationSchemaFactory();
		const diff = microdiff(remote, local);

		const result = diff.map((d) =>
			extensionMigrationOpGenerator(
				d,
				[],
				[],
				migrationSchemaFactory(),
				migrationSchemaFactory(),
			),
		);

		const expected = [
			{
				priority: 0,
				tableName: "none",
				type: "createExtension",
				up: [
					"await sql`CREATE EXTENSION IF NOT EXISTS btree_gist;`.execute(db);",
				],
				down: ["await sql`DROP EXTENSION IF EXISTS btree_gist;`.execute(db);"],
			},
			{
				priority: 0,
				tableName: "none",
				type: "createExtension",
				up: ["await sql`CREATE EXTENSION IF NOT EXISTS cube;`.execute(db);"],
				down: ["await sql`DROP EXTENSION IF EXISTS cube;`.execute(db);"],
			},
		];
		expect(result).toStrictEqual(expected);
	});

	test("drop extension", () => {
		const local = migrationSchemaFactory();
		const remote = migrationSchemaFactory({
			extensions: {
				btree_gist: true,
				cube: true,
			},
		});
		const diff = microdiff(remote, local);

		const result = diff.map((d) =>
			extensionMigrationOpGenerator(
				d,
				[],
				[],
				migrationSchemaFactory(),
				migrationSchemaFactory(),
			),
		);

		const expected = [
			{
				priority: 0,
				tableName: "none",
				type: "dropExtension",
				down: [
					"await sql`CREATE EXTENSION IF NOT EXISTS btree_gist;`.execute(db);",
				],
				up: ["await sql`DROP EXTENSION IF EXISTS btree_gist;`.execute(db);"],
			},
			{
				priority: 0,
				tableName: "none",
				type: "dropExtension",
				down: ["await sql`CREATE EXTENSION IF NOT EXISTS cube;`.execute(db);"],
				up: ["await sql`DROP EXTENSION IF EXISTS cube;`.execute(db);"],
			},
		];
		expect(result).toStrictEqual(expected);
	});
});
