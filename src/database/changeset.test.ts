import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { env } from "process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ActionStatus } from "~/cli/command.js";
import { changeset } from "~/database/changeset.js";
import { index } from "~/database/schema/pg_index.js";
import { dropTables } from "~tests/helpers/dropTables.js";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { compileIndex } from "~tests/helpers/indexes.js";
import { type DbContext, globalPool } from "~tests/setup.js";
import { localSchema } from "./introspection/local_schema.js";
import { remoteSchema } from "./introspection/remote_schema.js";
import { ColumnIdentity, integer, text, varchar } from "./schema/pg_column.js";
import { pgDatabase } from "./schema/pg_database.js";
import { foreignKey } from "./schema/pg_foreign_key.js";
import { primaryKey } from "./schema/pg_primary_key.js";
import { pgTable } from "./schema/pg_table.js";
import { unique } from "./schema/pg_unique.js";

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
				priority: 2001,
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
				priority: 2001,
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
				priority: 1006,
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
				priority: 3002,
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
				priority: 3002,
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
					priority: 2001,
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
					priority: 2001,
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
					priority: 1006,
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
					priority: 1006,
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
						"await sql`ALTER TABLE books ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY`.execute(db);",
					],
					down: [
						"await sql`ALTER TABLE books ALTER COLUMN id DROP IDENTITY`.execute(db);",
					],
				},
				{
					tableName: "members",
					priority: 3003,
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
					priority: 3004,
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
					priority: 3004,
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
					priority: 2001,
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
					priority: 1006,
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
					priority: 2001,
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
					priority: 4003,
					tableName: "books",
					type: "createIndex",
					up: [
						'await sql`create index "books_name_kntc_idx" on "books" ("name");COMMENT ON INDEX books_name_kntc_idx IS \'77f3737b4f672295b1204a55da66fa8873cf81ba7ae3d785480c618455e3ac22\'`.execute(db);',
					],
					down: [],
				},
			];
			expect(cset.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
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
					priority: 1006,
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
					priority: 1002,
					type: "dropIndex",
					up: [],
					down: [
						'await sql`create unique index "shops_email_kntc_idx" on "shops" using btree ("email");COMMENT ON INDEX shops_email_kntc_idx IS \'abcd\'`.execute(db);',
					],
				},
				{
					tableName: "shops",
					priority: 1002,
					type: "dropIndex",
					up: [],
					down: [
						'await sql`create unique index "shops_city_kntc_idx" on "shops" using btree ("city");COMMENT ON INDEX shops_city_kntc_idx IS \'1234\'`.execute(db);',
					],
				},
			];
			expect(cset.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
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
					priority: 4003,
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
					priority: 4003,
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
					priority: 1002,
					type: "dropIndex",
					up: ['await db.schema.dropIndex("shops_email_kntc_idx").execute();'],
					down: [
						'await sql`create unique index "shops_email_kntc_idx" on "shops" using btree ("email");COMMENT ON INDEX shops_email_kntc_idx IS \'abcd\'`.execute(db);',
					],
				},
				{
					tableName: "shops",
					priority: 1002,
					type: "dropIndex",
					up: ['await db.schema.dropIndex("shops_city_kntc_idx").execute();'],
					down: [
						'await sql`create unique index "shops_city_kntc_idx" on "shops" using btree ("city");COMMENT ON INDEX shops_city_kntc_idx IS \'1234\'`.execute(db);',
					],
				},
			];
			expect(cset.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
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
					priority: 5001,
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
					priority: 2001,
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
					priority: 4004,
					type: "createTrigger",
					up: [
						"await sql`CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');COMMENT ON TRIGGER updated_at_remote_schema_books_trg ON remote_schema_books IS 'abcd';`.execute(db);",
					],
					down: [],
				},
			];

			expect(cset.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
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
					priority: 1006,
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
					priority: 1001,
					type: "dropTrigger",
					up: [],
					down: [
						"await sql`CREATE TRIGGER updated_at_remote_schema_books_trg BEFORE UPDATE ON public.remote_schema_books FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');COMMENT ON TRIGGER updated_at_remote_schema_books_trg ON remote_schema_books IS 'abcd';`.execute(db);",
					],
				},
			];

			expect(cset.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
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
					priority: 4004,
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
					priority: 1001,
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
					priority: 5003,
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
					priority: 2001,
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

			expect(cset.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
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

	describe("changing column names", () => {
		beforeEach<DbContext>(async (context) => {
			const pool = globalPool();
			await pool.query("DROP DATABASE IF EXISTS test_change_column_names");
			await pool.query("CREATE DATABASE test_change_column_names");
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			context.kysely = new Kysely<any>({
				dialect: new PostgresDialect({
					pool: new pg.Pool({
						connectionString: `${env.POSTGRES_URL}/test_change_column_names?schema=public`,
					}),
				}),
			});
			context.tableNames = [];
			await dropTables(context);
		});

		afterEach<DbContext>(async (context) => {
			await dropTables(context);
			await context.kysely.destroy();
			const pool = globalPool();
			await pool.query("DROP DATABASE IF EXISTS test_change_column_names");
		});

		test<DbContext>("change column name (not applied in remote)", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users");
			await kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.execute();

			const database = pgDatabase({
				tables: {
					users: pgTable("users", {
						columns: {
							fullName: text().renameFrom("name"),
						},
					}),
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			const expected = [
				{
					priority: 3008,
					tableName: "users",
					type: "changeColumnName",
					up: [
						"await db.schema",
						'alterTable("users")',
						'renameColumn("name", "fullName")',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("users")',
						'renameColumn("fullName", "name")',
						"execute();",
					],
				},
			];

			expect(cs).toStrictEqual(expected);
		});

		test<DbContext>("change column name (not applied in remote) and type", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users");
			await kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.execute();

			const database = pgDatabase({
				tables: {
					users: pgTable("users", {
						columns: {
							fullName: varchar(255).renameFrom("name"),
						},
					}),
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			const expected = [
				{
					priority: 3001,
					tableName: "users",
					type: "changeColumn",
					up: [
						"await db.schema",
						'alterTable("users")',
						'alterColumn("name", (col) => col.setDataType("varchar(255)"))',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("users")',
						'alterColumn("name", (col) => col.setDataType("text"))',
						"execute();",
					],
				},
				{
					priority: 3008,
					tableName: "users",
					type: "changeColumnName",
					up: [
						"await db.schema",
						'alterTable("users")',
						'renameColumn("name", "fullName")',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("users")',
						'renameColumn("fullName", "name")',
						"execute();",
					],
				},
			];

			expect(cs.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
		});

		test<DbContext>("change column name (not applied in remote) with unique constraints applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users");
			await kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addUniqueConstraint("users_name_kinetic_key", ["name"])
				.execute();

			const users = pgTable("users", {
				columns: {
					fullName: text().renameFrom("name"),
				},
				constraints: [unique(["fullName"], false)],
			});

			const database = pgDatabase({
				tables: {
					users: users,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			const expected = [
				{
					priority: 1003,
					tableName: "users",
					type: "dropConstraint",
					up: [
						"await sql`ALTER TABLE users DROP CONSTRAINT users_name_kinetic_key`.execute(db);",
					],
					down: [
						'await sql`ALTER TABLE users ADD CONSTRAINT users_name_kinetic_key UNIQUE NULLS DISTINCT ("name")`.execute(db);',
					],
				},
				{
					priority: 3008,
					tableName: "users",
					type: "changeColumnName",
					up: [
						"await db.schema",
						'alterTable("users")',
						'renameColumn("name", "fullName")',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("users")',
						'renameColumn("fullName", "name")',
						"execute();",
					],
				},
				{
					priority: 4002,
					tableName: "users",
					type: "createConstraint",
					up: [
						'await sql`ALTER TABLE users ADD CONSTRAINT users_fullName_kinetic_key UNIQUE NULLS NOT DISTINCT ("fullName")`.execute(db);',
					],
					down: [
						"await sql`ALTER TABLE users DROP CONSTRAINT users_fullName_kinetic_key`.execute(db);",
					],
				},
			];

			expect(cs.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
		});

		test<DbContext>("change column name (not applied in remote) with unique constraints not applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users");
			await kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.execute();

			const users = pgTable("users", {
				columns: {
					fullName: text().renameFrom("name"),
				},
				constraints: [unique(["fullName"])],
			});

			const database = pgDatabase({
				tables: {
					users: users,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			const expected = [
				{
					priority: 3008,
					tableName: "users",
					type: "changeColumnName",
					up: [
						"await db.schema",
						'alterTable("users")',
						'renameColumn("name", "fullName")',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("users")',
						'renameColumn("fullName", "name")',
						"execute();",
					],
				},
				{
					priority: 4002,
					tableName: "users",
					type: "createConstraint",
					up: [
						'await sql`ALTER TABLE users ADD CONSTRAINT users_fullName_kinetic_key UNIQUE NULLS DISTINCT ("fullName")`.execute(db);',
					],
					down: [
						"await sql`ALTER TABLE users DROP CONSTRAINT users_fullName_kinetic_key`.execute(db);",
					],
				},
			];

			expect(cs.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
		});

		test<DbContext>("change column name (applied in remote) with unique constraints from previous name applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users");
			await kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addUniqueConstraint("users_name_kinetic_key", ["name"])
				.execute();

			await kysely.schema
				.alterTable("users")
				.renameColumn("name", "fullName")
				.execute();

			const users = pgTable("users", {
				columns: {
					fullName: text().renameFrom("name"),
				},
				constraints: [unique(["fullName"])],
			});

			const database = pgDatabase({
				tables: {
					users: users,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			expect(cs).toStrictEqual([]);
		});

		test<DbContext>("change column name (applied in remote) with unique constraints name applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users6");

			await kysely.schema
				.createTable("users6")
				.addColumn("fullName", "text")
				.addUniqueConstraint("usersh_fullName_kinetic_key", ["fullName"])
				.execute();

			const users = pgTable("users6", {
				columns: {
					fullName: text().renameFrom("name"),
				},
				constraints: [unique(["fullName"])],
			});

			const database = pgDatabase({
				tables: {
					users6: users,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			expect(cs).toStrictEqual([]);
		});

		test<DbContext>("change column name (not applied in remote) with primary key applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users_pk1");
			await kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.execute();

			await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_name_kinetic_pk PRIMARY KEY (\"name\")`.execute(
				kysely,
			);

			const users = pgTable("users_pk1", {
				columns: {
					fullName: text().renameFrom("name"),
				},
				constraints: [primaryKey(["fullName"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			const expected = [
				{
					priority: 1004,
					tableName: "users_pk1",
					type: "dropPrimaryKey",
					up: [
						"await sql`ALTER TABLE users_pk1 DROP CONSTRAINT users_pk1_name_kinetic_pk`.execute(db);",
					],
					down: [
						'await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_name_kinetic_pk PRIMARY KEY ("name")`.execute(db);',
					],
				},
				{
					priority: 3008,
					tableName: "users_pk1",
					type: "changeColumnName",
					up: [
						"await db.schema",
						'alterTable("users_pk1")',
						'renameColumn("name", "fullName")',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("users_pk1")',
						'renameColumn("fullName", "name")',
						"execute();",
					],
				},
				{
					priority: 4001,
					tableName: "users_pk1",
					type: "createPrimaryKey",
					up: [
						'await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_fullName_kinetic_pk PRIMARY KEY ("fullName")`.execute(db);',
					],
					down: [
						"await sql`ALTER TABLE users_pk1 DROP CONSTRAINT users_pk1_fullName_kinetic_pk`.execute(db);",
					],
				},
			];

			expect(cs.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
		});

		test<DbContext>("change column name (not applied in remote) with primary key not applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users_pk1");
			await kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.execute();

			const users = pgTable("users_pk1", {
				columns: {
					fullName: text().renameFrom("name"),
				},
				constraints: [primaryKey(["fullName"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			const expected = [
				{
					priority: 3008,
					tableName: "users_pk1",
					type: "changeColumnName",
					up: [
						"await db.schema",
						'alterTable("users_pk1")',
						'renameColumn("name", "fullName")',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("users_pk1")',
						'renameColumn("fullName", "name")',
						"execute();",
					],
				},
				{
					priority: 4001,
					tableName: "users_pk1",
					type: "createPrimaryKey",
					up: [
						'await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_fullName_kinetic_pk PRIMARY KEY ("fullName")`.execute(db);',
					],
					down: [
						"await sql`ALTER TABLE users_pk1 DROP CONSTRAINT users_pk1_fullName_kinetic_pk`.execute(db);",
					],
				},
			];

			expect(cs.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
		});

		test<DbContext>("change column name (applied in remote) with primary key from previous name applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users_pk1");
			await kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.execute();

			await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_name_kinetic_pk PRIMARY KEY (name)`.execute(
				kysely,
			);

			await kysely.schema
				.alterTable("users_pk1")
				.renameColumn("name", "fullName")
				.execute();

			const users = pgTable("users_pk1", {
				columns: {
					fullName: text().renameFrom("name"),
				},
				constraints: [primaryKey(["fullName"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			expect(cs).toStrictEqual([]);
		});

		test<DbContext>("change column name (applied in remote) with primary key name applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users_pk1");
			await kysely.schema
				.createTable("users_pk1")
				.addColumn("fullName", "text")
				.execute();

			await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_fullName_kinetic_pk PRIMARY KEY (\"fullName\")`.execute(
				kysely,
			);

			const users = pgTable("users_pk1", {
				columns: {
					fullName: text().renameFrom("name"),
				},
				constraints: [primaryKey(["fullName"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			expect(cs).toStrictEqual([]);
		});

		test<DbContext>("change column name (not applied in remote) with foreign key applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("books_fk1");
			tableNames.push("users_fk1");
			await kysely.schema
				.createTable("books_pk1")
				.addColumn("id", "integer")
				.addPrimaryKeyConstraint("books_pk1_id_kinetic_pk", ["id"])
				.execute();

			await kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.addForeignKeyConstraint(
					"users_pk1_book_id_books_pk1_id_kinetic_fk",
					["book_id"],
					"books_pk1",
					["id"],
				)
				.execute();

			const books = pgTable("books_pk1", {
				columns: {
					id: integer(),
				},
				constraints: [primaryKey(["id"])],
			});

			const users = pgTable("users_pk1", {
				columns: {
					name: text(),
					bookId: integer().renameFrom("book_id"),
				},
				constraints: [foreignKey(["bookId"], books, ["id"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
					books_pk1: books,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			const expected = [
				{
					priority: 1003,
					tableName: "users_pk1",
					type: "dropConstraint",
					up: [
						"await sql`ALTER TABLE users_pk1 DROP CONSTRAINT users_pk1_book_id_books_pk1_id_kinetic_fk`.execute(db);",
					],
					down: [
						'await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_book_id_books_pk1_id_kinetic_fk FOREIGN KEY ("book_id") REFERENCES books_pk1 ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`.execute(db);',
					],
				},
				{
					priority: 3008,
					tableName: "users_pk1",
					type: "changeColumnName",
					up: [
						"await db.schema",
						'alterTable("users_pk1")',
						'renameColumn("book_id", "bookId")',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("users_pk1")',
						'renameColumn("bookId", "book_id")',
						"execute();",
					],
				},
				{
					priority: 4002,
					tableName: "users_pk1",
					type: "createConstraint",
					up: [
						'await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_bookId_books_pk1_id_kinetic_fk FOREIGN KEY ("bookId") REFERENCES books_pk1 ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`.execute(db);',
					],
					down: [
						"await sql`ALTER TABLE users_pk1 DROP CONSTRAINT users_pk1_bookId_books_pk1_id_kinetic_fk`.execute(db);",
					],
				},
			];

			expect(cs.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
		});

		test<DbContext>("change column name (not applied in remote) with foreign key not applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("books_fk1");
			tableNames.push("users_fk1");
			await kysely.schema
				.createTable("books_pk1")
				.addColumn("id", "integer")
				.addPrimaryKeyConstraint("books_pk1_id_kinetic_pk", ["id"])
				.execute();

			await kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			const books = pgTable("books_pk1", {
				columns: {
					id: integer(),
				},
				constraints: [primaryKey(["id"])],
			});

			const users = pgTable("users_pk1", {
				columns: {
					name: text(),
					bookId: integer().renameFrom("book_id"),
				},
				constraints: [foreignKey(["bookId"], books, ["id"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
					books_pk1: books,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			const expected = [
				{
					priority: 3008,
					tableName: "users_pk1",
					type: "changeColumnName",
					up: [
						"await db.schema",
						'alterTable("users_pk1")',
						'renameColumn("book_id", "bookId")',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("users_pk1")',
						'renameColumn("bookId", "book_id")',
						"execute();",
					],
				},
				{
					priority: 4002,
					tableName: "users_pk1",
					type: "createConstraint",
					up: [
						'await sql`ALTER TABLE users_pk1 ADD CONSTRAINT users_pk1_bookId_books_pk1_id_kinetic_fk FOREIGN KEY ("bookId") REFERENCES books_pk1 ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`.execute(db);',
					],
					down: [
						"await sql`ALTER TABLE users_pk1 DROP CONSTRAINT users_pk1_bookId_books_pk1_id_kinetic_fk`.execute(db);",
					],
				},
			];

			expect(cs.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
		});

		test<DbContext>("change column name (applied in remote) with foreign key from previous name applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("books_fk1");
			tableNames.push("users_fk1");
			await kysely.schema
				.createTable("books_pk1")
				.addColumn("id", "integer")
				.addPrimaryKeyConstraint("books_pk1_id_kinetic_pk", ["id"])
				.execute();

			await kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.addForeignKeyConstraint(
					"users_pk1_book_id_books_pk1_id_kinetic_fk",
					["book_id"],
					"books_pk1",
					["id"],
				)
				.execute();

			await kysely.schema
				.alterTable("users_pk1")
				.renameColumn("book_id", "bookId")
				.execute();

			const books = pgTable("books_pk1", {
				columns: {
					id: integer(),
				},
				constraints: [primaryKey(["id"])],
			});

			const users = pgTable("users_pk1", {
				columns: {
					name: text(),
					bookId: integer().renameFrom("book_id"),
				},
				constraints: [foreignKey(["bookId"], books, ["id"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
					books_pk1: books,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);

			expect(cs).toStrictEqual([]);
		});

		test<DbContext>("change column name (applied in remote) with foreign key name applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("books_fk1");
			tableNames.push("users_fk1");
			await kysely.schema
				.createTable("books_pk1")
				.addColumn("id", "integer")
				.addPrimaryKeyConstraint("books_pk1_id_kinetic_pk", ["id"])
				.execute();

			await kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("bookId", "integer")
				.addForeignKeyConstraint(
					"users_pk1_book_id_books_pk1_id_kinetic_fk",
					["bookId"],
					"books_pk1",
					["id"],
				)
				.execute();

			const books = pgTable("books_pk1", {
				columns: {
					id: integer(),
				},
				constraints: [primaryKey(["id"])],
			});

			const users = pgTable("users_pk1", {
				columns: {
					name: text(),
					bookId: integer().renameFrom("book_id"),
				},
				constraints: [foreignKey(["bookId"], books, ["id"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
					books_pk1: books,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);

			expect(cs).toStrictEqual([]);
		});

		test<DbContext>("change column name (not applied in remote) with indexes applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users_fk1");

			await kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			await kysely.schema
				.createIndex("users_pk1_book_id_kntc_idx")
				.on("users_pk1")
				.columns(["book_id"])
				.execute();

			await sql`COMMENT ON INDEX users_pk1_book_id_kntc_idx IS 'abcd'`.execute(
				kysely,
			);

			const users = pgTable("users_pk1", {
				columns: {
					name: text(),
					bookId: integer().renameFrom("book_id"),
				},
				indexes: [index(["bookId"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			const expected = [
				{
					priority: 1002,
					tableName: "users_pk1",
					type: "dropIndex",
					up: [
						'await db.schema.dropIndex("users_pk1_book_id_kntc_idx").execute();',
					],
					down: [
						"await sql`CREATE INDEX users_pk1_book_id_kntc_idx ON public.users_pk1 USING btree (book_id);COMMENT ON INDEX users_pk1_book_id_kntc_idx IS 'abcd'`.execute(db);",
					],
				},
				{
					priority: 3008,
					tableName: "users_pk1",
					type: "changeColumnName",
					up: [
						"await db.schema",
						'alterTable("users_pk1")',
						'renameColumn("book_id", "bookId")',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("users_pk1")',
						'renameColumn("bookId", "book_id")',
						"execute();",
					],
				},
				{
					priority: 4003,
					tableName: "users_pk1",
					type: "createIndex",
					up: [
						'await sql`create index "users_pk1_bookId_kntc_idx" on "users_pk1" ("bookId");COMMENT ON INDEX users_pk1_bookId_kntc_idx IS \'760bce2553cad9e0e6cd7f0a18b3e369ac3ab110c7832c2b3f72d94b2e42d5fb\'`.execute(db);',
					],
					down: [
						'await db.schema.dropIndex("users_pk1_bookId_kntc_idx").execute();',
					],
				},
			];

			expect(cs.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
		});

		test<DbContext>("change column name (not applied in remote) with indexes not applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users_fk1");

			await kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			const users = pgTable("users_pk1", {
				columns: {
					name: text(),
					bookId: integer().renameFrom("book_id"),
				},
				indexes: [index(["bookId"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			const expected = [
				{
					priority: 3008,
					tableName: "users_pk1",
					type: "changeColumnName",
					up: [
						"await db.schema",
						'alterTable("users_pk1")',
						'renameColumn("book_id", "bookId")',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("users_pk1")',
						'renameColumn("bookId", "book_id")',
						"execute();",
					],
				},
				{
					priority: 4003,
					tableName: "users_pk1",
					type: "createIndex",
					up: [
						'await sql`create index "users_pk1_bookId_kntc_idx" on "users_pk1" ("bookId");COMMENT ON INDEX users_pk1_bookId_kntc_idx IS \'760bce2553cad9e0e6cd7f0a18b3e369ac3ab110c7832c2b3f72d94b2e42d5fb\'`.execute(db);',
					],
					down: [
						'await db.schema.dropIndex("users_pk1_bookId_kntc_idx").execute();',
					],
				},
			];

			expect(cs.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
		});

		test<DbContext>("change column name (applied in remote) with indexes from previous name applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users_fk1");

			await kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			await kysely.schema
				.createIndex("users_pk1_book_id_kntc_idx")
				.on("users_pk1")
				.columns(["book_id"])
				.execute();

			await sql`COMMENT ON INDEX users_pk1_book_id_kntc_idx IS 'abcd'`.execute(
				kysely,
			);

			await kysely.schema
				.alterTable("users_pk1")
				.renameColumn("book_id", "bookId")
				.execute();

			const users = pgTable("users_pk1", {
				columns: {
					name: text(),
					bookId: integer().renameFrom("book_id"),
				},
				indexes: [index(["bookId"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			const expected = [
				{
					priority: 1002,
					tableName: "users_pk1",
					type: "dropIndex",
					up: [
						'await db.schema.dropIndex("users_pk1_book_id_kntc_idx").execute();',
					],
					down: [
						"await sql`CREATE INDEX users_pk1_book_id_kntc_idx ON public.users_pk1 USING btree (\"bookId\");COMMENT ON INDEX users_pk1_book_id_kntc_idx IS 'abcd'`.execute(db);",
					],
				},
				{
					priority: 4003,
					tableName: "users_pk1",
					type: "createIndex",
					up: [
						'await sql`create index "users_pk1_bookId_kntc_idx" on "users_pk1" ("bookId");COMMENT ON INDEX users_pk1_bookId_kntc_idx IS \'760bce2553cad9e0e6cd7f0a18b3e369ac3ab110c7832c2b3f72d94b2e42d5fb\'`.execute(db);',
					],
					down: [
						'await db.schema.dropIndex("users_pk1_bookId_kntc_idx").execute();',
					],
				},
			];

			expect(cs.sort((a, b) => a.priority - b.priority)).toStrictEqual(
				expected.sort((a, b) => a.priority - b.priority),
			);
		});

		test<DbContext>("change column name (applied in remote) with indexes name applied", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users_fk1");

			await kysely.schema
				.createTable("users_pk1")
				.addColumn("name", "text")
				.addColumn("book_id", "integer")
				.execute();

			await kysely.schema
				.alterTable("users_pk1")
				.renameColumn("book_id", "bookId")
				.execute();

			await kysely.schema
				.createIndex("users_pk1_bookId_kntc_idx")
				.on("users_pk1")
				.columns(["bookId"])
				.execute();

			await sql`COMMENT ON INDEX "users_pk1_bookId_kntc_idx" IS '760bce2553cad9e0e6cd7f0a18b3e369ac3ab110c7832c2b3f72d94b2e42d5fb'`.execute(
				kysely,
			);

			const users = pgTable("users_pk1", {
				columns: {
					name: text(),
					bookId: integer().renameFrom("book_id"),
				},
				indexes: [index(["bookId"])],
			});

			const database = pgDatabase({
				tables: {
					users_pk1: users,
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);

			expect(cs).toStrictEqual([]);
		});

		test<DbContext>("change column name (applied in remote)", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("users");
			await kysely.schema
				.createTable("users")
				.addColumn("fullName", "text")
				.execute();

			const database = pgDatabase({
				tables: {
					users: pgTable("users", {
						columns: {
							fullName: text().renameFrom("name"),
						},
					}),
				},
			});

			const remote = await remoteSchema(kysely);
			if (remote.status === ActionStatus.Error) {
				throw remote.error;
			}

			const local = localSchema(database, remote.result);
			const cs = changeset(local, remote.result);
			expect(cs).toStrictEqual([]);
		});
	});
});
