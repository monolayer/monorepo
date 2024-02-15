import type { Difference } from "microdiff";
import { describe, expect, test } from "vitest";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { migrationSchemaFactory } from "~tests/helpers/factories/migration_schema.js";
import { tableMigrationOpGenerator } from "./table.js";

describe("createTableMigration", () => {
	test("has a priority of 1", () => {
		const table: Difference = {
			type: "CREATE",
			path: ["table", "books"],
			value: {},
		};

		const result = tableMigrationOpGenerator(
			table,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result?.priority).toBe(1);
	});

	test("columns", () => {
		const table: Difference = {
			type: "CREATE",
			path: ["table", "books"],
			value: {
				id: columnInfoFactory({
					tableName: "books",
					columnName: "id",
					dataType: "serial",
					isNullable: true,
				}),
				name: columnInfoFactory({
					tableName: "books",
					columnName: "name",
					dataType: "text",
					isNullable: true,
				}),
			},
		};

		const expected = {
			priority: 1,
			tableName: "books",
			type: "createTable",
			up: [
				"await db.schema",
				'createTable("books")',
				'addColumn("id", "serial")',
				'addColumn("name", "text")',
				"execute();",
			],
			down: ["await db.schema", 'dropTable("books")', "execute();"],
		};

		const result = tableMigrationOpGenerator(
			table,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("primary key columns", () => {
		const table: Difference = {
			type: "CREATE",
			path: ["table", "books"],
			value: {
				id: columnInfoFactory({
					tableName: "books",
					columnName: "id",
					dataType: "serial",
					isNullable: false,
					primaryKey: true,
				}),
			},
		};

		const expected = {
			priority: 1,
			tableName: "books",
			type: "createTable",
			up: [
				"await db.schema",
				'createTable("books")',
				'addColumn("id", "serial", (col) => col.notNull().primaryKey())',
				"execute();",
			],
			down: ["await db.schema", 'dropTable("books")', "execute();"],
		};

		const result = tableMigrationOpGenerator(
			table,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("not nullable columns", () => {
		const table: Difference = {
			type: "CREATE",
			path: ["table", "books"],
			value: {
				id: columnInfoFactory({
					tableName: "books",
					columnName: "id",
					dataType: "serial",
					isNullable: false,
				}),
			},
		};

		const expected = {
			priority: 1,
			tableName: "books",
			type: "createTable",
			up: [
				"await db.schema",
				'createTable("books")',
				'addColumn("id", "serial", (col) => col.notNull())',
				"execute();",
			],
			down: ["await db.schema", 'dropTable("books")', "execute();"],
		};

		const result = tableMigrationOpGenerator(
			table,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("columns with default value", () => {
		const table: Difference = {
			type: "CREATE",
			path: ["table", "books"],
			value: {
				id: columnInfoFactory({
					tableName: "books",
					columnName: "id",
					dataType: "text",
					defaultValue: "'foo':text",
				}),
			},
		};

		const expected = {
			priority: 1,
			tableName: "books",
			type: "createTable",
			up: [
				"await db.schema",
				'createTable("books")',
				'addColumn("id", "text", (col) => col.defaultTo(sql`\'foo\':text`))',
				"execute();",
			],
			down: ["await db.schema", 'dropTable("books")', "execute();"],
		};

		const result = tableMigrationOpGenerator(
			table,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("columns with a foreign key contraint", () => {
		const table: Difference = {
			type: "CREATE",
			path: ["table", "books"],
			value: {
				id: columnInfoFactory({
					tableName: "books",
					columnName: "author_id",
					dataType: "text",
					foreignKeyConstraint: {
						table: "authors",
						column: "id",
						options: "no action;no action",
					},
				}),
			},
		};

		const expected = {
			priority: 1,
			tableName: "books",
			type: "createTable",
			up: [
				"await db.schema",
				'createTable("books")',
				'addColumn("author_id", "text")',
				'.addForeignKeyConstraint("books_author_id_fkey", ["author_id"], "authors", ["id"], (cb) => cb.onDelete("no action").onUpdate("no action"))',
				"execute();",
			],
			down: ["await db.schema", 'dropTable("books")', "execute();"],
		};

		const result = tableMigrationOpGenerator(
			table,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});
});

describe("dropTableMigration", () => {
	test("has a priority of 1", () => {
		const table: Difference = {
			type: "REMOVE",
			path: ["table", "books"],
			oldValue: {},
		};

		const result = tableMigrationOpGenerator(
			table,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result?.priority).toBe(1);
	});

	test("columns", () => {
		const table: Difference = {
			type: "REMOVE",
			path: ["table", "books"],
			oldValue: {
				id: columnInfoFactory({
					tableName: "books",
					columnName: "id",
					dataType: "serial",
					isNullable: true,
				}),
				name: columnInfoFactory({
					tableName: "books",
					columnName: "name",
					dataType: "text",
					isNullable: true,
				}),
			},
		};

		const expected = {
			priority: 1,
			tableName: "books",
			type: "dropTable",
			up: ["await db.schema", 'dropTable("books")', "execute();"],
			down: [
				"await db.schema",
				'createTable("books")',
				'addColumn("id", "serial")',
				'addColumn("name", "text")',
				"execute();",
			],
		};

		const result = tableMigrationOpGenerator(
			table,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("primary key columns", () => {
		const table: Difference = {
			type: "REMOVE",
			path: ["table", "books"],
			oldValue: {
				id: columnInfoFactory({
					tableName: "books",
					columnName: "id",
					dataType: "serial",
					isNullable: false,
					primaryKey: true,
				}),
			},
		};

		const expected = {
			priority: 1,
			tableName: "books",
			type: "dropTable",
			up: ["await db.schema", 'dropTable("books")', "execute();"],
			down: [
				"await db.schema",
				'createTable("books")',
				'addColumn("id", "serial", (col) => col.notNull().primaryKey())',
				"execute();",
			],
		};

		const result = tableMigrationOpGenerator(
			table,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("not nullable columns", () => {
		const table: Difference = {
			type: "REMOVE",
			path: ["table", "books"],
			oldValue: {
				id: columnInfoFactory({
					tableName: "books",
					columnName: "id",
					dataType: "serial",
					isNullable: false,
				}),
			},
		};

		const expected = {
			priority: 1,
			tableName: "books",
			type: "dropTable",
			up: ["await db.schema", 'dropTable("books")', "execute();"],
			down: [
				"await db.schema",
				'createTable("books")',
				'addColumn("id", "serial", (col) => col.notNull())',
				"execute();",
			],
		};

		const result = tableMigrationOpGenerator(
			table,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("columns with default value", () => {
		const table: Difference = {
			type: "REMOVE",
			path: ["table", "books"],
			oldValue: {
				id: columnInfoFactory({
					tableName: "books",
					columnName: "id",
					dataType: "text",
					defaultValue: "'foo':text",
				}),
			},
		};

		const expected = {
			priority: 1,
			tableName: "books",
			type: "dropTable",
			up: ["await db.schema", 'dropTable("books")', "execute();"],
			down: [
				"await db.schema",
				'createTable("books")',
				'addColumn("id", "text", (col) => col.defaultTo(sql`\'foo\':text`))',
				"execute();",
			],
		};

		const result = tableMigrationOpGenerator(
			table,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("columns with a foreign key contraint", () => {
		const table: Difference = {
			type: "REMOVE",
			path: ["table", "books"],
			oldValue: {
				id: columnInfoFactory({
					tableName: "books",
					columnName: "author_id",
					dataType: "text",
					foreignKeyConstraint: {
						table: "authors",
						column: "id",
						options: "no action;no action",
					},
				}),
			},
		};

		const expected = {
			priority: 1,
			tableName: "books",
			type: "dropTable",
			up: ["await db.schema", 'dropTable("books")', "execute();"],
			down: [
				"await db.schema",
				'createTable("books")',
				'addColumn("author_id", "text")',
				'.addForeignKeyConstraint("books_author_id_fkey", ["author_id"], "authors", ["id"], (cb) => cb.onDelete("no action").onUpdate("no action"))',
				"execute();",
			],
		};

		const result = tableMigrationOpGenerator(
			table,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});
});
