import { describe, expect, test } from "vitest";
import {
	localSchema,
	schemaColumnInfo,
	schemaDBColumnInfoByTable,
	schemaDBIndexInfoByTable,
	schemaDbConstraintInfoByTable,
} from "~/database/introspection/local_schema.js";
import {
	ColumnIdentity,
	ColumnUnique,
	bigserial,
	boolean,
	integer,
	serial,
	varchar,
} from "~/database/schema/pg_column.js";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { index } from "~/database/schema/pg_index.js";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { foreignKey } from "../schema/pg_foreign_key.js";
import { primaryKey } from "../schema/pg_primary_key.js";
import { pgTable } from "../schema/pg_table.js";
import { unique } from "../schema/pg_unique.js";

describe("#schemaColumnInfo", () => {
	test("default column", () => {
		const column = varchar(100);
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "varchar(100)",
			characterMaximumLength: 100,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("not null column", () => {
		const column = varchar(100).notNull();
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "varchar(100)",
			isNullable: false,
			characterMaximumLength: 100,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with defaultTo", () => {
		const column = varchar(100).defaultTo("foo");
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "varchar(100)",
			defaultValue: "'foo'::character varying",
			characterMaximumLength: 100,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with renameFrom", () => {
		const column = varchar(100).renameFrom("old_column_name");
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "varchar(100)",
			characterMaximumLength: 100,
			renameFrom: "old_column_name",
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with unique", () => {
		const column = varchar(100).unique();
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "varchar(100)",
			characterMaximumLength: 100,
			unique: ColumnUnique.NullsDistinct,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with unique nulls not distinct", () => {
		const column = varchar(100).unique().nullsNotDistinct();
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "varchar(100)",
			characterMaximumLength: 100,
			unique: ColumnUnique.NullsNotDistinct,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with always as identity", () => {
		const column = varchar(100).generatedAlwaysAsIdentity();
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "varchar(100)",
			characterMaximumLength: 100,
			identity: ColumnIdentity.Always,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("column with by default as identity", () => {
		const column = varchar(100).generatedByDefaultAsIdentity();
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "varchar(100)",
			characterMaximumLength: 100,
			identity: ColumnIdentity.ByDefault,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});
});

test("#schemaDBColumnInfoByTable on empty database", () => {
	const database = pgDatabase({ tables: {} });
	expect(schemaDBColumnInfoByTable(database)).toEqual({});
});

test("#schemaDBColumnInfoByTable", () => {
	const users = pgTable("users", {
		columns: {
			id: serial(),
			name: varchar().notNull(),
			email: varchar().notNull(),
		},
	});
	const teams = pgTable("teams", {
		columns: {
			id: bigserial(),
			name: varchar().notNull(),
			active: boolean(),
		},
	});
	const database = pgDatabase({
		tables: {
			users,
			teams,
		},
	});
	const expectedDbColumnInfoByTable = {
		users: {
			id: columnInfoFactory({
				tableName: "users",
				columnName: "id",
				dataType: "serial",
				isNullable: false,
			}),
			name: columnInfoFactory({
				tableName: "users",
				columnName: "name",
				dataType: "varchar",
				isNullable: false,
			}),
			email: columnInfoFactory({
				tableName: "users",
				columnName: "email",
				dataType: "varchar",
				isNullable: false,
			}),
		},
		teams: {
			id: columnInfoFactory({
				tableName: "teams",
				columnName: "id",
				dataType: "bigserial",
				isNullable: false,
			}),
			name: columnInfoFactory({
				tableName: "teams",
				columnName: "name",
				dataType: "varchar",
				isNullable: false,
			}),
			active: columnInfoFactory({
				tableName: "teams",
				columnName: "active",
				dataType: "boolean",
				isNullable: true,
			}),
		},
	};
	expect(schemaDBColumnInfoByTable(database)).toEqual(
		expectedDbColumnInfoByTable,
	);
});

test("#schemaDBIndexInfoByTable", () => {
	const users = pgTable("users", {
		columns: {
			id: serial(),
			name: varchar().notNull(),
			email: varchar().notNull(),
		},
		indexes: [index("name", (idx) => idx), index("email", (idx) => idx)],
	});
	const teams = pgTable("teams", {
		columns: {
			id: bigserial(),
			name: varchar().notNull(),
			active: boolean(),
		},
		indexes: [index("id", (idx) => idx), index("active", (idx) => idx)],
	});
	const database = pgDatabase({
		tables: {
			users,
			teams,
		},
	});
	expect(schemaDBIndexInfoByTable(database)).toStrictEqual({
		teams: {
			teams_active_kntc_idx:
				'c3c6080ff3d3e7bf8b6a6e729aff7aa2f79712f924cdc454cc615595f940a1e6:create index "teams_active_kntc_idx" on "teams" ("active")',
			teams_id_kntc_idx:
				'43e5590f52736483e6877c00bccaf65586bb6dd7fae45bdc8159a05d2521dd7c:create index "teams_id_kntc_idx" on "teams" ("id")',
		},
		users: {
			users_email_kntc_idx:
				'd6d7731a163ff74b32643d72154f528ab2f7043dd3fb47a6131c70a535ca1513:create index "users_email_kntc_idx" on "users" ("email")',
			users_name_kntc_idx:
				'f873e4a8464da05b0b0978fff8711714af80a8c32d067955877ae60792414d45:create index "users_name_kntc_idx" on "users" ("name")',
		},
	});
});

test("#schemaDbConstraintInfoByTable", () => {
	const books = pgTable("books", {
		columns: {
			id: serial().primaryKey(),
			name: varchar(),
			location: varchar(),
		},
		constraints: [unique(["name", "location"])],
	});

	const users = pgTable("users", {
		columns: {
			id: serial().primaryKey(),
			name: varchar(),
			subscribed: boolean(),
			book_id: integer(),
		},
		constraints: [
			unique(["name"]),
			unique(["subscribed"]),
			foreignKey(["book_id"], books, ["id"]),
		],
	});

	const database = pgDatabase({
		tables: { users, books },
	});

	expect(schemaDbConstraintInfoByTable(database)).toStrictEqual({
		unique: {
			users: {
				users_name_kinetic_key:
					"users_name_kinetic_key UNIQUE NULLS DISTINCT (name)",
				users_subscribed_kinetic_key:
					"users_subscribed_kinetic_key UNIQUE NULLS DISTINCT (subscribed)",
			},
			books: {
				books_name_location_kinetic_key:
					"books_name_location_kinetic_key UNIQUE NULLS DISTINCT (name, location)",
			},
		},
		foreign: {
			users: {
				users_book_id_books_id_kinetic_fk:
					"users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE NO ACTION ON UPDATE NO ACTION",
			},
		},
		primaryKey: {},
	});
});

test("#localSchema", () => {
	const books = pgTable("books", {
		columns: {
			id: serial().primaryKey(),
			name: varchar(),
			location: varchar(),
		},
		indexes: [index("name")],
		constraints: [unique(["name", "location"])],
	});

	const users = pgTable("users", {
		columns: {
			id: serial(),
			name: varchar().notNull(),
			email: varchar().notNull(),
			book_id: integer(),
		},
		constraints: [
			foreignKey(["book_id"], books, ["id"]),
			unique(["name"]),
			unique(["email"], false),
			primaryKey(["id"]),
		],
	});

	const teams = pgTable("teams", {
		columns: {
			id: bigserial(),
			name: varchar().notNull(),
			active: boolean(),
		},
		indexes: [index("name", (idx) => idx)],
		constraints: [primaryKey("id")],
	});

	const database = pgDatabase({
		extensions: ["cube", "btree_gin"],
		tables: {
			users,
			teams,
			books,
		},
	});

	const expectedLocalSchema = {
		table: {
			books: {
				id: {
					characterMaximumLength: null,
					columnName: "id",
					dataType: "serial",
					datetimePrecision: null,
					defaultValue: null,
					foreignKeyConstraint: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					primaryKey: true,
					renameFrom: null,
					tableName: "books",
					unique: null,
				},
				location: {
					characterMaximumLength: null,
					columnName: "location",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					foreignKeyConstraint: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					primaryKey: null,
					renameFrom: null,
					tableName: "books",
					unique: null,
				},
				name: {
					characterMaximumLength: null,
					columnName: "name",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					foreignKeyConstraint: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					primaryKey: null,
					renameFrom: null,
					tableName: "books",
					unique: null,
				},
			},
			teams: {
				active: {
					characterMaximumLength: null,
					columnName: "active",
					dataType: "boolean",
					datetimePrecision: null,
					defaultValue: null,
					foreignKeyConstraint: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					primaryKey: null,
					renameFrom: null,
					tableName: "teams",
					unique: null,
				},
				id: {
					characterMaximumLength: null,
					columnName: "id",
					dataType: "bigserial",
					datetimePrecision: null,
					defaultValue: null,
					foreignKeyConstraint: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					primaryKey: null,
					renameFrom: null,
					tableName: "teams",
					unique: null,
				},
				name: {
					characterMaximumLength: null,
					columnName: "name",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					foreignKeyConstraint: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					primaryKey: null,
					renameFrom: null,
					tableName: "teams",
					unique: null,
				},
			},
			users: {
				book_id: {
					characterMaximumLength: null,
					columnName: "book_id",
					dataType: "integer",
					datetimePrecision: null,
					defaultValue: null,
					foreignKeyConstraint: null,
					identity: null,
					isNullable: true,
					numericPrecision: null,
					numericScale: null,
					primaryKey: null,
					renameFrom: null,
					tableName: "users",
					unique: null,
				},
				email: {
					characterMaximumLength: null,
					columnName: "email",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					foreignKeyConstraint: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					primaryKey: null,
					renameFrom: null,
					tableName: "users",
					unique: null,
				},
				id: {
					characterMaximumLength: null,
					columnName: "id",
					dataType: "serial",
					datetimePrecision: null,
					defaultValue: null,
					foreignKeyConstraint: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					primaryKey: null,
					renameFrom: null,
					tableName: "users",
					unique: null,
				},
				name: {
					characterMaximumLength: null,
					columnName: "name",
					dataType: "varchar",
					datetimePrecision: null,
					defaultValue: null,
					foreignKeyConstraint: null,
					identity: null,
					isNullable: false,
					numericPrecision: null,
					numericScale: null,
					primaryKey: null,
					renameFrom: null,
					tableName: "users",
					unique: null,
				},
			},
		},
		index: {
			books: {
				books_name_kntc_idx:
					'77f3737b4f672295b1204a55da66fa8873cf81ba7ae3d785480c618455e3ac22:create index "books_name_kntc_idx" on "books" ("name")',
			},
			teams: {
				teams_name_kntc_idx:
					'590d0c8227f1792fe07fe7f16202b6a6ea954932810010733646dbcd46d88618:create index "teams_name_kntc_idx" on "teams" ("name")',
			},
		},
		foreignKeyConstraints: {
			users: {
				users_book_id_books_id_kinetic_fk:
					"users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE NO ACTION ON UPDATE NO ACTION",
			},
		},
		uniqueConstraints: {
			users: {
				users_email_kinetic_key:
					"users_email_kinetic_key UNIQUE NULLS NOT DISTINCT (email)",
				users_name_kinetic_key:
					"users_name_kinetic_key UNIQUE NULLS DISTINCT (name)",
			},
			books: {
				books_name_location_kinetic_key:
					"books_name_location_kinetic_key UNIQUE NULLS DISTINCT (name, location)",
			},
		},
		primaryKey: {
			teams: {
				teams_id_kinetic_pk: "teams_id_kinetic_pk PRIMARY KEY (id)",
			},
			users: {
				users_id_kinetic_pk: "users_id_kinetic_pk PRIMARY KEY (id)",
			},
		},
		extensions: { btree_gin: true, cube: true },
	};
	expect(localSchema(database)).toStrictEqual(expectedLocalSchema);
});
