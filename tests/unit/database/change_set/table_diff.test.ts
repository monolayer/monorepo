import { describe, expect, test } from "vitest";
import { TableDiff, TableInfo } from "~/database/change_set/table_diff.js";

describe("TableDiff#calculate", () => {
	describe("add", () => {
		test("returns an empty array when there are no tables to add", () => {
			const local = {
				books: {
					price: {
						tableName: "books",
						columnName: "price",
						dataType: "numeric(6, 3)",
						defaultValue: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
			};
			const db = {
				books: {
					price: {
						tableName: "books",
						columnName: "price",
						dataType: "numeric(6, 3)",
						defaultValue: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
			};
			const tableDiff = new TableDiff(local, db);
			const diffResult = tableDiff.calculate();
			expect(diffResult.add).toEqual([]);
		});

		test("with difference", () => {
			const local = {
				books: {
					price: {
						tableName: "books",
						columnName: "price",
						dataType: "numeric(6, 3)",
						defaultValue: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
			};
			const db = {
				users: {
					name: {
						tableName: "users",
						columnName: "email",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
				teams: {
					name: {
						tableName: "teams",
						columnName: "name",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
			};
			const tableDiff = new TableDiff(local, db);
			const diffResult = tableDiff.calculate();
			expect(diffResult.add).toEqual({
				books: {
					price: {
						tableName: "books",
						columnName: "price",
						dataType: "numeric(6, 3)",
						defaultValue: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
			});
		});
	});

	describe("remove", () => {
		test("returns an empty array when there are no tables to remove", () => {
			const local = {
				books: {
					price: {
						tableName: "books",
						columnName: "price",
						dataType: "numeric(6, 3)",
						defaultValue: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
			};
			const db = {
				books: {
					price: {
						tableName: "books",
						columnName: "price",
						dataType: "numeric(6, 3)",
						defaultValue: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
			};
			const tableDiff = new TableDiff(local, db);
			const diffResult = tableDiff.calculate();
			expect(diffResult.remove).toEqual([]);
		});

		test("with difference", () => {
			const local = <TableInfo>{
				books: {
					price: {
						tableName: "books",
						columnName: "price",
						dataType: "numeric",
						defaultValue: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						renameFrom: null,
						datetimePrecision: null,
						primaryKey: null,
					},
				},
				users: {
					name: {
						tableName: "users",
						columnName: "email",
						dataType: "text",
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
			const db = <TableInfo>{
				users: {
					name: {
						tableName: "users",
						columnName: "email",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						renameFrom: null,
						datetimePrecision: null,
						primaryKey: null,
					},
				},
				teams: {
					name: {
						tableName: "teams",
						columnName: "name",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						renameFrom: null,
						datetimePrecision: null,
						primaryKey: null,
					},
				},
			};
			const tableDiff = new TableDiff(local, db);
			const diffResult = tableDiff.calculate();

			expect(diffResult.remove).toEqual({
				teams: {
					name: {
						tableName: "teams",
						columnName: "name",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						renameFrom: null,
						datetimePrecision: null,
						primaryKey: null,
					},
				},
			});
		});
	});

	describe("change", () => {
		test("returns an empty object when there are no tables to change", () => {
			const local = {
				books: {
					price: {
						tableName: "books",
						columnName: "price",
						dataType: "numeric(6, 3)",
						defaultValue: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
			};
			const db = {
				books: {
					price: {
						tableName: "books",
						columnName: "price",
						dataType: "numeric(6, 3)",
						defaultValue: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
						primaryKey: null,
					},
				},
			};
			const tableDiff = new TableDiff(local, db);
			const diffResult = tableDiff.calculate();
			expect(diffResult.change).toEqual({});
		});

		test("with changes", () => {
			const local = <TableInfo>{
				books: {
					price: {
						tableName: "books",
						columnName: "price",
						dataType: "numeric",
						defaultValue: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						characterMaximumLength: null,
						renameFrom: null,
						datetimePrecision: null,
						primaryKey: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						renameFrom: null,
						datetimePrecision: null,
						primaryKey: null,
					},
				},
				users: {
					name: {
						tableName: "users",
						columnName: "newEmail",
						dataType: "varchar(255)",
						defaultValue: "Hello",
						isNullable: false,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: 255,
						renameFrom: "email",
						datetimePrecision: null,
						primaryKey: null,
					},
				},
			};
			const db = <TableInfo>{
				users: {
					name: {
						tableName: "users",
						columnName: "email",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						renameFrom: null,
						datetimePrecision: null,
						primaryKey: null,
					},
				},
			};
			const tableDiff = new TableDiff(local, db);
			const diffResult = tableDiff.calculate();

			expect(diffResult.change).toEqual({
				users: [
					{
						tableName: "users",
						columnName: "name",
						change: "dataType",
						value: "varchar(255)",
						oldValue: "text",
					},
					{
						tableName: "users",
						columnName: "name",
						change: "default",
						value: "Hello",
						oldValue: null,
					},
					{
						tableName: "users",
						columnName: "name",
						change: "isNullable",
						value: false,
						oldValue: true,
					},
					{
						tableName: "users",
						columnName: "name",
						change: "renameFrom",
						value: "newEmail",
						oldValue: "email",
					},
				],
			});
		});
	});
});
