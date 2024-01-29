import { expect, test } from "vitest";
import {
	schemaColumnInfo,
	schemaDBTableInfo,
	schemaTableInfo,
} from "~/database/change_set/schema_info.js";
import { pgBoolean, pgVarchar } from "~/database/schema/columns.js";
import { pgDatabase } from "~/database/schema/database.js";
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
		default: "foo",
		isNullable: false,
		numericPrecision: null,
		numericScale: null,
		characterMaximumLength: 100,
		datetimePrecision: null,
		renameFrom: "old_column_name",
	};

	expect(schemaColumnInfo("foo", "bar", column)).toEqual(expectedInfo);
});

test("#schemaDBTableInfo", () => {
	const users = pgTable("users", {
		columns: {
			name: pgVarchar().nonNullable(),
			email: pgVarchar().nonNullable(),
		},
	});
	const teams = pgTable("teams", {
		columns: {
			name: pgVarchar().nonNullable(),
			active: pgBoolean(),
		},
	});
	const database = pgDatabase({
		users,
		teams,
	});
	const expectedDbTableInfo = {
		users: {
			name: {
				tableName: "users",
				columnName: "name",
				dataType: "varchar",
				default: null,
				isNullable: false,
				numericPrecision: null,
				numericScale: null,
				characterMaximumLength: null,
				datetimePrecision: null,
				renameFrom: null,
			},
			email: {
				tableName: "users",
				columnName: "email",
				dataType: "varchar",
				default: null,
				isNullable: false,
				numericPrecision: null,
				numericScale: null,
				characterMaximumLength: null,
				datetimePrecision: null,
				renameFrom: null,
			},
		},
		teams: {
			name: {
				tableName: "teams",
				columnName: "name",
				dataType: "varchar",
				default: null,
				isNullable: false,
				numericPrecision: null,
				numericScale: null,
				characterMaximumLength: null,
				datetimePrecision: null,
				renameFrom: null,
			},
			active: {
				tableName: "teams",
				columnName: "active",
				dataType: "boolean",
				default: null,
				isNullable: true,
				numericPrecision: null,
				numericScale: null,
				characterMaximumLength: null,
				datetimePrecision: null,
				renameFrom: null,
			},
		},
	};
	expect(schemaDBTableInfo(database)).toEqual(expectedDbTableInfo);
});
