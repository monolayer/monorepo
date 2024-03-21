import { describe, expect, test } from "vitest";
import { serial } from "~/schema/column.js";
import { pgDatabase } from "~/schema/pg-database.js";
import { table } from "~/schema/table.js";
import { columnInfoFactory } from "~tests/helpers/factories/column-info-factory.js";
import { migrationSchemaFactory } from "~tests/helpers/factories/migration-schema.js";
import {
	findColumn,
	findForeignKeysTargetTables,
	findPrimaryKey,
	findTableInDatabaseSchema,
} from "../../src/migrations/migration-schema.js";

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

describe("findForeignKeysTargetTables", () => {
	test("returns the target table of a foreign key", () => {
		const schema = migrationSchemaFactory({
			foreignKeyConstraints: {
				books: {
					books_author_id_authors_id_kinetic_fk:
						'FOREIGN KEY ("author_id") REFERENCES "authors" ("id")',
				},
			},
		});
		expect(findForeignKeysTargetTables(schema, "books")).toStrictEqual([
			"authors",
		]);
	});

	test("returns the target tables of a foreign keys", () => {
		const schema = migrationSchemaFactory({
			foreignKeyConstraints: {
				books: {
					books_author_id_authors_id_kinetic_fk:
						'FOREIGN KEY ("author_id") REFERENCES "authors" ("id")',
					books_building_id_buildings_id_kinetic_fk:
						'FOREIGN KEY ("building_id") REFERENCES "buildings" ("id")',
				},
			},
		});
		expect(findForeignKeysTargetTables(schema, "books")).toStrictEqual([
			"authors",
			"buildings",
		]);
	});
});

describe("findTableInDatabaseSchema", () => {
	test("returns the name table of a table in the database schema", () => {
		const users = table({
			columns: {
				id: serial(),
			},
		});

		const database = pgDatabase({
			tables: {
				users,
			},
		});

		expect(findTableInDatabaseSchema(users, database)).toStrictEqual("users");
	});

	test("returns the undefined if the table is not found", () => {
		const users = table({
			columns: {
				id: serial(),
			},
		});

		const database = pgDatabase({
			tables: {},
		});

		expect(findTableInDatabaseSchema(users, database)).toBeUndefined();
	});

	test("returns the name table of a table in the database schema with multiple tables with same definition", () => {
		const users = table({
			columns: {
				id: serial(),
			},
		});

		const desks = table({
			columns: {
				id: serial(),
			},
		});

		const database = pgDatabase({
			tables: {
				users,
				desks,
			},
		});
		expect(findTableInDatabaseSchema(desks, database)).toStrictEqual("desks");
	});
});
