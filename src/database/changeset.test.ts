import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { env } from "process";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ActionStatus } from "~/cli/command.js";
import { changeset } from "~/database/changeset.js";
import { dropTables } from "~tests/helpers/dropTables.js";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { type DbContext, globalPool } from "~tests/setup.js";
import { localSchema } from "./introspection/local_schema.js";
import { remoteSchema } from "./introspection/remote_schema.js";
import { ColumnIdentity, text } from "./schema/pg_column.js";
import { pgDatabase } from "./schema/pg_database.js";
import { pgTable } from "./schema/pg_table.js";

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

	describe("indexes", () => {
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
						'await sql`create unique index "shops_email_kntc_idx" on "shops" using btree ("email");COMMENT ON INDEX "shops_email_kntc_idx" IS \'abcd\'`.execute(db);',
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
						'await sql`create unique index "shops_city_kntc_idx" on "shops" using btree ("city");COMMENT ON INDEX "shops_city_kntc_idx" IS \'1234\'`.execute(db);',
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
						'await sql`create unique index "shops_email_kntc_idx" on "shops" using btree ("email");COMMENT ON INDEX "shops_email_kntc_idx" IS \'abcd\'`.execute(db);',
					],
				},
				{
					tableName: "shops",
					priority: 1002,
					type: "dropIndex",
					up: ['await db.schema.dropIndex("shops_city_kntc_idx").execute();'],
					down: [
						'await sql`create unique index "shops_city_kntc_idx" on "shops" using btree ("city");COMMENT ON INDEX "shops_city_kntc_idx" IS \'1234\'`.execute(db);',
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
						'await sql`DROP INDEX shops_email_kntc_idx;create unique index "shops_email_kntc_idx" on "shops" using hash ("email");COMMENT ON INDEX "shops_email_kntc_idx" IS \'abcde\'`.execute(db);',
					],
					down: [
						'await sql`DROP INDEX shops_email_kntc_idx;create unique index "shops_email_kntc_idx" on "shops" using btree ("email");COMMENT ON INDEX "shops_email_kntc_idx" IS \'abcd\'`.execute(db);',
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

	describe("primary key changes", () => {
		beforeEach<DbContext>(async (context) => {
			const pool = globalPool();
			await pool.query("DROP DATABASE IF EXISTS test_primary_key_change");
			await pool.query("CREATE DATABASE test_primary_key_change");
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			context.kysely = new Kysely<any>({
				dialect: new PostgresDialect({
					pool: new pg.Pool({
						connectionString: `${env.POSTGRES_URL}/test_primary_key_change?schema=public`,
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
			await pool.query("DROP DATABASE IF EXISTS test_primary_key_change");
		});

		test<DbContext>("change a primary key drops not null on affected columns", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("test_primary_key_change");
			await kysely.schema
				.createTable("test_primary_key_change")
				.addColumn("email", "text")
				.addColumn("name", "text")
				.execute();

			await sql`ALTER TABLE test_primary_key_change ADD CONSTRAINT test_primary_key_change_name_kinetic_pk PRIMARY KEY (\"name\")`.execute(
				kysely,
			);

			const database = pgDatabase({
				tables: {
					test_primary_key_change: pgTable("test_primary_key_change", {
						columns: {
							name: text(),
							email: text(),
						},
						primaryKey: ["email"],
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
					priority: 1004,
					tableName: "test_primary_key_change",
					type: "dropPrimaryKey",
					up: [
						'await sql`ALTER TABLE test_primary_key_change DROP CONSTRAINT test_primary_key_change_name_kinetic_pk, ALTER COLUMN "name" DROP NOT NULL`.execute(db);',
					],
					down: [
						'await sql`ALTER TABLE test_primary_key_change ADD CONSTRAINT test_primary_key_change_name_kinetic_pk PRIMARY KEY ("name")`.execute(db);',
					],
				},
				{
					priority: 4001,
					tableName: "test_primary_key_change",
					type: "createPrimaryKey",
					up: [
						'await sql`ALTER TABLE test_primary_key_change ADD CONSTRAINT test_primary_key_change_email_kinetic_pk PRIMARY KEY ("email")`.execute(db);',
					],
					down: [
						'await sql`ALTER TABLE test_primary_key_change DROP CONSTRAINT test_primary_key_change_email_kinetic_pk, ALTER COLUMN "email" DROP NOT NULL`.execute(db);',
					],
				},
			];
			expect(cs).toStrictEqual(expected);
		});

		test<DbContext>("change a primary key and notNull on affected columns does not remove not null constraint", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("test_primary_key_change");
			await kysely.schema
				.createTable("test_primary_key_change")
				.addColumn("email", "text")
				.addColumn("name", "text")
				.execute();

			await sql`ALTER TABLE test_primary_key_change ADD CONSTRAINT test_primary_key_change_name_kinetic_pk PRIMARY KEY (\"name\")`.execute(
				kysely,
			);

			const database = pgDatabase({
				tables: {
					test_primary_key_change: pgTable("test_primary_key_change", {
						columns: {
							name: text().notNull(),
							email: text(),
						},
						primaryKey: ["email"],
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
					priority: 1004,
					tableName: "test_primary_key_change",
					type: "dropPrimaryKey",
					up: [
						"await sql`ALTER TABLE test_primary_key_change DROP CONSTRAINT test_primary_key_change_name_kinetic_pk`.execute(db);",
					],
					down: [
						'await sql`ALTER TABLE test_primary_key_change ADD CONSTRAINT test_primary_key_change_name_kinetic_pk PRIMARY KEY ("name")`.execute(db);',
					],
				},
				{
					priority: 4001,
					tableName: "test_primary_key_change",
					type: "createPrimaryKey",
					up: [
						'await sql`ALTER TABLE test_primary_key_change ADD CONSTRAINT test_primary_key_change_email_kinetic_pk PRIMARY KEY ("email")`.execute(db);',
					],
					down: [
						'await sql`ALTER TABLE test_primary_key_change DROP CONSTRAINT test_primary_key_change_email_kinetic_pk, ALTER COLUMN "email" DROP NOT NULL`.execute(db);',
					],
				},
			];
			expect(cs).toStrictEqual(expected);
		});

		test<DbContext>("change a primary key drops not null on affected columns with eplicit notNull in new primary key", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("test_primary_key_change");
			await kysely.schema
				.createTable("test_primary_key_change")
				.addColumn("email", "text")
				.addColumn("name", "text")
				.execute();

			await sql`ALTER TABLE test_primary_key_change ADD CONSTRAINT test_primary_key_change_name_kinetic_pk PRIMARY KEY (\"name\")`.execute(
				kysely,
			);

			const database = pgDatabase({
				tables: {
					test_primary_key_change: pgTable("test_primary_key_change", {
						columns: {
							name: text(),
							email: text().notNull(),
						},
						primaryKey: ["email"],
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
					priority: 1004,
					tableName: "test_primary_key_change",
					type: "dropPrimaryKey",
					up: [
						'await sql`ALTER TABLE test_primary_key_change DROP CONSTRAINT test_primary_key_change_name_kinetic_pk, ALTER COLUMN "name" DROP NOT NULL`.execute(db);',
					],
					down: [
						'await sql`ALTER TABLE test_primary_key_change ADD CONSTRAINT test_primary_key_change_name_kinetic_pk PRIMARY KEY ("name")`.execute(db);',
					],
				},
				{
					priority: 3008,
					tableName: "test_primary_key_change",
					type: "changeColumn",
					up: [
						"await db.schema",
						'alterTable("test_primary_key_change")',
						'alterColumn("email", (col) => col.setNotNull())',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("test_primary_key_change")',
						'alterColumn("email", (col) => col.dropNotNull())',
						"execute();",
					],
				},
				{
					priority: 4001,
					tableName: "test_primary_key_change",
					type: "createPrimaryKey",
					up: [
						'await sql`ALTER TABLE test_primary_key_change ADD CONSTRAINT test_primary_key_change_email_kinetic_pk PRIMARY KEY ("email")`.execute(db);',
					],
					down: [
						"await sql`ALTER TABLE test_primary_key_change DROP CONSTRAINT test_primary_key_change_email_kinetic_pk`.execute(db);",
					],
				},
			];
			expect(cs).toStrictEqual(expected);
		});
	});
});
