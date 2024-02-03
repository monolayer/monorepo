import { describe, expect, test } from "vitest";
import { changeset } from "~/database/changeset.js";
import { pgIndex } from "~/database/schema/pg_index.js";
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
							primaryKey: true,
						}),
						name: columnInfoFactory({
							tableName: "books",
							columnName: "name",
							dataType: "text",
						}),
					},
					members: {
						name: columnInfoFactory({
							tableName: "members",
							columnName: "name",
							dataType: "varchar",
							defaultValue: "hello",
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
					books: {
						...compileIndex(
							pgIndex("books_name_idx", (idx) => idx.column("name")),
							"books",
						),
					},
				},
			},
			{
				table: {},
				index: {},
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
					'addColumn("id", "serial", (col) => col.primaryKey())',
					'addColumn("name", "text")',
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
					'addColumn("name", "varchar", (col) => col.defaultTo("hello"))',
					'addColumn("email", "varchar(255)")',
					'addColumn("city", "text", (col) => col.notNull())',
					"execute();",
				],
				down: ["await db.schema", 'dropTable("members")', "execute();"],
			},
			{
				priority: 4,
				tableName: "books",
				type: "createIndex",
				up: [
					'await sql`create index "books_name_idx" on "books" ("name")`.execute(db);',
				],
				down: [],
			},
		];
		expect(cset).toStrictEqual(expected);
	});

	test("drop a table", () => {
		const cset = changeset(
			{
				table: {},
				index: {},
			},
			{
				table: {
					shops: {
						name: columnInfoFactory({
							tableName: "members",
							columnName: "name",
							dataType: "varchar",
							defaultValue: "hello",
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
						shops_mail_idx:
							'create unique index "shops_mail_idx" on "shops" using btree ("email")',
						shops_city_idx:
							'create unique index "shops_city_idx" on "shops" using btree ("city")',
					},
				},
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
					'addColumn("name", "varchar", (col) => col.defaultTo("hello"))',
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
					'await sql`create unique index "shops_mail_idx" on "shops" using btree ("email")`.execute(db);',
				],
			},
			{
				tableName: "shops",
				priority: 4,
				type: "dropIndex",
				up: [],
				down: [
					'await sql`create unique index "shops_city_idx" on "shops" using btree ("city")`.execute(db);',
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
							primaryKey: true,
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
							primaryKey: true,
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
							defaultValue: "hello",
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
				index: {
					samples: {
						...compileIndex(
							pgIndex("samples_name_idx", (idx) => idx.column("name")),
							"samples",
						),
					},
					addresses: {
						...compileIndex(
							pgIndex("addresses_city_idx", (idx) =>
								idx.column("city").using("btree").unique(),
							),
							"addresses",
						),
						...compileIndex(
							pgIndex("addresses_city_and_country_idx", (idx) =>
								idx.columns(["city", "country"]).using("btree").unique(),
							),
							"addresses",
						),
					},
				},
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
							defaultValue: "bcn",
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
							primaryKey: true,
						}),
					},
				},
				index: {
					addresses: {
						addresses_city_idx:
							'create unique index "addresses_city_idx" on "addresses" using btree ("city")',
						addresses_country_idx:
							'create unique index "addresses_country_idx" on "addresses" using btree ("country")',
					},
				},
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
					'addColumn("id", "serial", (col) => col.primaryKey())',
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
					'alterColumn("name", (col) => col.setDefault("hello"))',
					"execute();",
				],
				down: [
					"await db.schema",
					'alterTable("addresses")',
					'alterColumn("name", (col) => col.dropDefault())',
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
					'alterColumn("city", (col) => col.dropDefault())',
					"execute();",
				],
				down: [
					"await db.schema",
					'alterTable("addresses")',
					'alterColumn("city", (col) => col.setDefault("bcn"))',
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
			{
				tableName: "samples",
				priority: 3.2,
				type: "changeColumn",
				up: [
					"await db.schema",
					'alterTable("samples")',
					'dropConstraint("samples_pk")',
					"execute();",
				],
				down: [
					"await db.schema",
					'alterTable("samples")',
					'alterColumn("name", (col) => col.primaryKey())',
					"execute();",
				],
			},
			{
				tableName: "samples",
				priority: 3.3,
				type: "changeColumn",
				up: [
					"await db.schema",
					'alterTable("samples")',
					'alterColumn("id", (col) => col.primaryKey())',
					"execute();",
				],
				down: [
					"await db.schema",
					'alterTable("samples")',
					'dropConstraint("samples_pk")',
					"execute();",
				],
			},
			{
				tableName: "addresses",
				type: "dropIndex",
				priority: 4,
				up: ['await db.schema.dropIndex("addresses_country_idx").execute();'],
				down: [
					'await sql`create unique index "addresses_country_idx" on "addresses" using btree ("country")`.execute(db);',
				],
			},
			{
				tableName: "addresses",
				priority: 4,
				type: "createIndex",
				up: [
					'await sql`create unique index "addresses_city_and_country_idx" on "addresses" using btree ("city", "country")`.execute(db);',
				],
				down: [
					'await db.schema.dropIndex("addresses_city_and_country_idx").execute();',
				],
			},
			{
				tableName: "samples",
				priority: 4,
				type: "createIndex",
				up: [
					'await sql`create index "samples_name_idx" on "samples" ("name")`.execute(db);',
				],
				down: ['await db.schema.dropIndex("samples_name_idx").execute();'],
			},
		];
		expect(cset).toStrictEqual(expected);
	});

	describe("foreign keys", () => {
		test("on table creation", () => {
			const cset = changeset(
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "serial",
								primaryKey: true,
							}),
						},
						members: {
							name: columnInfoFactory({
								tableName: "members",
								columnName: "name",
								dataType: "varchar",
								defaultValue: "hello",
							}),
							book_id: columnInfoFactory({
								tableName: "members",
								columnName: "book_id",
								dataType: "integer",
								foreignKeyConstraint: {
									table: "books",
									column: "id",
								},
							}),
						},
					},
					index: {},
				},
				{
					table: {},
					index: {},
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
						'addColumn("id", "serial", (col) => col.primaryKey())',
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
						'addColumn("name", "varchar", (col) => col.defaultTo("hello"))',
						'addColumn("book_id", "integer")',
						'.addForeignKeyConstraint("members_book_id_fkey", ["book_id"], "books", ["id"])',
						"execute();",
					],
					down: ["await db.schema", 'dropTable("members")', "execute();"],
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
								dataType: "serial",
								primaryKey: true,
							}),
						},
						members: {
							name: columnInfoFactory({
								tableName: "members",
								columnName: "name",
								dataType: "varchar",
								defaultValue: "hello",
							}),
							book_id: columnInfoFactory({
								tableName: "members",
								columnName: "book_id",
								dataType: "integer",
								foreignKeyConstraint: {
									table: "books",
									column: "id",
								},
							}),
						},
					},
					index: {},
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "serial",
								primaryKey: true,
							}),
						},
						members: {
							name: columnInfoFactory({
								tableName: "members",
								columnName: "name",
								dataType: "varchar",
								defaultValue: "hello",
							}),
						},
					},
					index: {},
				},
			);
			const expected = [
				{
					tableName: "members",
					priority: 2,
					type: "createColumn",
					up: [
						"await db.schema",
						'alterTable("members")',
						'addColumn("book_id", "integer")',
						'.addForeignKeyConstraint("members_book_id_fkey", ["book_id"], "books", ["id"])',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("members")',
						'dropColumn("book_id")',
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
								dataType: "serial",
								primaryKey: true,
							}),
						},
						members: {
							name: columnInfoFactory({
								tableName: "members",
								columnName: "name",
								dataType: "varchar",
								defaultValue: "hello",
							}),
							book_id: columnInfoFactory({
								tableName: "members",
								columnName: "book_id",
								dataType: "integer",
								foreignKeyConstraint: {
									table: "books",
									column: "id",
								},
							}),
						},
					},
					index: {},
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "serial",
								primaryKey: true,
							}),
						},
						members: {
							name: columnInfoFactory({
								tableName: "members",
								columnName: "name",
								dataType: "varchar",
								defaultValue: "hello",
							}),
							book_id: columnInfoFactory({
								tableName: "members",
								columnName: "book_id",
								dataType: "integer",
							}),
						},
					},
					index: {},
				},
			);
			const expected = [
				{
					tableName: "members",
					priority: 3.4,
					type: "changeColumn",
					up: [
						"await db.schema",
						'alterTable("members")',
						'.addForeignKeyConstraint("members_book_id_fkey", ["book_id"], "books", ["id"])',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("members")',
						'.dropConstraint("members_book_id_fkey")',
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
								dataType: "serial",
								primaryKey: true,
							}),
						},
						members: {
							name: columnInfoFactory({
								tableName: "members",
								columnName: "name",
								dataType: "varchar",
								defaultValue: "hello",
							}),
							book_id: columnInfoFactory({
								tableName: "members",
								columnName: "book_id",
								dataType: "integer",
							}),
						},
					},
					index: {},
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "serial",
								primaryKey: true,
							}),
						},
						members: {
							name: columnInfoFactory({
								tableName: "members",
								columnName: "name",
								dataType: "varchar",
								defaultValue: "hello",
							}),
							book_id: columnInfoFactory({
								tableName: "members",
								columnName: "book_id",
								dataType: "integer",
								foreignKeyConstraint: {
									table: "books",
									column: "id",
								},
							}),
						},
					},
					index: {},
				},
			);
			const expected = [
				{
					tableName: "members",
					priority: 3.41,
					type: "changeColumn",
					up: [
						"await db.schema",
						'alterTable("members")',
						'.dropConstraint("members_book_id_fkey")',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("members")',
						'.addForeignKeyConstraint("members_book_id_fkey", ["book_id"], "books", ["id"])',
						"execute();",
					],
				},
			];
			expect(cset).toStrictEqual(expected);
		});
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
								primaryKey: true,
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
				},
				{
					table: {},
					index: {},
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
						'addColumn("id", "integer", (col) => col.primaryKey().generatedByDefaultAsIdentity())',
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
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
								primaryKey: true,
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
						'addColumn("id", "integer", (col) => col.primaryKey().generatedByDefaultAsIdentity())',
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
								primaryKey: true,
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
				},
				{
					table: {
						books: {},
						members: {},
					},
					index: {},
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
						'addColumn("id", "integer", (col) => col.primaryKey().generatedByDefaultAsIdentity())',
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
								primaryKey: true,
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
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
								primaryKey: true,
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
								primaryKey: true,
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
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
								primaryKey: true,
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
				},
				{
					table: {
						books: {
							id: columnInfoFactory({
								tableName: "books",
								columnName: "id",
								dataType: "integer",
								primaryKey: true,
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
						'addColumn("id", "integer", (col) => col.primaryKey().generatedByDefaultAsIdentity())',
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
});
