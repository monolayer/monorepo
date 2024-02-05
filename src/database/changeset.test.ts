import { sql } from "kysely";
import { describe, expect, test } from "vitest";
import { changeset } from "~/database/changeset.js";
import { pgIndex } from "~/database/schema/pg_index.js";
import { ColumnIdentity, ColumnUnique } from "~/index.js";
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
								defaultValue: sql`hello`,
							}),
							book_id: columnInfoFactory({
								tableName: "members",
								columnName: "book_id",
								dataType: "integer",
								foreignKeyConstraint: {
									table: "books",
									column: "id",
									options: "no action;no action",
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
						'addColumn("name", "varchar", (col) => col.defaultTo(sql`hello`))',
						'addColumn("book_id", "integer")',
						'.addForeignKeyConstraint("members_book_id_fkey", ["book_id"], "books", ["id"], (cb) => cb.onDelete("no action").onUpdate("no action"))',
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
									options: "no action;no action",
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
						'.addForeignKeyConstraint("members_book_id_fkey", ["book_id"], "books", ["id"], (cb) => cb.onDelete("no action").onUpdate("no action"))',
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
									options: "no action;no action",
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
									options: "no action;no action",
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

		test("on column change (option change)", () => {
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
							book_id: columnInfoFactory({
								tableName: "members",
								columnName: "book_id",
								dataType: "integer",
								foreignKeyConstraint: {
									table: "books",
									column: "id",
									options: "cascade;restrict",
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
							book_id: columnInfoFactory({
								tableName: "members",
								columnName: "book_id",
								dataType: "integer",
								foreignKeyConstraint: {
									table: "books",
									column: "id",
									options: "no action;cascade",
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
					priority: 3.42,
					type: "changeColumn",
					up: [
						[
							"await sql`",
							[
								"ALTER TABLE members DROP CONSTRAINT members_book_id_fkey",
								"ALTER TABLE members ADD CONSTRAINT members_book_id_fkey FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE cascade ON UPDATE restrict",
							].join(", "),
							"`.execute(db);",
						].join(""),
					],
					down: [
						[
							"await sql`",
							[
								"ALTER TABLE members DROP CONSTRAINT members_book_id_fkey",
								"ALTER TABLE members ADD CONSTRAINT members_book_id_fkey FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE no action ON UPDATE cascade",
							].join(", "),
							"`.execute(db);",
						].join(""),
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

	describe("unique columns", () => {
		test("on table creation", () => {
			const cset = changeset(
				{
					table: {
						books: {
							unNullD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullD",
								dataType: "integer",
								unique: ColumnUnique.NullsDistinct,
							}),
							unNullNotD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullNotD",
								dataType: "integer",
								unique: ColumnUnique.NullsNotDistinct,
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
						'addColumn("unNullD", "integer", (col) => col.unique())',
						'addColumn("unNullNotD", "integer", (col) => col.unique().nullsNotDistinct())',
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
				},
				{
					table: {
						books: {
							unNullD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullD",
								dataType: "integer",
								unique: ColumnUnique.NullsDistinct,
							}),
							unNullNotD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullNotD",
								dataType: "integer",
								unique: ColumnUnique.NullsNotDistinct,
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
						'addColumn("unNullD", "integer", (col) => col.unique())',
						'addColumn("unNullNotD", "integer", (col) => col.unique().nullsNotDistinct())',
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
							unNullD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullD",
								dataType: "integer",
								unique: ColumnUnique.NullsDistinct,
							}),
							unNullNotD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullNotD",
								dataType: "integer",
								unique: ColumnUnique.NullsNotDistinct,
							}),
						},
					},
					index: {},
				},
				{
					table: {
						books: {},
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
						'addColumn("unNullD", "integer", (col) => col.unique())',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("books")',
						'dropColumn("unNullD")',
						"execute();",
					],
				},
				{
					tableName: "books",
					priority: 2,
					type: "createColumn",
					up: [
						"await db.schema",
						'alterTable("books")',
						'addColumn("unNullNotD", "integer", (col) => col.unique().nullsNotDistinct())',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("books")',
						'dropColumn("unNullNotD")',
						"execute();",
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
					},
					index: {},
				},
				{
					table: {
						books: {
							unNullD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullD",
								dataType: "integer",
								unique: ColumnUnique.NullsDistinct,
							}),
							unNullNotD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullNotD",
								dataType: "integer",
								unique: ColumnUnique.NullsNotDistinct,
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
						'dropColumn("unNullD")',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("books")',
						'addColumn("unNullD", "integer", (col) => col.unique())',
						"execute();",
					],
				},
				{
					tableName: "books",
					priority: 2,
					type: "dropColumn",
					up: [
						"await db.schema",
						'alterTable("books")',
						'dropColumn("unNullNotD")',
						"execute();",
					],
					down: [
						"await db.schema",
						'alterTable("books")',
						'addColumn("unNullNotD", "integer", (col) => col.unique().nullsNotDistinct())',
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
							unNullD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullD",
								dataType: "integer",
								unique: ColumnUnique.NullsDistinct,
							}),
							unNullNotD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullNotD",
								dataType: "integer",
								unique: ColumnUnique.NullsNotDistinct,
							}),
						},
					},
					index: {},
				},
				{
					table: {
						books: {
							unNullD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullD",
								dataType: "integer",
							}),
							unNullNotD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullNotD",
								dataType: "integer",
							}),
						},
					},
					index: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					priority: 3.6,
					type: "changeColumn",
					up: [
						"await sql`ALTER TABLE books ALTER COLUMN unNullD ADD CONSTRAINT books_unNullD_key UNIQUE (unNullD)`.execute(db);",
					],
					down: [
						"await sql`ALTER TABLE books ALTER COLUMN unNullD DROP CONSTRAINT books_unNullD_key`.execute(db);",
					],
				},
				{
					tableName: "books",
					priority: 3.6,
					type: "changeColumn",
					up: [
						"await sql`ALTER TABLE books ALTER COLUMN unNullNotD ADD CONSTRAINT books_unNullNotD_key UNIQUE NULLS NOT DISTINCT (unNullNotD)`.execute(db);",
					],
					down: [
						"await sql`ALTER TABLE books ALTER COLUMN unNullNotD DROP CONSTRAINT books_unNullNotD_key`.execute(db);",
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
							unNullD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullD",
								dataType: "integer",
							}),
							unNullNotD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullNotD",
								dataType: "integer",
							}),
						},
					},
					index: {},
				},
				{
					table: {
						books: {
							unNullD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullD",
								dataType: "integer",
								unique: ColumnUnique.NullsDistinct,
							}),
							unNullNotD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullNotD",
								dataType: "integer",
								unique: ColumnUnique.NullsNotDistinct,
							}),
						},
					},
					index: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					priority: 3.61,
					type: "changeColumn",
					up: [
						"await sql`ALTER TABLE books ALTER COLUMN unNullD DROP CONSTRAINT books_unNullD_key`.execute(db);",
					],
					down: [
						"await sql`ALTER TABLE books ALTER COLUMN unNullD ADD CONSTRAINT books_unNullD_key UNIQUE (unNullD)`.execute(db);",
					],
				},
				{
					tableName: "books",
					priority: 3.61,
					type: "changeColumn",
					up: [
						"await sql`ALTER TABLE books ALTER COLUMN unNullNotD DROP CONSTRAINT books_unNullNotD_key`.execute(db);",
					],
					down: [
						"await sql`ALTER TABLE books ALTER COLUMN unNullNotD ADD CONSTRAINT books_unNullNotD_key UNIQUE NULLS NOT DISTINCT (unNullNotD)`.execute(db);",
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
							unNullD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullD",
								dataType: "integer",
								unique: ColumnUnique.NullsDistinct,
							}),
							unNullNotD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullNotD",
								dataType: "integer",
								unique: ColumnUnique.NullsNotDistinct,
							}),
						},
					},
					index: {},
				},
				{
					table: {
						books: {
							unNullD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullD",
								dataType: "integer",
								unique: ColumnUnique.NullsNotDistinct,
							}),
							unNullNotD: columnInfoFactory({
								tableName: "books",
								columnName: "unNullNotD",
								dataType: "integer",
								unique: ColumnUnique.NullsDistinct,
							}),
						},
					},
					index: {},
				},
			);
			const expected = [
				{
					tableName: "books",
					priority: 3.62,
					type: "changeColumn",
					up: [
						"await sql`ALTER TABLE books ALTER COLUMN unNullD DROP CONSTRAINT books_unNullD_key`.execute(db);",
						"await sql`ALTER TABLE books ALTER COLUMN unNullD ADD CONSTRAINT books_unNullD_key UNIQUE (unNullD)`.execute(db);",
					],
					down: [
						"await sql`ALTER TABLE books ALTER COLUMN unNullD DROP CONSTRAINT books_unNullD_key`.execute(db);",
						"await sql`ALTER TABLE books ALTER COLUMN unNullD ADD CONSTRAINT books_unNullD_key UNIQUE NULLS NOT DISTINCT (unNullD)`.execute(db);",
					],
				},
				{
					tableName: "books",
					priority: 3.62,
					type: "changeColumn",
					up: [
						"await sql`ALTER TABLE books ALTER COLUMN unNullNotD DROP CONSTRAINT books_unNullNotD_key`.execute(db);",
						"await sql`ALTER TABLE books ALTER COLUMN unNullNotD ADD CONSTRAINT books_unNullNotD_key UNIQUE NULLS NOT DISTINCT (unNullNotD)`.execute(db);",
					],
					down: [
						"await sql`ALTER TABLE books ALTER COLUMN unNullNotD DROP CONSTRAINT books_unNullNotD_key`.execute(db);",
						"await sql`ALTER TABLE books ALTER COLUMN unNullNotD ADD CONSTRAINT books_unNullNotD_key UNIQUE (unNullNotD)`.execute(db);",
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
				},
				{
					table: {
						books: {},
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
});
