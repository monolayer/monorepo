import type { Difference } from "microdiff";
import { describe, expect, test } from "vitest";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { migrationSchemaFactory } from "~tests/helpers/factories/migration_schema.js";
import { ColumnIdentity, ColumnUnique } from "../schema/pg_column.js";
import { columnMigrationOpGenerator } from "./column.js";

describe("Column Create Migration ops", () => {
	test("has a priority of 1", () => {
		const column: Difference = {
			type: "CREATE",
			path: ["table", "books", "id"],
			value: columnInfoFactory({
				tableName: "books",
				columnName: "id",
				dataType: "serial",
				isNullable: true,
			}),
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);
		expect(result?.priority).toBe(2);
	});

	test("columns", () => {
		const column: Difference = {
			type: "CREATE",
			path: ["table", "books", "id"],
			value: columnInfoFactory({
				tableName: "books",
				columnName: "id",
				dataType: "serial",
				isNullable: true,
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "createColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("id", "serial")',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("id")',
				"execute();",
			],
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("primary key column", () => {
		const column: Difference = {
			type: "CREATE",
			path: ["table", "books", "id"],
			value: columnInfoFactory({
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
			type: "createColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("id", "serial", (col) => col.notNull().primaryKey())',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("id")',
				"execute();",
			],
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("not nullable columns", () => {
		const column: Difference = {
			type: "CREATE",
			path: ["table", "books", "id"],
			value: columnInfoFactory({
				tableName: "books",
				columnName: "id",
				dataType: "serial",
				isNullable: false,
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "createColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("id", "serial", (col) => col.notNull())',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("id")',
				"execute();",
			],
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("columns with default value", () => {
		const column: Difference = {
			type: "CREATE",
			path: ["table", "books", "id"],
			value: columnInfoFactory({
				tableName: "books",
				columnName: "id",
				dataType: "text",
				defaultValue: "'foo':text",
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "createColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("id", "text", (col) => col.defaultTo(sql`\'foo\':text`))',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("id")',
				"execute();",
			],
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("columns with a foreign key contraint", () => {
		const column: Difference = {
			type: "CREATE",
			path: ["table", "books", "author_id"],
			value: columnInfoFactory({
				tableName: "books",
				columnName: "author_id",
				dataType: "text",
				foreignKeyConstraint: {
					table: "authors",
					column: "id",
					options: "no action;cascade",
				},
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "createColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("author_id", "text")',
				'.addForeignKeyConstraint("books_author_id_fkey", ["author_id"], "authors", ["id"], (cb) => cb.onDelete("no action").onUpdate("cascade"))',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("author_id")',
				"execute();",
			],
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("columns with a identity always", () => {
		const column: Difference = {
			type: "CREATE",
			path: ["table", "books", "demo"],
			value: columnInfoFactory({
				tableName: "books",
				columnName: "demo",
				dataType: "text",
				identity: ColumnIdentity.Always,
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "createColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("demo", "text", (col) => col.generatedAlwaysAsIdentity())',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("demo")',
				"execute();",
			],
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("columns with a identity by default", () => {
		const column: Difference = {
			type: "CREATE",
			path: ["table", "books", "demo"],
			value: columnInfoFactory({
				tableName: "books",
				columnName: "demo",
				dataType: "text",
				identity: ColumnIdentity.ByDefault,
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "createColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("demo", "text", (col) => col.generatedByDefaultAsIdentity())',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("demo")',
				"execute();",
			],
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);
		expect(result).toStrictEqual(expected);
	});

	test("columns with unique nulls distinct", () => {
		const column: Difference = {
			type: "CREATE",
			path: ["table", "books", "demo"],
			value: columnInfoFactory({
				tableName: "books",
				columnName: "demo",
				dataType: "text",
				unique: ColumnUnique.NullsDistinct,
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "createColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("demo", "text", (col) => col.unique())',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("demo")',
				"execute();",
			],
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("columns with unique nulls not distinct", () => {
		const column: Difference = {
			type: "CREATE",
			path: ["table", "books", "demo"],
			value: columnInfoFactory({
				tableName: "books",
				columnName: "demo",
				dataType: "text",
				unique: ColumnUnique.NullsNotDistinct,
			}),
		};

		const expected = {
			priority: 2,
			tableName: "books",
			type: "createColumn",
			up: [
				"await db.schema",
				'alterTable("books")',
				'addColumn("demo", "text", (col) => col.unique().nullsNotDistinct())',
				"execute();",
			],
			down: [
				"await db.schema",
				'alterTable("books")',
				'dropColumn("demo")',
				"execute();",
			],
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});
});

describe("Column Drop Migration Ops", () => {
	test("has a priority of 1", () => {
		const column: Difference = {
			type: "REMOVE",
			path: ["table", "books", "id"],
			oldValue: columnInfoFactory({
				tableName: "books",
				columnName: "id",
				dataType: "serial",
				isNullable: true,
			}),
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result?.priority).toBe(2);
	});

	test("columns", () => {
		const column: Difference = {
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

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("primary key column", () => {
		const column: Difference = {
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

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("not nullable columns", () => {
		const column: Difference = {
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

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("columns with default value", () => {
		const column: Difference = {
			type: "REMOVE",
			path: ["table", "books", "id"],
			oldValue: columnInfoFactory({
				tableName: "books",
				columnName: "id",
				dataType: "text",
				defaultValue: "'foo':text",
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
				'addColumn("id", "text", (col) => col.defaultTo(sql`\'foo\':text`))',
				"execute();",
			],
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("columns with a foreign key contraint", () => {
		const column: Difference = {
			type: "REMOVE",
			path: ["table", "books", "author_id"],
			oldValue: columnInfoFactory({
				tableName: "books",
				columnName: "author_id",
				dataType: "text",
				foreignKeyConstraint: {
					table: "authors",
					column: "id",
					options: "no action;no action",
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
				'.addForeignKeyConstraint("books_author_id_fkey", ["author_id"], "authors", ["id"], (cb) => cb.onDelete("no action").onUpdate("no action"))',
				"execute();",
			],
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("columns with a identity always", () => {
		const column: Difference = {
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

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);
		expect(result).toStrictEqual(expected);
	});

	test("columns with a identity by default", () => {
		const column: Difference = {
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

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("columns with unique nulls distinct", () => {
		const column: Difference = {
			type: "REMOVE",
			path: ["table", "books", "demo"],
			oldValue: columnInfoFactory({
				tableName: "books",
				columnName: "demo",
				dataType: "text",
				unique: ColumnUnique.NullsDistinct,
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
				'addColumn("demo", "text", (col) => col.unique())',
				"execute();",
			],
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});

	test("columns with unique nulls not distinct", () => {
		const column: Difference = {
			type: "REMOVE",
			path: ["table", "books", "demo"],
			oldValue: columnInfoFactory({
				tableName: "books",
				columnName: "demo",
				dataType: "text",
				unique: ColumnUnique.NullsNotDistinct,
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
				'addColumn("demo", "text", (col) => col.unique().nullsNotDistinct())',
				"execute();",
			],
		};

		const result = columnMigrationOpGenerator(
			column,
			[],
			[],
			migrationSchemaFactory(),
			migrationSchemaFactory(),
		);

		expect(result).toStrictEqual(expected);
	});
});
