import { describe, expect, test } from "vitest";
import {
	schemaColumnInfo,
	schemaDBColumnInfoByTable,
	schemaDBIndexInfoByTable,
	schemaDbConstraintInfoByTable,
	schemaTableInfo,
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
import { pgTable } from "~/database/schema/pg_table.js";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { pgForeignKeyConstraint } from "../schema/pg_foreign_key.js";
import { pgUniqueConstraint } from "../schema/pg_unique.js";

test("#schemaTableInfo", () => {
	const foo = pgTable("foo", { columns: {} });
	const bar = pgTable("bar", { columns: {} });

	const expectedInfo = [
		{
			tableName: "foo",
			schemaName: "public",
		},
		{
			tableName: "bar",
			schemaName: "public",
		},
	];
	expect(schemaTableInfo([foo, bar])).toEqual(expectedInfo);
});

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
		indexes: [
			pgIndex("users_name_idx", (idx) => idx),
			pgIndex("users_email_idx", (idx) => idx),
		],
	});
	const teams = pgTable("teams", {
		columns: {
			id: pgBigSerial(),
			name: pgVarChar().notNull(),
			active: pgBoolean(),
		},
		indexes: [
			pgIndex("teams_id_idx", (idx) => idx),
			pgIndex("teams_active_idx", (idx) => idx),
		],
	});
	const database = pgDatabase({
		users,
		teams,
	});
	expect(schemaDBIndexInfoByTable(database)).toStrictEqual({
		teams: {
			teams_active_idx: 'create index "teams_active_idx" on "teams"',
			teams_id_idx: 'create index "teams_id_idx" on "teams"',
		},
		users: {
			users_email_idx: 'create index "users_email_idx" on "users"',
			users_name_idx: 'create index "users_name_idx" on "users"',
		},
	});
});

test("#schemaDbConstraintInfoByTable", () => {
	const userUniqueConstraint1 = pgUniqueConstraint(["name"]);
	const userUniqueConstraint2 = pgUniqueConstraint(["subscribed"]);
	const userForeignKeyConstraint = pgForeignKeyConstraint(
		["book_id"],
		"books",
		["id"],
	);

	const users = pgTable("users", {
		columns: {
			id: pgSerial().primaryKey(),
			name: pgVarChar(),
			subscribed: pgBoolean(),
			bookd_id: pgInteger(),
		},
		constraints: [
			userForeignKeyConstraint,
			userUniqueConstraint1,
			userUniqueConstraint2,
		],
	});

	const booksConstraint = pgUniqueConstraint(["name", "location"]);

	const books = pgTable("books", {
		columns: {
			id: pgSerial().primaryKey(),
			name: pgVarChar(),
			location: pgVarChar(),
		},
		constraints: [booksConstraint],
	});

	const database = pgDatabase({
		users,
		books,
	});

	expect(schemaDbConstraintInfoByTable(database)).toStrictEqual({
		unique: {
			users_name_kinetic_key:
				"CONSTRAINT users_name_kinetic_key UNIQUE NULLS DISTINCT (name)",
			users_subscribed_kinetic_key:
				"CONSTRAINT users_subscribed_kinetic_key UNIQUE NULLS DISTINCT (subscribed)",
			books_name_location_kinetic_key:
				"CONSTRAINT books_name_location_kinetic_key UNIQUE NULLS DISTINCT (name, location)",
		},
		foreignKey: {
			users_book_id_books_id_kinetic_fk:
				"CONSTRAINT users_book_id_books_id_kinetic_fk FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE NO ACTION ON UPDATE NO ACTION",
		},
	});
});
