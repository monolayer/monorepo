import { describe, expect, test } from "vitest";
import { schema } from "~/database/schema/schema.js";
import { serial } from "~/database/schema/table/column/data-types/serial.js";
import { table } from "~/database/schema/table/table.js";
import { columnInfoFactory } from "~tests/__setup__/helpers/factories/column-info-factory.js";
import { schemaMigratonInfoFactory } from "~tests/__setup__/helpers/factories/migration-schema.js";
import {
	findColumn,
	findForeignKeysTargetTables,
	findPrimaryKey,
	findTableInDatabaseSchema,
} from "../src/migrations/migration-schema.js";

describe("findColumn", () => {
	test("returns the column definition of a table", () => {
		const schema = schemaMigratonInfoFactory({
			table: {
				books: {
					name: "books",
					columns: {
						id: columnInfoFactory({
							columnName: "id",
							dataType: "serial",
						}),
					},
				},
			},
		});
		expect(findColumn("id", schema.table["books"])).toStrictEqual(
			columnInfoFactory({
				columnName: "id",
				dataType: "serial",
			}),
		);
	});

	test("returns undefined when the column definition of a table is not found", () => {
		const schema = schemaMigratonInfoFactory({
			table: {
				books: {
					name: "books",
					columns: {
						id: columnInfoFactory({
							columnName: "id",
							dataType: "serial",
						}),
					},
				},
			},
		});
		expect(findColumn("name", schema.table["books"])).toBeUndefined();
	});
});

describe("findPrimaryKey", () => {
	test("returns the primary key column of a table", () => {
		const schema = schemaMigratonInfoFactory({
			primaryKey: {
				books: {
					books_yount_pk: 'books_id_yount_pk PRIMARY KEY ("id")',
				},
				teams: {
					teams_yount_pk: "teams_id_yount_pk PRIMARY KEY (id)",
				},
			},
		});
		expect(findPrimaryKey("books", schema.primaryKey)).toStrictEqual(["id"]);
		expect(findPrimaryKey("teams", schema.primaryKey)).toStrictEqual(["id"]);
	});

	test("returns the primary key columns of a table", () => {
		const schema = schemaMigratonInfoFactory({
			primaryKey: {
				books: {
					books_yount_pk: 'books_id_yount_pk PRIMARY KEY ("id", "name")',
				},
				teams: {
					teams_yount_pk: "teams_id_yount_pk PRIMARY KEY (id, name)",
				},
			},
		});
		expect(findPrimaryKey("books", schema.primaryKey)).toStrictEqual([
			"id",
			"name",
		]);
		expect(findPrimaryKey("teams", schema.primaryKey)).toStrictEqual([
			"id",
			"name",
		]);
	});

	test("returns an empty array when the primary key of a table is not found", () => {
		const schema = schemaMigratonInfoFactory({
			primaryKey: {
				books: {},
			},
		});
		expect(findPrimaryKey("books", schema.primaryKey)).toStrictEqual([]);
	});

	test("returns an empty array the table is not found", () => {
		const schema = schemaMigratonInfoFactory({
			primaryKey: {
				books: {},
			},
		});
		expect(findPrimaryKey("teams", schema.primaryKey)).toStrictEqual([]);
	});

	test("returns an empty array on malformed schema", () => {
		const schema = schemaMigratonInfoFactory({
			primaryKey: {
				books: {
					books_yount_pk: "this is not a definition",
				},
			},
		});
		expect(findPrimaryKey("books", schema.primaryKey)).toStrictEqual([]);
	});
});

describe("findForeignKeysTargetTables", () => {
	test("returns the target table of a foreign key", () => {
		const schema = schemaMigratonInfoFactory({
			foreignKeyConstraints: {
				books: {
					books_author_id_authors_id_yount_fk:
						'FOREIGN KEY ("author_id") REFERENCES "authors" ("id")',
				},
			},
		});
		expect(findForeignKeysTargetTables(schema, "books")).toStrictEqual([
			"authors",
		]);
	});

	test("returns the target tables of a foreign keys", () => {
		const schema = schemaMigratonInfoFactory({
			foreignKeyConstraints: {
				books: {
					books_author_id_authors_id_yount_fk:
						'FOREIGN KEY ("author_id") REFERENCES "authors" ("id")',
					books_building_id_buildings_id_yount_fk:
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

		const dbSchema = schema({
			tables: {
				users,
			},
		});

		expect(findTableInDatabaseSchema(users, dbSchema)).toStrictEqual("users");
	});

	test("returns the undefined if the table is not found", () => {
		const users = table({
			columns: {
				id: serial(),
			},
		});

		const dbSchema = schema({
			tables: {},
		});

		expect(findTableInDatabaseSchema(users, dbSchema)).toBeUndefined();
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

		const dbSchema = schema({
			tables: {
				users,
				desks,
			},
		});
		expect(findTableInDatabaseSchema(desks, dbSchema)).toStrictEqual("desks");
	});
});
