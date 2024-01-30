import { expect, test } from "vitest";
import {
	schemaColumnInfo,
	schemaDBColumnInfoByTable,
	schemaDBIndexInfoByTable,
	schemaTableInfo,
} from "~/database/change_set/schema_info.js";
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
			},
		},
	};
	expect(schemaDBColumnInfoByTable(database)).toEqual(
		expectedDbColumnInfoByTable,
	);
});

test("#schemaDBTableInfo", () => {
	const userIndexes = [
		pgIndex("users_name_idx", (idx) => idx),
		pgIndex("users_email_idx", (idx) => idx),
	];
	const users = pgTable("users", {
		columns: {
			id: pgSerial(),
			name: pgVarchar().nonNullable(),
			email: pgVarchar().nonNullable(),
		},
		indexes: userIndexes,
	});
	const teamIndexes = [
		pgIndex("teams_id_idx", (idx) => idx),
		pgIndex("teams_active_idx", (idx) => idx),
	];
	const teams = pgTable("teams", {
		columns: {
			id: pgBigSerial(),
			name: pgVarchar().nonNullable(),
			active: pgBoolean(),
		},
		indexes: teamIndexes,
	});
	const database = pgDatabase({
		users,
		teams,
	});
	const expectedDbIndexInfoByTable = {
		users: userIndexes,
		teams: teamIndexes,
	};
	expect(schemaDBIndexInfoByTable(database)).toEqual(
		expectedDbIndexInfoByTable,
	);
});
