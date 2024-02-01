import { expect, test } from "vitest";
import {
	schemaColumnInfo,
	schemaDBColumnInfoByTable,
	schemaDBIndexInfoByTable,
	schemaTableInfo,
} from "~/database/introspection/local_schema.js";
import {
	pgBigSerial,
	pgBoolean,
	pgSerial,
	pgVarchar,
} from "~/database/schema/columns.js";
import { pgDatabase } from "~/database/schema/database.js";
import { pgIndex } from "~/database/schema/indexes.js";
import { pgTable } from "~/database/schema/table.js";

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

test("#schemaColumnInfo", () => {
	const column = pgVarchar(100)
		.nonNullable()
		.default("foo")
		.renameFrom("old_column_name");
	const expectedInfo = {
		tableName: "foo",
		columnName: "bar",
		dataType: "varchar(100)",
		defaultValue: "foo",
		isNullable: false,
		numericPrecision: null,
		numericScale: null,
		characterMaximumLength: 100,
		datetimePrecision: null,
		renameFrom: "old_column_name",
		primaryKey: null,
		foreignKeyConstraint: null,
	};

	expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
});

test("#schemaDBTableInfo", () => {
	const users = pgTable("users", {
		columns: {
			id: pgSerial(),
			name: pgVarchar().nonNullable(),
			email: pgVarchar().nonNullable(),
		},
	});
	const teams = pgTable("teams", {
		columns: {
			id: pgBigSerial(),
			name: pgVarchar().nonNullable(),
			active: pgBoolean(),
		},
	});
	const database = pgDatabase({
		users,
		teams,
	});
	const expectedDbColumnInfoByTable = {
		users: {
			id: {
				tableName: "users",
				columnName: "id",
				dataType: "serial",
				defaultValue: null,
				isNullable: false,
				numericPrecision: null,
				numericScale: null,
				characterMaximumLength: null,
				datetimePrecision: null,
				renameFrom: null,
				primaryKey: null,
				foreignKeyConstraint: null,
			},
			name: {
				tableName: "users",
				columnName: "name",
				dataType: "varchar",
				defaultValue: null,
				isNullable: false,
				numericPrecision: null,
				numericScale: null,
				characterMaximumLength: null,
				datetimePrecision: null,
				renameFrom: null,
				primaryKey: null,
				foreignKeyConstraint: null,
			},
			email: {
				tableName: "users",
				columnName: "email",
				dataType: "varchar",
				defaultValue: null,
				isNullable: false,
				numericPrecision: null,
				numericScale: null,
				characterMaximumLength: null,
				datetimePrecision: null,
				renameFrom: null,
				primaryKey: null,
				foreignKeyConstraint: null,
			},
		},
		teams: {
			id: {
				tableName: "teams",
				columnName: "id",
				dataType: "bigserial",
				defaultValue: null,
				isNullable: false,
				numericPrecision: null,
				numericScale: null,
				characterMaximumLength: null,
				datetimePrecision: null,
				renameFrom: null,
				primaryKey: null,
				foreignKeyConstraint: null,
			},
			name: {
				tableName: "teams",
				columnName: "name",
				dataType: "varchar",
				defaultValue: null,
				isNullable: false,
				numericPrecision: null,
				numericScale: null,
				characterMaximumLength: null,
				datetimePrecision: null,
				renameFrom: null,
				primaryKey: null,
				foreignKeyConstraint: null,
			},
			active: {
				tableName: "teams",
				columnName: "active",
				dataType: "boolean",
				defaultValue: null,
				isNullable: true,
				numericPrecision: null,
				numericScale: null,
				characterMaximumLength: null,
				datetimePrecision: null,
				renameFrom: null,
				primaryKey: null,
				foreignKeyConstraint: null,
			},
		},
	};
	expect(schemaDBColumnInfoByTable(database)).toEqual(
		expectedDbColumnInfoByTable,
	);
});

test("#schemaDBTableInfo", () => {
	const users = pgTable("users", {
		columns: {
			id: pgSerial(),
			name: pgVarchar().nonNullable(),
			email: pgVarchar().nonNullable(),
		},
		indexes: [
			pgIndex("users_name_idx", (idx) => idx),
			pgIndex("users_email_idx", (idx) => idx),
		],
	});
	const teams = pgTable("teams", {
		columns: {
			id: pgBigSerial(),
			name: pgVarchar().nonNullable(),
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
