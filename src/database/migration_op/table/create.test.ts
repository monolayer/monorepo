import { describe, expect, test } from "vitest";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { CreateTableDiff, createTableMigration } from "./create.js";

describe("createTableMigration", () => {
	test("has a priority of 1", () => {
		const table: CreateTableDiff = {
			type: "CREATE",
			path: ["table", "books"],
			value: {},
		};

		const result = createTableMigration(table);

		expect(result.priority).toBe(1);
	});

	test("columns", () => {
		const table: CreateTableDiff = {
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

		expect(createTableMigration(table)).toStrictEqual(expected);
	});

	test("primary key columns", () => {
		const table: CreateTableDiff = {
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

		expect(createTableMigration(table)).toStrictEqual(expected);
	});

	test("not nullable columns", () => {
		const table: CreateTableDiff = {
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

		expect(createTableMigration(table)).toStrictEqual(expected);
	});

	test("columns with default value", () => {
		const table: CreateTableDiff = {
			type: "CREATE",
			path: ["table", "books"],
			value: {
				id: columnInfoFactory({
					tableName: "books",
					columnName: "id",
					dataType: "text",
					defaultValue: "foo",
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
				'addColumn("id", "text", (col) => col.defaultTo("foo"))',
				"execute();",
			],
			down: ["await db.schema", 'dropTable("books")', "execute();"],
		};

		expect(createTableMigration(table)).toStrictEqual(expected);
	});

	test("columns with a foreign key contraint", () => {
		const table: CreateTableDiff = {
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
				'.addForeignKeyConstraint("books_author_id_fkey", ["author_id"], "authors", ["id"])',
				"execute();",
			],
			down: ["await db.schema", 'dropTable("books")', "execute();"],
		};

		expect(createTableMigration(table)).toStrictEqual(expected);
	});
});
