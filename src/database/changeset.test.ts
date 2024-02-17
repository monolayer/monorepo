import { sql } from "kysely";
import { describe, expect, test } from "vitest";
import { changeset } from "~/database/changeset.js";
import { index } from "~/database/schema/pg_index.js";
import { ColumnIdentity } from "~/index.js";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { compileIndex } from "~tests/helpers/indexes.js";

describe("#dbChangeset", () => {
	test("create a table", () => {
		const cset = changeset(
			{
				table: {
					books: {
						id: columnInfoFactory({
							tableName: "books",
							columnName: "id",
							dataType: "serial",
						}),
						name: columnInfoFactory({
							tableName: "books",
							columnName: "name",
							dataType: "text",
							defaultValue: "'10'::text",
						}),
					},
					members: {
						name: columnInfoFactory({
							tableName: "members",
							columnName: "name",
							dataType: "varchar",
							defaultValue: sql`hello`,
						}),
						email: columnInfoFactory({
							tableName: "members",
							columnName: "email",
							dataType: "varchar(255)",
							characterMaximumLength: 255,
							defaultValue: sql`${sql`10`}`,
						}),
						city: columnInfoFactory({
							tableName: "members",
							columnName: "city",
							dataType: "text",
							isNullable: false,
						}),
					},
				},
				index: {},
				uniqueConstraints: {},
				foreignKeyConstraints: {},
				primaryKey: {},
				extensions: {},
				triggers: {},
				enums: {},
			},
			{
				table: {},
				index: {},
				uniqueConstraints: {},
				foreignKeyConstraints: {},
				primaryKey: {},
				extensions: {},
				triggers: {},
				enums: {},
			},
		);

		const expected = [
			{
				tableName: "books",
				type: "createTable",
				priority: 1,
				up: [
					"await db.schema",
					'createTable("books")',
					'addColumn("id", "serial")',
					'addColumn("name", "text", (col) => col.defaultTo(sql`\'10\'::text`))',
					"execute();",
				],
				down: ["await db.schema", 'dropTable("books")', "execute();"],
			},
			{
				tableName: "members",
				priority: 1,
				type: "createTable",
				up: [
					"await db.schema",
					'createTable("members")',
					'addColumn("name", "varchar", (col) => col.defaultTo(sql`hello`))',
					'addColumn("email", "varchar(255)", (col) => col.defaultTo(sql`10`))',
					'addColumn("city", "text", (col) => col.notNull())',
					"execute();",
				],
				down: ["await db.schema", 'dropTable("members")', "execute();"],
			},
		];
		expect(cset).toStrictEqual(expected);
	});

	test("drop a table", () => {
		const cset = changeset(
			{
				table: {},
				index: {},
				uniqueConstraints: {},
				foreignKeyConstraints: {},
				primaryKey: {},
				extensions: {},
				triggers: {},
				enums: {},
			},
			{
				table: {
					shops: {
						name: columnInfoFactory({
							tableName: "members",
							columnName: "name",
							dataType: "varchar",
							defaultValue: sql`hello`,
						}),
						email: columnInfoFactory({
							tableName: "members",
							columnName: "email",
							dataType: "varchar(255)",
							characterMaximumLength: 255,
						}),
						city: columnInfoFactory({
							tableName: "members",
							columnName: "city",
							dataType: "text",
							isNullable: false,
						}),
					},
				},
				index: {},
				uniqueConstraints: {},
				foreignKeyConstraints: {},
				primaryKey: {},
				extensions: {},
				triggers: {},
				enums: {},
			},
		);

		const expected = [
			{
				tableName: "shops",
				priority: 1,
				type: "dropTable",
				up: ["await db.schema", 'dropTable("shops")', "execute();"],
				down: [
					"await db.schema",
					'createTable("shops")',
					'addColumn("name", "varchar", (col) => col.defaultTo(sql`hello`))',
					'addColumn("email", "varchar(255)")',
					'addColumn("city", "text", (col) => col.notNull())',
					"execute();",
				],
			},
		];
		expect(cset).toStrictEqual(expected);
	});

	test("change a table", () => {
		const cset = changeset(
			{
				table: {
					samples: {
						id: columnInfoFactory({
							tableName: "samples",
							columnName: "id",
							dataType: "bigserial",
							isNullable: false,
						}),
						name: columnInfoFactory({
							tableName: "samples",
							columnName: "name",
							dataType: "text",
							isNullable: false,
						}),
					},
					addresses: {
						id: columnInfoFactory({
							tableName: "addresses",
							columnName: "id",
							dataType: "serial",
						}),
						country: columnInfoFactory({
							tableName: "members",
							columnName: "country",
							dataType: "text",
						}),
						name: columnInfoFactory({
							tableName: "members",
							columnName: "name",
							dataType: "varchar",
							isNullable: true,
						}),
						email: columnInfoFactory({
							tableName: "members",
							columnName: "email",
							dataType: "varchar",
						}),
						city: columnInfoFactory({
							tableName: "members",
							columnName: "city",
							dataType: "text",
							isNullable: false,
						}),
					},
				},
				index: {},
				uniqueConstraints: {},
				foreignKeyConstraints: {},
				primaryKey: {},
				extensions: {},
				triggers: {},
				enums: {},
			},
			{
				table: {
					addresses: {
						name: columnInfoFactory({
							tableName: "members",
							columnName: "name",
							dataType: "text",
							isNullable: false,
						}),
						email: columnInfoFactory({
							tableName: "members",
							columnName: "email",
							dataType: "varchar(255)",
							characterMaximumLength: 255,
						}),
						city: columnInfoFactory({
							tableName: "members",
							columnName: "city",
							dataType: "text",
						}),
					},
					samples: {
						id: columnInfoFactory({
							tableName: "samples",
							columnName: "id",
							dataType: "bigserial",
							isNullable: false,
						}),
						name: columnInfoFactory({
							tableName: "samples",
							columnName: "name",
							dataType: "text",
							isNullable: false,
						}),
					},
				},
				index: {},
				uniqueConstraints: {},
				foreignKeyConstraints: {},
				primaryKey: {},
				extensions: {},
				triggers: {},
				enums: {},
			},
		);

		const expected = [
			{
				tableName: "addresses",
				type: "createColumn",
				priority: 2,
				up: [
					"await db.schema",
					'alterTable("addresses")',
					'addColumn("id", "serial")',
					"execute();",
				],
				down: [
					"await db.schema",
					'alterTable("addresses")',
					'dropColumn("id")',
					"execute();",
				],
			},
			{
				tableName: "addresses",
				type: "createColumn",
				priority: 2,
				up: [
					"await db.schema",
					'alterTable("addresses")',
					'addColumn("country", "text")',
					"execute();",
				],
				down: [
					"await db.schema",
					'alterTable("addresses")',
					'dropColumn("country")',
					"execute();",
				],
			},
			{
				tableName: "addresses",
				type: "changeColumn",
				priority: 3,
				up: [
					"await db.schema",
					'alterTable("addresses")',
					'alterColumn("name", (col) => col.setDataType("varchar"))',
					"execute();",
				],
				down: [
					"await db.schema",
					'alterTable("addresses")',
					'alterColumn("name", (col) => col.setDataType("text"))',
					"execute();",
				],
			},
			{
				tableName: "addresses",
				type: "changeColumn",
				priority: 3,
				up: [
					"await db.schema",
					'alterTable("addresses")',
					'alterColumn("email", (col) => col.setDataType("varchar"))',
					"execute();",
				],
				down: [
					"await db.schema",
					'alterTable("addresses")',
					'alterColumn("email", (col) => col.setDataType("varchar(255)"))',
					"execute();",
				],
			},
			{
				tableName: "addresses",
				type: "changeColumn",
				priority: 3.1,
				up: [
					"await db.schema",
					'alterTable("addresses")',
					'alterColumn("name", (col) => col.setNotNull())',
					"execute();",
				],
				down: [
					"await db.schema",
					'alterTable("addresses")',
					'alterColumn("name", (col) => col.dropNotNull())',
					"execute();",
				],
			},
			{
				tableName: "addresses",
				type: "changeColumn",
				priority: 3.1,
				up: [
					"await db.schema",
					'alterTable("addresses")',
					'alterColumn("city", (col) => col.setNotNull())',
					"execute();",
				],
				down: [
					"await db.schema",
					'alterTable("addresses")',
					'alterColumn("city", (col) => col.dropNotNull())',
					"execute();",
				],
			},
		];
		expect(cset).toStrictEqual(expected);
	});

	describe("identity columns", () => {
		test("on table creation", () => {
			const cset = changeset(
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",

								identity: ColumnIdentity.ByDefault,
							}),
						},
						members: {
							id: columnInfoFactory({
								tableName: "members",
								columnName: "id",
								dataType: "varchar",
								identity: ColumnIdentity.Always,
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					type: "createTable",
					priority: 1,
					up: [
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "integer", (col) => col.generatedByDefaultAsIdentity())',
						"execute();",
					],
					down: ["await db.schema", 'dropTable("books")', "execute();"],
				},
				{
					tableName: "members",
					type: "createTable",
					priority: 1,
					up: [
						"await db.schema",
						'createTable("members")',
						'addColumn("id", "varchar", (col) => col.generatedAlwaysAsIdentity())',
						"execute();",
					],
					down: ["await db.schema", 'dropTable("members")', "execute();"],
				},
			];
			expect(cset).toStrictEqual(expected);
		});

		test("on table drop", () => {
			const cset = changeset(
				{
					table: {},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",

								identity: ColumnIdentity.ByDefault,
							}),
						},
						members: {
							id: columnInfoFactory({
								tableName: "members",
								columnName: "id",
								dataType: "varchar",
								identity: ColumnIdentity.Always,
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					type: "dropTable",
					priority: 1,
					up: ["await db.schema", 'dropTable("books")', "execute();"],
					down: [
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "integer", (col) => col.generatedByDefaultAsIdentity())',
						"execute();",
					],
				},
				{
					tableName: "members",
					type: "dropTable",
					priority: 1,
					up: ["await db.schema", 'dropTable("members")', "execute();"],
					down: [
						"await db.schema",
						'createTable("members")',
						'addColumn("id", "varchar", (col) => col.generatedAlwaysAsIdentity())',
						"execute();",
					],
				},
			];
			expect(cset).toStrictEqual(expected);
		});

		test("on column creation", () => {
			const cset = changeset(
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",

								identity: ColumnIdentity.ByDefault,
							}),
						},
						members: {
							id: columnInfoFactory({
								tableName: "members",
								columnName: "id",
								dataType: "varchar",
								identity: ColumnIdentity.Always,
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						books: {},
						members: {},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					priority: 2,
					type: "createColumn",
					up: [
						"await db.schema",
						'alterTable("books")',
						'addColumn("id", "integer", (col) => col.generatedByDefaultAsIdentity())',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("books")',
						'dropColumn("id")',
						"execute();",
					],
				},
				{
					tableName: "members",
					priority: 2,
					type: "createColumn",
					up: [
						"await db.schema",
						'alterTable("members")',
						'addColumn("id", "varchar", (col) => col.generatedAlwaysAsIdentity())',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("members")',
						'dropColumn("id")',
						"execute();",
					],
				},
			];
			expect(cset).toStrictEqual(expected);
		});

		test("on column change (add)", () => {
			const cset = changeset(
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",

								identity: ColumnIdentity.ByDefault,
							}),
						},
						members: {
							id: columnInfoFactory({
								tableName: "members",
								columnName: "id",
								dataType: "varchar",
								identity: ColumnIdentity.Always,
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
							}),
						},
						members: {
							id: columnInfoFactory({
								tableName: "members",
								columnName: "id",
								dataType: "varchar",
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					priority: 3.5,
					type: "changeColumn",
					up: [
						"await sql`ALTER TABLE books ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY`.execute(db);",
					],
					down: [
						"await sql`ALTER TABLE books ALTER COLUMN id DROP IDENTITY`.execute(db);",
					],
				},
				{
					tableName: "members",
					priority: 3.5,
					type: "changeColumn",
					up: [
						"await sql`ALTER TABLE members ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY`.execute(db);",
					],
					down: [
						"await sql`ALTER TABLE members ALTER COLUMN id DROP IDENTITY`.execute(db);",
					],
				},
			];
			expect(cset).toStrictEqual(expected);
		});

		test("on column change (remove)", () => {
			const cset = changeset(
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
							}),
						},
						members: {
							id: columnInfoFactory({
								tableName: "members",
								columnName: "id",
								dataType: "varchar",
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",

								identity: ColumnIdentity.ByDefault,
							}),
						},
						members: {
							id: columnInfoFactory({
								tableName: "members",
								columnName: "id",
								dataType: "varchar",
								identity: ColumnIdentity.Always,
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					priority: 3.51,
					type: "changeColumn",
					up: [
						"await sql`ALTER TABLE books ALTER COLUMN id DROP IDENTITY`.execute(db);",
					],
					down: [
						"await sql`ALTER TABLE books ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY`.execute(db);",
					],
				},
				{
					tableName: "members",
					priority: 3.51,
					type: "changeColumn",
					up: [
						"await sql`ALTER TABLE members ALTER COLUMN id DROP IDENTITY`.execute(db);",
					],
					down: [
						"await sql`ALTER TABLE members ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY`.execute(db);",
					],
				},
			];
			expect(cset).toStrictEqual(expected);
		});

		test("on column drop", () => {
			const cset = changeset(
				{
					table: {
						books: {},
						members: {},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",

								identity: ColumnIdentity.ByDefault,
							}),
						},
						members: {
							id: columnInfoFactory({
								tableName: "members",
								columnName: "id",
								dataType: "varchar",
								identity: ColumnIdentity.Always,
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					priority: 2,
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
						'addColumn("id", "integer", (col) => col.generatedByDefaultAsIdentity())',
						"execute();",
					],
				},
				{
					tableName: "members",
					priority: 2,
					type: "dropColumn",
					up: [
						"await db.schema",
						'alterTable("members")',
						'dropColumn("id")',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("members")',
						'addColumn("id", "varchar", (col) => col.generatedAlwaysAsIdentity())',
						"execute();",
					],
				},
			];
			expect(cset).toStrictEqual(expected);
		});
	});

	describe("column default value", () => {
		test("on table creation", () => {
			const cset = changeset(
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
								defaultValue: "'1'::integer",
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					type: "createTable",
					priority: 1,
					up: [
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "integer", (col) => col.defaultTo(sql`\'1\'::integer`))',
						"execute();",
					],
					down: ["await db.schema", 'dropTable("books")', "execute();"],
				},
			];
			expect(cset).toStrictEqual(expected);
		});

		test("on table drop", () => {
			const cset = changeset(
				{
					table: {},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
								defaultValue: "'1'::integer",
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					type: "dropTable",
					priority: 1,
					up: ["await db.schema", 'dropTable("books")', "execute();"],
					down: [
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "integer", (col) => col.defaultTo(sql`\'1\'::integer`))',
						"execute();",
					],
				},
			];
			expect(cset).toStrictEqual(expected);
		});

		test("on column creation", () => {
			const cset = changeset(
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
								defaultValue: "'1'::integer",
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						books: {},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					priority: 2,
					type: "createColumn",
					up: [
						"await db.schema",
						'alterTable("books")',
						'addColumn("id", "integer", (col) => col.defaultTo(sql`\'1\'::integer`))',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("books")',
						'dropColumn("id")',
						"execute();",
					],
				},
			];
			expect(cset).toStrictEqual(expected);
		});

		test("on column change (add)", () => {
			const cset = changeset(
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
								defaultValue: "'1'::integer",
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					priority: 3.7,
					type: "changeColumn",
					up: [
						"await db.schema",
						'alterTable("books")',
						"alterColumn(\"id\", (col) => col.setDefault(sql`'1'::integer`))",
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("books")',
						'alterColumn("id", (col) => col.dropDefault())',
						"execute();",
					],
				},
			];
			expect(cset).toStrictEqual(expected);
		});

		test("on column change (remove)", () => {
			const cset = changeset(
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
								defaultValue: "'1'::integer",
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					priority: 3.71,
					type: "changeColumn",
					up: [
						"await db.schema",
						'alterTable("books")',
						'alterColumn("id", (col) => col.dropDefault())',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("books")',
						"alterColumn(\"id\", (col) => col.setDefault(sql`'1'::integer`))",
						"execute();",
					],
				},
			];
			expect(cset).toStrictEqual(expected);
		});

		test("on column change (change)", () => {
			const cset = changeset(
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
								defaultValue: "'3'::integer",
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
								defaultValue: "'1'::integer",
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					priority: 3.72,
					type: "changeColumn",
					up: [
						"await db.schema",
						'alterTable("books")',
						"alterColumn(\"id\", (col) => col.setDefault(sql`'3'::integer`))",
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("books")',
						"alterColumn(\"id\", (col) => col.setDefault(sql`'1'::integer`))",
						"execute();",
					],
				},
			];
			expect(cset).toStrictEqual(expected);
		});
	});

	describe("indexes", () => {
		test("on table creation", () => {
			const cset = changeset(
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "serial",
							}),
							name: columnInfoFactory({
								tableName: "books",
								columnName: "name",
								dataType: "text",
								defaultValue: "'10'::text",
							}),
						},
					},
					index: {
						books: {
							...compileIndex(
								index("name", (idx) => idx),
								"books",
							),
						},
					},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);

			const expected = [
				{
					tableName: "books",
					type: "createTable",
					priority: 1,
					up: [
						"await db.schema",
						'createTable("books")',
						'addColumn("id", "serial")',
						'addColumn("name", "text", (col) => col.defaultTo(sql`\'10\'::text`))',
						"execute();",
					],
					down: ["await db.schema", 'dropTable("books")', "execute();"],
				},
				{
					priority: 4,
					tableName: "books",
					type: "createIndex",
					up: [
						'await sql`create index "books_name_kntc_idx" on "books" ("name");COMMENT ON INDEX books_name_kntc_idx IS \'77f3737b4f672295b1204a55da66fa8873cf81ba7ae3d785480c618455e3ac22\'`.execute(db);',
					],
					down: [],
				},
			];
			expect(cset).toStrictEqual(expected);
		});

		test("on table drop", () => {
			const cset = changeset(
				{
					table: {},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						shops: {
							name: columnInfoFactory({
								tableName: "members",
								columnName: "name",
								dataType: "varchar",
								defaultValue: sql`hello`,
							}),
							email: columnInfoFactory({
								tableName: "members",
								columnName: "email",
								dataType: "varchar(255)",
								characterMaximumLength: 255,
							}),
							city: columnInfoFactory({
								tableName: "members",
								columnName: "city",
								dataType: "text",
								isNullable: false,
							}),
						},
					},
					index: {
						shops: {
							shops_email_kntc_idx:
								'abcd:create unique index "shops_email_kntc_idx" on "shops" using btree ("email")',
							shops_city_kntc_idx:
								'1234:create unique index "shops_city_kntc_idx" on "shops" using btree ("city")',
						},
					},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);

			const expected = [
				{
					tableName: "shops",
					priority: 1,
					type: "dropTable",
					up: ["await db.schema", 'dropTable("shops")', "execute();"],
					down: [
						"await db.schema",
						'createTable("shops")',
						'addColumn("name", "varchar", (col) => col.defaultTo(sql`hello`))',
						'addColumn("email", "varchar(255)")',
						'addColumn("city", "text", (col) => col.notNull())',
						"execute();",
					],
				},
				{
					tableName: "shops",
					priority: 4,
					type: "dropIndex",
					up: [],
					down: [
						'await sql`create unique index "shops_email_kntc_idx" on "shops" using btree ("email");COMMENT ON INDEX shops_email_kntc_idx IS \'abcd\'`.execute(db);',
					],
				},
				{
					tableName: "shops",
					priority: 4,
					type: "dropIndex",
					up: [],
					down: [
						'await sql`create unique index "shops_city_kntc_idx" on "shops" using btree ("city");COMMENT ON INDEX shops_city_kntc_idx IS \'1234\'`.execute(db);',
					],
				},
			];
			expect(cset).toStrictEqual(expected);
		});

		test("on table change (create)", () => {
			const cset = changeset(
				{
					table: {
						shops: {
							name: columnInfoFactory({
								tableName: "members",
								columnName: "name",
								dataType: "varchar",
								defaultValue: sql`hello`,
							}),
							email: columnInfoFactory({
								tableName: "members",
								columnName: "email",
								dataType: "varchar(255)",
								characterMaximumLength: 255,
							}),
							city: columnInfoFactory({
								tableName: "members",
								columnName: "city",
								dataType: "text",
								isNullable: false,
							}),
						},
					},
					index: {
						shops: {
							shops_email_kntc_idx:
								'abcd:create unique index "shops_email_kntc_idx" on "shops" using btree ("email")',
							shops_city_kntc_idx:
								'1234:create unique index "shops_city_kntc_idx" on "shops" using btree ("city")',
						},
					},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						shops: {
							name: columnInfoFactory({
								tableName: "members",
								columnName: "name",
								dataType: "varchar",
								defaultValue: sql`hello`,
							}),
							email: columnInfoFactory({
								tableName: "members",
								columnName: "email",
								dataType: "varchar(255)",
								characterMaximumLength: 255,
							}),
							city: columnInfoFactory({
								tableName: "members",
								columnName: "city",
								dataType: "text",
								isNullable: false,
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);

			const expected = [
				{
					tableName: "shops",
					priority: 4,
					type: "createIndex",
					up: [
						'await sql`create unique index "shops_email_kntc_idx" on "shops" using btree ("email");COMMENT ON INDEX shops_email_kntc_idx IS \'abcd\'`.execute(db);',
					],
					down: [
						'await db.schema.dropIndex("shops_email_kntc_idx").execute();',
					],
				},
				{
					tableName: "shops",
					priority: 4,
					type: "createIndex",
					up: [
						'await sql`create unique index "shops_city_kntc_idx" on "shops" using btree ("city");COMMENT ON INDEX shops_city_kntc_idx IS \'1234\'`.execute(db);',
					],
					down: ['await db.schema.dropIndex("shops_city_kntc_idx").execute();'],
				},
			];
			expect(cset).toStrictEqual(expected);
		});

		test("on table change (drop)", () => {
			const cset = changeset(
				{
					table: {
						shops: {
							name: columnInfoFactory({
								tableName: "members",
								columnName: "name",
								dataType: "varchar",
								defaultValue: sql`hello`,
							}),
							email: columnInfoFactory({
								tableName: "members",
								columnName: "email",
								dataType: "varchar(255)",
								characterMaximumLength: 255,
							}),
							city: columnInfoFactory({
								tableName: "members",
								columnName: "city",
								dataType: "text",
								isNullable: false,
							}),
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						shops: {
							name: columnInfoFactory({
								tableName: "members",
								columnName: "name",
								dataType: "varchar",
								defaultValue: sql`hello`,
							}),
							email: columnInfoFactory({
								tableName: "members",
								columnName: "email",
								dataType: "varchar(255)",
								characterMaximumLength: 255,
							}),
							city: columnInfoFactory({
								tableName: "members",
								columnName: "city",
								dataType: "text",
								isNullable: false,
							}),
						},
					},
					index: {
						shops: {
							shops_email_kntc_idx:
								'abcd:create unique index "shops_email_kntc_idx" on "shops" using btree ("email")',
							shops_city_kntc_idx:
								'1234:create unique index "shops_city_kntc_idx" on "shops" using btree ("city")',
						},
					},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);

			const expected = [
				{
					tableName: "shops",
					priority: 4,
					type: "dropIndex",
					up: ['await db.schema.dropIndex("shops_email_kntc_idx").execute();'],
					down: [
						'await sql`create unique index "shops_email_kntc_idx" on "shops" using btree ("email");COMMENT ON INDEX shops_email_kntc_idx IS \'abcd\'`.execute(db);',
					],
				},
				{
					tableName: "shops",
					priority: 4,
					type: "dropIndex",
					up: ['await db.schema.dropIndex("shops_city_kntc_idx").execute();'],
					down: [
						'await sql`create unique index "shops_city_kntc_idx" on "shops" using btree ("city");COMMENT ON INDEX shops_city_kntc_idx IS \'1234\'`.execute(db);',
					],
				},
			];
			expect(cset).toStrictEqual(expected);
		});

		test("on table change (change)", () => {
			const cset = changeset(
				{
					table: {
						shops: {
							name: columnInfoFactory({
								tableName: "members",
								columnName: "name",
								dataType: "varchar",
								defaultValue: sql`hello`,
							}),
							email: columnInfoFactory({
								tableName: "members",
								columnName: "email",
								dataType: "varchar(255)",
								characterMaximumLength: 255,
							}),
							city: columnInfoFactory({
								tableName: "members",
								columnName: "city",
								dataType: "text",
								isNullable: false,
							}),
						},
					},
					index: {
						shops: {
							shops_email_kntc_idx:
								'abcde:create unique index "shops_email_kntc_idx" on "shops" using hash ("email")',
							shops_city_kntc_idx:
								'1234:create unique index "shops_city_kntc_idx" on "shops" using btree ("city")',
						},
					},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						shops: {
							name: columnInfoFactory({
								tableName: "members",
								columnName: "name",
								dataType: "varchar",
								defaultValue: sql`hello`,
							}),
							email: columnInfoFactory({
								tableName: "members",
								columnName: "email",
								dataType: "varchar(255)",
								characterMaximumLength: 255,
							}),
							city: columnInfoFactory({
								tableName: "members",
								columnName: "city",
								dataType: "text",
								isNullable: false,
							}),
						},
					},
					index: {
						shops: {
							shops_email_kntc_idx:
								'abcd:create unique index "shops_email_kntc_idx" on "shops" using btree ("email")',
							shops_city_kntc_idx:
								'1234:CREATE UNIQUE INDEX "shops_city_kntc_idx" on "shops" using btree ("city")',
						},
					},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);

			const expected = [
				{
					tableName: "shops",
					priority: 4.1,
					type: "changeIndex",
					up: [
						'await sql`DROP INDEX shops_email_kntc_idx;create unique index "shops_email_kntc_idx" on "shops" using hash ("email");COMMENT ON INDEX shops_email_kntc_idx IS \'abcde\'`.execute(db);',
					],
					down: [
						'await sql`DROP INDEX shops_email_kntc_idx;create unique index "shops_email_kntc_idx" on "shops" using btree ("email");COMMENT ON INDEX shops_email_kntc_idx IS \'abcd\'`.execute(db);',
					],
				},
			];
			expect(cset).toStrictEqual(expected);
		});
	});

	describe("extensions", () => {
		test("adding extensions", () => {
			const cset = changeset(
				{
					table: {},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {
						btree_gist: true,
					},
					triggers: {},
					enums: {},
				},
				{
					table: {},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {
						cube: true,
					},
					triggers: {},
					enums: {},
				},
			);

			const expected = [
				{
					tableName: "none",
					priority: 0,
					type: "dropExtension",
					up: ["await sql`DROP EXTENSION IF EXISTS cube;`.execute(db);"],
					down: [
						"await sql`CREATE EXTENSION IF NOT EXISTS cube;`.execute(db);",
					],
				},
				{
					tableName: "none",
					priority: 0,
					type: "createExtension",
					up: [
						"await sql`CREATE EXTENSION IF NOT EXISTS btree_gist;`.execute(db);",
					],
					down: [
						"await sql`DROP EXTENSION IF EXISTS btree_gist;`.execute(db);",
					],
				},
			];

			expect(cset).toStrictEqual(expected);
		});
	});

	describe("triggers", () => {
		test("on table creation", () => {
			const cset = changeset(
				{
					table: {
						remote_schema_books: {
							id: {
								characterMaximumLength: null,
								columnName: "id",
								dataType: "serial",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: false,
								numericPrecision: null,
								numericScale: null,

								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
							updated_at: {
								characterMaximumLength: null,
								columnName: "updated_at",
								dataType: "timestamp(6)",
								datetimePrecision: 6,
								defaultValue: "CURRENT_TIMESTAMP",
								identity: null,
								isNullable: true,
								numericPrecision: null,
								numericScale: null,
								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {
						remote_schema_books: {
							updated_at_remote_schema_books_trg:
								"abcd:CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at')",
						},
					},
					enums: {},
				},
				{
					table: {},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);

			const expected = [
				{
					priority: 1,
					tableName: "remote_schema_books",
					type: "createTable",
					up: [
						"await db.schema",
						'createTable("remote_schema_books")',
						'addColumn("id", "serial", (col) => col.notNull())',
						'addColumn("updated_at", "timestamp(6)", (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))',
						"execute();",
					],
					down: [
						"await db.schema",
						'dropTable("remote_schema_books")',
						"execute();",
					],
				},
				{
					tableName: "remote_schema_books",
					priority: 8.1,
					type: "createTrigger",
					up: [
						"await sql`CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');COMMENT ON TRIGGER updated_at_remote_schema_books_trg ON remote_schema_books IS 'abcd';`.execute(db);",
					],
					down: [],
				},
			];

			expect(cset).toStrictEqual(expected);
		});

		test("on table drop", () => {
			const cset = changeset(
				{
					table: {},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						remote_schema_books: {
							id: {
								characterMaximumLength: null,
								columnName: "id",
								dataType: "serial",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: false,
								numericPrecision: null,
								numericScale: null,

								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
							updated_at: {
								characterMaximumLength: null,
								columnName: "updated_at",
								dataType: "timestamp(6)",
								datetimePrecision: 6,
								defaultValue: "CURRENT_TIMESTAMP",
								identity: null,
								isNullable: true,
								numericPrecision: null,
								numericScale: null,
								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {
						remote_schema_books: {
							updated_at_remote_schema_books_trg:
								"abcd:CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at')",
						},
					},
					enums: {},
				},
			);

			const expected = [
				{
					priority: 1,
					tableName: "remote_schema_books",
					type: "dropTable",
					down: [
						"await db.schema",
						'createTable("remote_schema_books")',
						'addColumn("id", "serial", (col) => col.notNull())',
						'addColumn("updated_at", "timestamp(6)", (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))',
						"execute();",
					],
					up: [
						"await db.schema",
						'dropTable("remote_schema_books")',
						"execute();",
					],
				},
				{
					tableName: "remote_schema_books",
					priority: 8,
					type: "dropTrigger",
					up: [],
					down: [
						"await sql`CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');COMMENT ON TRIGGER updated_at_remote_schema_books_trg ON remote_schema_books IS 'abcd';`.execute(db);",
					],
				},
			];

			expect(cset).toStrictEqual(expected);
		});

		test("add trigger", () => {
			const cset = changeset(
				{
					table: {
						remote_schema_books: {
							id: {
								characterMaximumLength: null,
								columnName: "id",
								dataType: "serial",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: false,
								numericPrecision: null,
								numericScale: null,

								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
							updated_at: {
								characterMaximumLength: null,
								columnName: "updated_at",
								dataType: "timestamp(6)",
								datetimePrecision: 6,
								defaultValue: "CURRENT_TIMESTAMP",
								identity: null,
								isNullable: true,
								numericPrecision: null,
								numericScale: null,
								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {
						remote_schema_books: {
							updated_at_remote_schema_books_trg:
								"abcd:CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at')",
						},
					},
					enums: {},
				},
				{
					table: {
						remote_schema_books: {
							id: {
								characterMaximumLength: null,
								columnName: "id",
								dataType: "serial",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: false,
								numericPrecision: null,
								numericScale: null,

								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
							updated_at: {
								characterMaximumLength: null,
								columnName: "updated_at",
								dataType: "timestamp(6)",
								datetimePrecision: 6,
								defaultValue: "CURRENT_TIMESTAMP",
								identity: null,
								isNullable: true,
								numericPrecision: null,
								numericScale: null,
								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);

			const expected = [
				{
					tableName: "remote_schema_books",
					priority: 8.1,
					type: "createTrigger",
					up: [
						"await sql`CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');COMMENT ON TRIGGER updated_at_remote_schema_books_trg ON remote_schema_books IS 'abcd';`.execute(db);",
					],
					down: [
						"await sql`DROP TRIGGER updated_at_remote_schema_books_trg ON remote_schema_books`.execute(db);",
					],
				},
			];

			expect(cset).toStrictEqual(expected);
		});

		test("drop trigger", () => {
			const cset = changeset(
				{
					table: {
						remote_schema_books: {
							id: {
								characterMaximumLength: null,
								columnName: "id",
								dataType: "serial",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: false,
								numericPrecision: null,
								numericScale: null,

								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
							updated_at: {
								characterMaximumLength: null,
								columnName: "updated_at",
								dataType: "timestamp(6)",
								datetimePrecision: 6,
								defaultValue: "CURRENT_TIMESTAMP",
								identity: null,
								isNullable: true,
								numericPrecision: null,
								numericScale: null,
								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						remote_schema_books: {
							id: {
								characterMaximumLength: null,
								columnName: "id",
								dataType: "serial",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: false,
								numericPrecision: null,
								numericScale: null,

								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
							updated_at: {
								characterMaximumLength: null,
								columnName: "updated_at",
								dataType: "timestamp(6)",
								datetimePrecision: 6,
								defaultValue: "CURRENT_TIMESTAMP",
								identity: null,
								isNullable: true,
								numericPrecision: null,
								numericScale: null,
								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {
						remote_schema_books: {
							updated_at_remote_schema_books_trg:
								"abcd:CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at')",
						},
					},
					enums: {},
				},
			);

			const expected = [
				{
					tableName: "remote_schema_books",
					priority: 8,
					type: "dropTrigger",
					up: [
						"await sql`DROP TRIGGER updated_at_remote_schema_books_trg ON remote_schema_books`.execute(db);",
					],
					down: [
						"await sql`CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');COMMENT ON TRIGGER updated_at_remote_schema_books_trg ON remote_schema_books IS 'abcd';`.execute(db);",
					],
				},
			];

			expect(cset).toStrictEqual(expected);
		});

		test("change trigger", () => {
			const cset = changeset(
				{
					table: {
						remote_schema_books: {
							id: {
								characterMaximumLength: null,
								columnName: "id",
								dataType: "serial",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: false,
								numericPrecision: null,
								numericScale: null,

								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
							updated_at: {
								characterMaximumLength: null,
								columnName: "updated_at",
								dataType: "timestamp(6)",
								datetimePrecision: 6,
								defaultValue: "CURRENT_TIMESTAMP",
								identity: null,
								isNullable: true,
								numericPrecision: null,
								numericScale: null,
								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {
						remote_schema_books: {
							updated_at_remote_schema_books_trg:
								"abcsd:CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH STATEMENT EXECUTE FUNCTION moddatetime('updated_at')",
							created_at_remote_schema_books_trg:
								"123456:CREATE TRIGGER created_at_remote_schema_books_trg BEFORE UPDATE ON remote_schema_books FOR EACH STATEMENT EXECUTE FUNCTION moddatetime('created_at')",
						},
					},
					enums: {},
				},
				{
					table: {
						remote_schema_books: {
							id: {
								characterMaximumLength: null,
								columnName: "id",
								dataType: "serial",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: false,
								numericPrecision: null,
								numericScale: null,

								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
							updated_at: {
								characterMaximumLength: null,
								columnName: "updated_at",
								dataType: "timestamp(6)",
								datetimePrecision: 6,
								defaultValue: "CURRENT_TIMESTAMP",
								identity: null,
								isNullable: true,
								numericPrecision: null,
								numericScale: null,
								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {
						remote_schema_books: {
							updated_at_remote_schema_books_trg:
								"abcd:CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at')",
							created_at_remote_schema_books_trg:
								"123456:CREATE TRIGGER created_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH STATEMENT EXECUTE FUNCTION moddatetime('created_at')",
						},
					},
					enums: {},
				},
			);

			const expected = [
				{
					tableName: "remote_schema_books",
					priority: 8.2,
					type: "updateTrigger",
					up: [
						"await sql`DROP TRIGGER updated_at_remote_schema_books_trg ON remote_schema_books;CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH STATEMENT EXECUTE FUNCTION moddatetime('updated_at');COMMENT ON TRIGGER updated_at_remote_schema_books_trg ON remote_schema_books IS 'abcsd';`.execute(db);",
					],
					down: [
						"await sql`DROP TRIGGER updated_at_remote_schema_books_trg ON remote_schema_books;CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');COMMENT ON TRIGGER updated_at_remote_schema_books_trg ON remote_schema_books IS 'abcd';`.execute(db);",
					],
				},
			];

			expect(cset).toStrictEqual(expected);
		});
	});

	describe("enums", () => {
		test("create enums", () => {
			const cset = changeset(
				{
					table: {
						remote_schema_books: {
							id: {
								characterMaximumLength: null,
								columnName: "id",
								dataType: "serial",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: false,
								numericPrecision: null,
								numericScale: null,

								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
							role: {
								characterMaximumLength: null,
								columnName: "role",
								dataType: "books_role",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: true,
								numericPrecision: null,
								numericScale: null,
								renameFrom: null,
								tableName: "remote_schema_books",
								enum: true,
							},
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {
						book_status: "available, checked_out, lost",
					},
				},
				{
					table: {},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
			);

			const expected = [
				{
					tableName: "remote_schema_books",
					type: "createTable",
					priority: 1,
					up: [
						"await db.schema",
						'createTable("remote_schema_books")',
						'addColumn("id", "serial", (col) => col.notNull())',
						'addColumn("role", "books_role")',
						"execute();",
					],
					down: [
						"await db.schema",
						'dropTable("remote_schema_books")',
						"execute();",
					],
				},
				{
					priority: 0,
					tableName: "none",
					type: "createEnum",
					up: [
						"await kysely.schema",
						'.createType("book_status")',
						'.asEnum(["available", "checked_out", "lost"])',
						".execute();",
						"await sql`COMMENT ON TYPE book_status IS 'kinetic'`.execute(kysely);",
					],
					down: [
						"await kysely.schema",
						'.dropType("book_status")',
						".execute();",
					],
				},
			];

			expect(cset).toStrictEqual(expected);
		});

		test("drop enums", () => {
			const cset = changeset(
				{
					table: {
						remote_schema_books: {
							id: {
								characterMaximumLength: null,
								columnName: "id",
								dataType: "serial",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: false,
								numericPrecision: null,
								numericScale: null,

								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
							role: {
								characterMaximumLength: null,
								columnName: "role",
								dataType: "books_role",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: true,
								numericPrecision: null,
								numericScale: null,
								renameFrom: null,
								tableName: "remote_schema_books",
								enum: true,
							},
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {},
				},
				{
					table: {
						remote_schema_books: {
							id: {
								characterMaximumLength: null,
								columnName: "id",
								dataType: "serial",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: false,
								numericPrecision: null,
								numericScale: null,

								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
							role: {
								characterMaximumLength: null,
								columnName: "role",
								dataType: "books_role",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: true,
								numericPrecision: null,
								numericScale: null,
								renameFrom: null,
								tableName: "remote_schema_books",
								enum: true,
							},
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {
						book_status: "available, checked_out, lost",
					},
				},
			);

			const expected = [
				{
					priority: 0,
					tableName: "none",
					type: "dropEnum",
					up: [
						"await kysely.schema",
						'.dropType("book_status")',
						".execute();",
					],
					down: [
						"await kysely.schema",
						'.createType("book_status")',
						'.asEnum(["available", "checked_out", "lost"])',
						".execute();",
						"await sql`COMMENT ON TYPE book_status IS 'kinetic'`.execute(kysely);",
					],
				},
			];

			expect(cset).toStrictEqual(expected);
		});

		test("change enums", () => {
			const cset = changeset(
				{
					table: {
						remote_schema_books: {
							id: {
								characterMaximumLength: null,
								columnName: "id",
								dataType: "serial",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: false,
								numericPrecision: null,
								numericScale: null,

								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
							role: {
								characterMaximumLength: null,
								columnName: "role",
								dataType: "books_role",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: true,
								numericPrecision: null,
								numericScale: null,
								renameFrom: null,
								tableName: "remote_schema_books",
								enum: true,
							},
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {
						user_role: "",
						book_status: "available, checked_out, lost, recovered, damaged",
					},
				},
				{
					table: {
						remote_schema_books: {
							id: {
								characterMaximumLength: null,
								columnName: "id",
								dataType: "serial",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: false,
								numericPrecision: null,
								numericScale: null,

								renameFrom: null,
								tableName: "remote_schema_books",
								enum: false,
							},
							role: {
								characterMaximumLength: null,
								columnName: "role",
								dataType: "books_role",
								datetimePrecision: null,
								defaultValue: null,
								identity: null,
								isNullable: true,
								numericPrecision: null,
								numericScale: null,
								renameFrom: null,
								tableName: "remote_schema_books",
								enum: true,
							},
						},
					},
					index: {},
					uniqueConstraints: {},
					foreignKeyConstraints: {},
					primaryKey: {},
					extensions: {},
					triggers: {},
					enums: {
						user_role: "admin, user, guest",
						book_status: "available, checked_out, lost",
					},
				},
			);

			const expected = [
				{
					priority: 0,
					tableName: "none",
					type: "changeEnum",
					up: [
						"await sql`ALTER TYPE book_status ADD VALUE IF NOT EXISTS 'recovered';ALTER TYPE book_status ADD VALUE IF NOT EXISTS 'damaged';`.execute(kysely);",
					],
					down: [],
				},
			];

			expect(cset).toStrictEqual(expected);
		});
	});
});
