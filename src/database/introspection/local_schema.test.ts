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
	pgBigSerial,
	pgBoolean,
	pgInteger,
	pgSerial,
	pgVarChar,
} from "~/database/schema/pg_column.js";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { pgIndex } from "~/database/schema/pg_index.js";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { pgForeignKeyConstraint } from "../schema/pg_foreign_key.js";
import { pgPrimaryKeyConstraint } from "../schema/pg_primary_key.js";
import { pgTable } from "../schema/pg_table.js";
import { pgUniqueConstraint } from "../schema/pg_unique.js";

describe("#schemaColumnInfo", () => {
	test("default column", () => {
		const column = pgVarChar(100);
		const expectedInfo = columnInfoFactory({
			tableName: "foo",
			columnName: "bar",
			dataType: "varchar(100)",
			characterMaximumLength: 100,
		});

		expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
	});

	test("not null column", () => {
		const column = pgVarChar(100).notNull();
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
		const column = pgVarChar(100).defaultTo("foo");
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
		const column = pgVarChar(100).renameFrom("old_column_name");
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
		const column = pgVarChar(100).unique();
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
		const column = pgVarChar(100).unique().nullsNotDistinct();
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
		const column = pgVarChar(100).generatedAlwaysAsIdentity();
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
		const column = pgVarChar(100).generatedByDefaultAsIdentity();
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
	const database = pgDatabase({});
	expect(schemaDBColumnInfoByTable(database)).toEqual({});
});

test("#schemaDBColumnInfoByTable", () => {
	const users = pgTable("users", {
		columns: {
			id: pgSerial(),
			name: pgVarChar().notNull(),
			email: pgVarChar().notNull(),
		},
	});
	const teams = pgTable("teams", {
		columns: {
			id: pgBigSerial(),
			name: pgVarChar().notNull(),
			active: pgBoolean(),
		},
	});
	const database = pgDatabase({
		users,
		teams,
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
			id: pgSerial(),
			name: pgVarChar().notNull(),
			email: pgVarChar().notNull(),
		},
		indexes: [pgIndex("name", (idx) => idx), pgIndex("email", (idx) => idx)],
	});
	const teams = pgTable("teams", {
		columns: {
			id: pgBigSerial(),
			name: pgVarChar().notNull(),
			active: pgBoolean(),
		},
		indexes: [pgIndex("id", (idx) => idx), pgIndex("active", (idx) => idx)],
	});
	const database = pgDatabase({
		users,
		teams,
	});
	expect(schemaDBIndexInfoByTable(database)).toStrictEqual({
		teams: {
			teams_active_kntc_idx: 'create index "teams_active_kntc_idx" on "teams"',
			teams_id_kntc_idx: 'create index "teams_id_kntc_idx" on "teams"',
		},
		users: {
			users_email_kntc_idx: 'create index "users_email_kntc_idx" on "users"',
			users_name_kntc_idx: 'create index "users_name_kntc_idx" on "users"',
		},
	});
});

test("#schemaDbConstraintInfoByTable", () => {
	const books = pgTable("books", {
		columns: {
			id: pgSerial().primaryKey(),
			name: pgVarChar(),
			location: pgVarChar(),
		},
		constraints: [pgUniqueConstraint(["name", "location"])],
	});

	const users = pgTable("users", {
		columns: {
			id: pgSerial().primaryKey(),
			name: pgVarChar(),
			subscribed: pgBoolean(),
			book_id: pgInteger(),
		},
		constraints: [
			pgUniqueConstraint(["name"]),
			pgUniqueConstraint(["subscribed"]),
			pgForeignKeyConstraint(["book_id"], books, ["id"]),
		],
	});

	const database = pgDatabase({
		users,
		books,
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
			id: pgSerial().primaryKey(),
			name: pgVarChar(),
			location: pgVarChar(),
		},
		indexes: [pgIndex("name", (idx) => idx)],
		constraints: [pgUniqueConstraint(["name", "location"])],
	});

	const users = pgTable("users", {
		columns: {
			id: pgSerial(),
			name: pgVarChar().notNull(),
			email: pgVarChar().notNull(),
			book_id: pgInteger(),
		},
		constraints: [
			pgForeignKeyConstraint(["book_id"], books, ["id"]),
			pgUniqueConstraint(["name"]),
			pgUniqueConstraint(["email"], false),
			pgPrimaryKeyConstraint(["id"]),
		],
	});

	const teams = pgTable("teams", {
		columns: {
			id: pgBigSerial(),
			name: pgVarChar().notNull(),
			active: pgBoolean(),
		},
		indexes: [pgIndex("name", (idx) => idx)],
		constraints: [pgPrimaryKeyConstraint("id")],
	});

	const database = pgDatabase({
		users,
		teams,
		books,
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
				books_name_kntc_idx: 'create index "books_name_kntc_idx" on "books"',
			},
			teams: {
				teams_name_kntc_idx: 'create index "teams_name_kntc_idx" on "teams"',
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
	};
	expect(localSchema(database)).toStrictEqual(expectedLocalSchema);
});
