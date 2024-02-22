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
});
