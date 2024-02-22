import { describe, expect, test } from "vitest";
import { changeset } from "~/database/changeset.js";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { ColumnIdentity } from "./schema/pg_column.js";

describe("#dbChangeset", () => {
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
				priority: 2002,
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
				priority: 2002,
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
				priority: 3001,
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
				priority: 3001,
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
				priority: 3008,
				up: [
					"await db.schema",
					'alterTable("addresses")',
					'alterColumn("name", (col) => col.dropNotNull())',
					"execute();",
				],
				down: [
					"await db.schema",
					'alterTable("addresses")',
					'alterColumn("name", (col) => col.setNotNull())',
					"execute();",
				],
			},
			{
				tableName: "addresses",
				type: "changeColumn",
				priority: 3008,
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
		expect(cset.sort((a, b) => a.priority - b.priority)).toStrictEqual(
			expected.sort((a, b) => a.priority - b.priority),
		);
	});

	describe("identity columns", () => {
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
					priority: 2002,
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
					priority: 2002,
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
					priority: 3003,
					type: "changeColumn",
					up: [
						'await sql`ALTER TABLE books ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY`.execute(db);',
					],
					down: [
						'await sql`ALTER TABLE books ALTER COLUMN "id" DROP IDENTITY`.execute(db);',
					],
				},
				{
					tableName: "members",
					priority: 3003,
					type: "changeColumn",
					up: [
						'await sql`ALTER TABLE members ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY`.execute(db);',
					],
					down: [
						'await sql`ALTER TABLE members ALTER COLUMN "id" DROP IDENTITY`.execute(db);',
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
					priority: 3004,
					type: "changeColumn",
					up: [
						'await sql`ALTER TABLE books ALTER COLUMN "id" DROP IDENTITY`.execute(db);',
					],
					down: [
						'await sql`ALTER TABLE books ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY`.execute(db);',
					],
				},
				{
					tableName: "members",
					priority: 3004,
					type: "changeColumn",
					up: [
						'await sql`ALTER TABLE members ALTER COLUMN "id" DROP IDENTITY`.execute(db);',
					],
					down: [
						'await sql`ALTER TABLE members ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY`.execute(db);',
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
					priority: 1005,
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
					priority: 1005,
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
					priority: 2002,
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
					priority: 3005,
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
					priority: 3006,
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
					priority: 3007,
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
});
