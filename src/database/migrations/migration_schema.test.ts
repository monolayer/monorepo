import { describe, expect, test } from "vitest";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { migrationSchemaFactory } from "~tests/helpers/factories/migration_schema.js";
import { findColumn, findPrimaryKey } from "./migration_schema.js";

describe("findColumn", () => {
	test("returns the column definition of a table", () => {
		const schema = migrationSchemaFactory({
			table: {
				books: {
					id: columnInfoFactory({
						tableName: "books",
						columnName: "id",
						dataType: "serial",
					}),
				},
			},
		});
		expect(findColumn(schema, "books", "id")).toStrictEqual(
			columnInfoFactory({
				tableName: "books",
				columnName: "id",
				dataType: "serial",
			}),
		);
	});

	test("returns undefined when the column definition of a table is not found", () => {
		const schema = migrationSchemaFactory({
			table: {
				books: {
					id: columnInfoFactory({
						tableName: "books",
						columnName: "id",
						dataType: "serial",
					}),
				},
			},
		});
		expect(findColumn(schema, "books", "name")).toBeUndefined();
	});
});

describe("findPrimaryKey", () => {
	test("returns the primary key column of a table", () => {
		const schema = migrationSchemaFactory({
			primaryKey: {
				books: {
					books_kinetic_pk: 'books_id_kinetic_pk PRIMARY KEY ("id")',
				},
				teams: {
					teams_kinetic_pk: "teams_id_kinetic_pk PRIMARY KEY (id)",
				},
			},
		});
		expect(findPrimaryKey(schema, "books")).toStrictEqual(["id"]);
		expect(findPrimaryKey(schema, "teams")).toStrictEqual(["id"]);
	});

	test("returns the primary key columns of a table", () => {
		const schema = migrationSchemaFactory({
			primaryKey: {
				books: {
					books_kinetic_pk: 'books_id_kinetic_pk PRIMARY KEY ("id", "name")',
				},
				teams: {
					teams_kinetic_pk: "teams_id_kinetic_pk PRIMARY KEY (id, name)",
				},
			},
		});
		expect(findPrimaryKey(schema, "books")).toStrictEqual(["id", "name"]);
		expect(findPrimaryKey(schema, "teams")).toStrictEqual(["id", "name"]);
	});

	test("returns an empty array when the primary key of a table is not found", () => {
		const schema = migrationSchemaFactory({
			primaryKey: {
				books: {},
			},
		});
		expect(findPrimaryKey(schema, "books")).toStrictEqual([]);
	});

	test("returns an empty array the table is not found", () => {
		const schema = migrationSchemaFactory({
			primaryKey: {
				books: {},
			},
		});
		expect(findPrimaryKey(schema, "teams")).toStrictEqual([]);
	});

	test("returns an empty array on malformed schema", () => {
		const schema = migrationSchemaFactory({
			primaryKey: {
				books: {
					books_kinetic_pk: "this is not a definition",
				},
			},
		});
		expect(findPrimaryKey(schema, "books")).toStrictEqual([]);
	});
});
