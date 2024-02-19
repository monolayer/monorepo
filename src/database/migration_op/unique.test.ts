import { describe, expect, test } from "vitest";
import { changesetDiff } from "~/database/changeset.js";
import { migrationSchemaFactory } from "~tests/helpers/factories/migration_schema.js";
import { uniqueMigrationOps } from "./unique.js";

describe("uniqueMigrationOps", () => {
	test("add unique constraint", () => {
		const local = migrationSchemaFactory({
			uniqueConstraints: {
				users: {
					users_name_kinetic_key:
						"users_name_kinetic_key UNIQUE NULLS DISTINCT (name)",
				},
				books: {
					books_name_location_kinetic_key:
						"books_name_location_kinetic_key UNIQUE NULLS DISTINCT (name, location)",
				},
			},
		});
		const remote = migrationSchemaFactory();
		const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
		const result = uniqueMigrationOps(diff, addedTables, droppedTables);

		const expected = [
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					"await sql`ALTER TABLE users ADD CONSTRAINT users_name_kinetic_key UNIQUE NULLS DISTINCT (name)`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE users DROP CONSTRAINT users_name_kinetic_key`.execute(db);",
				],
			},
			{
				priority: 4002,
				tableName: "books",
				type: "createConstraint",
				up: [
					"await sql`ALTER TABLE books ADD CONSTRAINT books_name_location_kinetic_key UNIQUE NULLS DISTINCT (name, location)`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE books DROP CONSTRAINT books_name_location_kinetic_key`.execute(db);",
				],
			},
		];
		expect(result).toStrictEqual(expected);
	});

	test("add unique constraint on table creation", () => {
		const local = migrationSchemaFactory({
			table: {
				users: {},
			},
			uniqueConstraints: {
				users: {
					users_name_kinetic_key:
						"users_name_kinetic_key UNIQUE NULLS DISTINCT (name)",
				},
				books: {
					books_name_location_kinetic_key:
						"books_name_location_kinetic_key UNIQUE NULLS DISTINCT (name, location)",
				},
			},
		});
		const remote = migrationSchemaFactory();
		const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
		const result = uniqueMigrationOps(diff, addedTables, droppedTables);

		const expected = [
			{
				priority: 4002,
				tableName: "users",
				type: "createConstraint",
				up: [
					"await sql`ALTER TABLE users ADD CONSTRAINT users_name_kinetic_key UNIQUE NULLS DISTINCT (name)`.execute(db);",
				],
				down: [],
			},
			{
				priority: 4002,
				tableName: "books",
				type: "createConstraint",
				up: [
					"await sql`ALTER TABLE books ADD CONSTRAINT books_name_location_kinetic_key UNIQUE NULLS DISTINCT (name, location)`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE books DROP CONSTRAINT books_name_location_kinetic_key`.execute(db);",
				],
			},
		];
		expect(result).toStrictEqual(expected);
	});

	test("drop unique constraint", () => {
		const local = migrationSchemaFactory();
		const remote = migrationSchemaFactory({
			uniqueConstraints: {
				users: {
					users_name_kinetic_key:
						"users_name_kinetic_key UNIQUE NULLS DISTINCT (name)",
				},
				books: {
					books_name_location_kinetic_key:
						"books_name_location_kinetic_key UNIQUE NULLS DISTINCT (name, location)",
				},
			},
		});
		const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
		const result = uniqueMigrationOps(diff, addedTables, droppedTables);
		const expected = [
			{
				priority: 1003,
				tableName: "users",
				type: "dropConstraint",
				up: [
					"await sql`ALTER TABLE users DROP CONSTRAINT users_name_kinetic_key`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE users ADD CONSTRAINT users_name_kinetic_key UNIQUE NULLS DISTINCT (name)`.execute(db);",
				],
			},
			{
				priority: 1003,
				tableName: "books",
				type: "dropConstraint",
				up: [
					"await sql`ALTER TABLE books DROP CONSTRAINT books_name_location_kinetic_key`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE books ADD CONSTRAINT books_name_location_kinetic_key UNIQUE NULLS DISTINCT (name, location)`.execute(db);",
				],
			},
		];
		expect(result).toStrictEqual(expected);
	});

	test("drop unique constraint when dropping a table", () => {
		const local = migrationSchemaFactory();
		const remote = migrationSchemaFactory({
			table: {
				users: {},
			},
			uniqueConstraints: {
				users: {
					users_name_kinetic_key:
						"users_name_kinetic_key UNIQUE NULLS DISTINCT (name)",
				},
				books: {
					books_name_location_kinetic_key:
						"books_name_location_kinetic_key UNIQUE NULLS DISTINCT (name, location)",
				},
			},
		});
		const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
		const result = uniqueMigrationOps(diff, addedTables, droppedTables);
		const expected = [
			{
				priority: 1003,
				tableName: "users",
				type: "dropConstraint",
				up: [],
				down: [
					"await sql`ALTER TABLE users ADD CONSTRAINT users_name_kinetic_key UNIQUE NULLS DISTINCT (name)`.execute(db);",
				],
			},
			{
				priority: 1003,
				tableName: "books",
				type: "dropConstraint",
				up: [
					"await sql`ALTER TABLE books DROP CONSTRAINT books_name_location_kinetic_key`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE books ADD CONSTRAINT books_name_location_kinetic_key UNIQUE NULLS DISTINCT (name, location)`.execute(db);",
				],
			},
		];
		expect(result).toStrictEqual(expected);
	});

	test("replace unique constraint", () => {
		const local = migrationSchemaFactory({
			uniqueConstraints: {
				users: {
					users_name_kinetic_key:
						"users_name_kinetic_key UNIQUE NULLS NOT DISTINCT (name)",
				},
			},
		});
		const remote = migrationSchemaFactory({
			uniqueConstraints: {
				users: {
					users_name_kinetic_key:
						"users_name_kinetic_key UNIQUE NULLS DISTINCT (name)",
				},
			},
		});
		const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
		const result = uniqueMigrationOps(diff, addedTables, droppedTables);

		const expected = [
			{
				priority: 5002,
				tableName: "users",
				type: "changeConstraint",
				up: [
					"await sql`ALTER TABLE users DROP CONSTRAINT users_name_kinetic_key, ADD CONSTRAINT users_name_kinetic_key UNIQUE NULLS NOT DISTINCT (name)`.execute(db);",
				],
				down: [
					"await sql`ALTER TABLE users DROP CONSTRAINT users_name_kinetic_key, ADD CONSTRAINT users_name_kinetic_key UNIQUE NULLS DISTINCT (name)`.execute(db);",
				],
			},
		];
		expect(result).toStrictEqual(expected);
	});
});
