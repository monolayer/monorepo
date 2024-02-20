import { describe, expect, test } from "vitest";
import { changesetDiff } from "~/database/changeset.js";
import { migrationSchemaFactory } from "~tests/helpers/factories/migration_schema.js";
import { primaryKeyMigrationOps } from "./primary_key.js";

describe("primaryKeyMigrationOps", () => {
	test("add primary key", () => {
		const local = migrationSchemaFactory({
			primaryKey: {
				users: {
					users_id_kinetic_pk: "users_id_kinetic_pk PRIMARY KEY (id)",
				},
				books: {
					books_id_kinetic_pk: "books_id_kinetic_pk PRIMARY KEY (id)",
				},
			},
		});
		const remote = migrationSchemaFactory();
		const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
		const result = primaryKeyMigrationOps(
			diff,
			addedTables,
			droppedTables,
			local,
		);

		const expected = [
			{
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					"await sql`ALTER TABLE users ADD CONSTRAINT users_id_kinetic_pk PRIMARY KEY (id)`.execute(db);",
				],
				down: [
					'await sql`ALTER TABLE users DROP CONSTRAINT users_id_kinetic_pk, ALTER COLUMN "id" DROP NOT NULL`.execute(db);',
				],
			},
			{
				priority: 4001,
				tableName: "books",
				type: "createPrimaryKey",
				up: [
					"await sql`ALTER TABLE books ADD CONSTRAINT books_id_kinetic_pk PRIMARY KEY (id)`.execute(db);",
				],
				down: [
					'await sql`ALTER TABLE books DROP CONSTRAINT books_id_kinetic_pk, ALTER COLUMN "id" DROP NOT NULL`.execute(db);',
				],
			},
		];
		expect(result).toStrictEqual(expected);
	});

	test("add primary key on table creation", () => {
		const local = migrationSchemaFactory({
			table: {
				books: {},
			},
			primaryKey: {
				users: {
					users_id_kinetic_pk: "users_id_kinetic_pk PRIMARY KEY (id)",
				},
				books: {
					books_id_kinetic_pk: "books_id_kinetic_pk PRIMARY KEY (id)",
				},
			},
		});
		const remote = migrationSchemaFactory();
		const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
		const result = primaryKeyMigrationOps(
			diff,
			addedTables,
			droppedTables,
			local,
		);

		const expected = [
			{
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					"await sql`ALTER TABLE users ADD CONSTRAINT users_id_kinetic_pk PRIMARY KEY (id)`.execute(db);",
				],
				down: [
					'await sql`ALTER TABLE users DROP CONSTRAINT users_id_kinetic_pk, ALTER COLUMN "id" DROP NOT NULL`.execute(db);',
				],
			},
			{
				priority: 4001,
				tableName: "books",
				type: "createPrimaryKey",
				up: [
					"await sql`ALTER TABLE books ADD CONSTRAINT books_id_kinetic_pk PRIMARY KEY (id)`.execute(db);",
				],
				down: [],
			},
		];
		expect(result).toStrictEqual(expected);
	});

	test("drop primary key", () => {
		const local = migrationSchemaFactory();
		const remote = migrationSchemaFactory({
			primaryKey: {
				users: {
					users_id_kinetic_pk: "users_id_kinetic_pk PRIMARY KEY (id)",
				},
				books: {
					books_id_kinetic_pk: "books_id_kinetic_pk PRIMARY KEY (id)",
				},
			},
		});

		const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
		const result = primaryKeyMigrationOps(
			diff,
			addedTables,
			droppedTables,
			local,
		);

		const expected = [
			{
				priority: 1004,
				tableName: "users",
				type: "dropPrimaryKey",
				up: [
					'await sql`ALTER TABLE users DROP CONSTRAINT users_id_kinetic_pk, ALTER COLUMN "id" DROP NOT NULL`.execute(db);',
				],
				down: [
					"await sql`ALTER TABLE users ADD CONSTRAINT users_id_kinetic_pk PRIMARY KEY (id)`.execute(db);",
				],
			},
			{
				priority: 1004,
				tableName: "books",
				type: "dropPrimaryKey",
				up: [
					'await sql`ALTER TABLE books DROP CONSTRAINT books_id_kinetic_pk, ALTER COLUMN "id" DROP NOT NULL`.execute(db);',
				],
				down: [
					"await sql`ALTER TABLE books ADD CONSTRAINT books_id_kinetic_pk PRIMARY KEY (id)`.execute(db);",
				],
			},
		];
		expect(result).toStrictEqual(expected);
	});

	test("drop primary key when dropping a table", () => {
		const local = migrationSchemaFactory();
		const remote = migrationSchemaFactory({
			table: {
				users: {},
			},
			primaryKey: {
				users: {
					users_id_kinetic_pk: "users_id_kinetic_pk PRIMARY KEY (id)",
				},
				books: {
					books_id_kinetic_pk: "books_id_kinetic_pk PRIMARY KEY (id)",
				},
			},
		});

		const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
		const result = primaryKeyMigrationOps(
			diff,
			addedTables,
			droppedTables,
			local,
		);

		const expected = [
			{
				priority: 1004,
				tableName: "users",
				type: "dropPrimaryKey",
				up: [],
				down: [
					"await sql`ALTER TABLE users ADD CONSTRAINT users_id_kinetic_pk PRIMARY KEY (id)`.execute(db);",
				],
			},
			{
				priority: 1004,
				tableName: "books",
				type: "dropPrimaryKey",
				up: [
					'await sql`ALTER TABLE books DROP CONSTRAINT books_id_kinetic_pk, ALTER COLUMN "id" DROP NOT NULL`.execute(db);',
				],
				down: [
					"await sql`ALTER TABLE books ADD CONSTRAINT books_id_kinetic_pk PRIMARY KEY (id)`.execute(db);",
				],
			},
		];
		expect(result).toStrictEqual(expected);
	});

	test("replace a primary key", () => {
		const local = migrationSchemaFactory({
			primaryKey: {
				users: {
					users_name_kinetic_pk: "users_name_kinetic_pk PRIMARY KEY (name)",
				},
				books: {
					books_name_kinetic_pk: "books_name_kinetic_pk PRIMARY KEY (name)",
				},
			},
		});
		const db = migrationSchemaFactory({
			primaryKey: {
				users: {
					users_id_kinetic_pk: "users_id_kinetic_pk PRIMARY KEY (id)",
				},
				books: {
					books_id_kinetic_pk: "books_id_kinetic_pk PRIMARY KEY (id)",
				},
			},
		});
		const { diff, addedTables, droppedTables } = changesetDiff(local, db);
		const result = primaryKeyMigrationOps(
			diff,
			addedTables,
			droppedTables,
			local,
		);

		const expected = [
			{
				priority: 1004,
				tableName: "users",
				type: "dropPrimaryKey",
				up: [
					'await sql`ALTER TABLE users DROP CONSTRAINT users_id_kinetic_pk, ALTER COLUMN "id" DROP NOT NULL`.execute(db);',
				],
				down: [
					"await sql`ALTER TABLE users ADD CONSTRAINT users_id_kinetic_pk PRIMARY KEY (id)`.execute(db);",
				],
			},
			{
				priority: 4001,
				tableName: "users",
				type: "createPrimaryKey",
				up: [
					"await sql`ALTER TABLE users ADD CONSTRAINT users_name_kinetic_pk PRIMARY KEY (name)`.execute(db);",
				],
				down: [
					'await sql`ALTER TABLE users DROP CONSTRAINT users_name_kinetic_pk, ALTER COLUMN "name" DROP NOT NULL`.execute(db);',
				],
			},
			{
				priority: 1004,
				tableName: "books",
				type: "dropPrimaryKey",
				up: [
					'await sql`ALTER TABLE books DROP CONSTRAINT books_id_kinetic_pk, ALTER COLUMN "id" DROP NOT NULL`.execute(db);',
				],
				down: [
					"await sql`ALTER TABLE books ADD CONSTRAINT books_id_kinetic_pk PRIMARY KEY (id)`.execute(db);",
				],
			},
			{
				priority: 4001,
				tableName: "books",
				type: "createPrimaryKey",
				up: [
					"await sql`ALTER TABLE books ADD CONSTRAINT books_name_kinetic_pk PRIMARY KEY (name)`.execute(db);",
				],
				down: [
					'await sql`ALTER TABLE books DROP CONSTRAINT books_name_kinetic_pk, ALTER COLUMN "name" DROP NOT NULL`.execute(db);',
				],
			},
		];
		expect(result).toStrictEqual(expected);
	});
});
