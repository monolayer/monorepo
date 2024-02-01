import { describe, expect, test } from "vitest";
import { dbChangeset } from "~/database/changeset.js";
import { pgIndex } from "~/database/schema/indexes.js";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { compileIndex } from "~tests/helpers/indexes.js";

describe("#dbChangeset", () => {
	test("create a table", () => {
		const changeset = dbChangeset(
			{
				columns: {
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
				indexes: {
					books: {
						...compileIndex(
							pgIndex("books_name_idx", (idx) => idx.column("name")),
							"books",
						),
					},
				},
			},
			{
				columns: {},
				indexes: {},
			},
		);

		const expected = {
			members: [
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
			],
			books: [
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
					priority: 4,
					tableName: "books",
					type: "createIndex",
					up: [
						'await sql`create index "books_name_idx" on "books" ("name")`.execute(db);',
					],
					down: [],
				},
			],
		};
		expect(changeset).toStrictEqual(expected);
	});

	test("drop a table", () => {
		const changeset = dbChangeset(
			{
				columns: {},
				indexes: {},
			},
			{
				columns: {
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
				indexes: {
					shops: {
						shops_mail_idx:
							'create unique index "shops_mail_idx" on "shops" using btree ("email")',
						shops_city_idx:
							'create unique index "shops_city_idx" on "shops" using btree ("city")',
					},
				},
			},
		);

		const expected = {
			shops: [
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
			],
		};
		expect(changeset).toStrictEqual(expected);
	});

	test("change a table", () => {
		const changeset = dbChangeset(
			{
				columns: {
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
				indexes: {
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
				columns: {
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
				indexes: {
					addresses: {
						addresses_city_idx:
							'create unique index "addresses_city_idx" on "addresses" using btree ("city")',
						addresses_country_idx:
							'create unique index "addresses_country_idx" on "addresses" using btree ("country")',
					},
				},
			},
		);

		const expected = {
			samples: [
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
					tableName: "samples",
					priority: 4,
					type: "createIndex",
					up: [
						'await sql`create index "samples_name_idx" on "samples" ("name")`.execute(db);',
					],
					down: ['await db.schema.dropIndex("samples_name_idx").execute();'],
				},
			],
			addresses: [
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
			],
		};
		expect(changeset).toStrictEqual(expected);
	});

	describe("foreign keys", () => {
		test("on table creation", () => {
			const changeset = dbChangeset(
				{
					columns: {
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
					indexes: {},
				},
				{
					columns: {},
					indexes: {},
				},
			);
			const expected = {
				members: [
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
				],
				books: [
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
				],
			};
			expect(changeset).toStrictEqual(expected);
		});
		test("on column creation", () => {
			const changeset = dbChangeset(
				{
					columns: {
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
					indexes: {},
				},
				{
					columns: {
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
					indexes: {},
				},
			);
			const expected = {
				members: [
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
				],
			};
			expect(changeset).toStrictEqual(expected);
		});

		test("on column change (add)", () => {
			const changeset = dbChangeset(
				{
					columns: {
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
					indexes: {},
				},
				{
					columns: {
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
					indexes: {},
				},
			);
			const expected = {
				members: [
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
				],
			};
			expect(changeset).toStrictEqual(expected);
		});

		test("on column change (remove)", () => {
			const changeset = dbChangeset(
				{
					columns: {
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
					indexes: {},
				},
				{
					columns: {
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
					indexes: {},
				},
			);
			const expected = {
				members: [
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
				],
			};
			expect(changeset).toStrictEqual(expected);
		});
	});
});
