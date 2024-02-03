import { describe, expect, test } from "vitest";
import { ColumnIdentity } from "~/database/schema/pg_column.js";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { DropColumnDiff, dropColumnMigration } from "./drop.js";

describe("dropTableMigration", () => {
	test("has a priority of 1", () => {
		const column: DropColumnDiff = {
			type: "REMOVE",
			path: ["table", "books", "id"],
			oldValue: columnInfoFactory({
				tableName: "books",
				columnName: "id",
				dataType: "serial",
				isNullable: true,
			}),
		};

		const result = dropColumnMigration(column);
		expect(result.priority).toBe(2);
	});

	test("columns", () => {
		const column: DropColumnDiff = {
			type: "REMOVE",
			path: ["table", "books", "id"],
			oldValue: columnInfoFactory({
				tableName: "books",
				columnName: "id",
				dataType: "serial",
				isNullable: true,
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "dropColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("id")',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("id", "serial")',
				"execute();",
			],
		};

		expect(dropColumnMigration(column)).toStrictEqual(expected);
	});

	test("primary key column", () => {
		const column: DropColumnDiff = {
			type: "REMOVE",
			path: ["table", "books", "id"],
			oldValue: columnInfoFactory({
				tableName: "books",
				columnName: "id",
				dataType: "serial",
				isNullable: false,
				primaryKey: true,
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "dropColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("id")',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("id", "serial", (col) => col.notNull().primaryKey())',
				"execute();",
			],
		};

		expect(dropColumnMigration(column)).toStrictEqual(expected);
	});

	test("not nullable columns", () => {
		const column: DropColumnDiff = {
			type: "REMOVE",
			path: ["table", "books", "id"],
			oldValue: columnInfoFactory({
				tableName: "books",
				columnName: "id",
				dataType: "serial",
				isNullable: false,
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "dropColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("id")',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("id", "serial", (col) => col.notNull())',
				"execute();",
			],
		};

		expect(dropColumnMigration(column)).toStrictEqual(expected);
	});

	test("columns with default value", () => {
		const column: DropColumnDiff = {
			type: "REMOVE",
			path: ["table", "books", "id"],
			oldValue: columnInfoFactory({
				tableName: "books",
				columnName: "id",
				dataType: "text",
				defaultValue: "foo",
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "dropColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("id")',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("id", "text", (col) => col.defaultTo("foo"))',
				"execute();",
			],
		};

		expect(dropColumnMigration(column)).toStrictEqual(expected);
	});

	test("columns with a foreign key contraint", () => {
		const column: DropColumnDiff = {
			type: "REMOVE",
			path: ["table", "books", "author_id"],
			oldValue: columnInfoFactory({
				tableName: "books",
				columnName: "author_id",
				dataType: "text",
				foreignKeyConstraint: {
					table: "authors",
					column: "id",
				},
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "dropColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("author_id")',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("author_id", "text")',
				'.addForeignKeyConstraint("books_author_id_fkey", ["author_id"], "authors", ["id"])',
				"execute();",
			],
		};

		expect(dropColumnMigration(column)).toStrictEqual(expected);
	});

	test("columns with a identity always", () => {
		const column: DropColumnDiff = {
			type: "REMOVE",
			path: ["table", "books", "demo"],
			oldValue: columnInfoFactory({
				tableName: "books",
				columnName: "demo",
				dataType: "text",
				identity: ColumnIdentity.Always,
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "dropColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("demo")',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("demo", "text", (col) => col.generatedAlwaysAsIdentity())',
				"execute();",
			],
		};
		expect(dropColumnMigration(column)).toStrictEqual(expected);
	});

	test("columns with a identity by default", () => {
		const column: DropColumnDiff = {
			type: "REMOVE",
			path: ["table", "books", "demo"],
			oldValue: columnInfoFactory({
				tableName: "books",
				columnName: "demo",
				dataType: "text",
				identity: ColumnIdentity.ByDefault,
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "dropColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("demo")',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("demo", "text", (col) => col.generatedByDefaultAsIdentity())',
				"execute();",
			],
		};

		expect(dropColumnMigration(column)).toStrictEqual(expected);
	});
});
