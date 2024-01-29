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
						default: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
					},
				},
			};
			const db = {
				books: {
					price: {
						tableName: "books",
						columnName: "price",
						dataType: "numeric(6, 3)",
						default: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
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
						default: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
					},
				},
			};
			const db = {
				users: {
					name: {
						tableName: "users",
						columnName: "email",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
					},
				},
				teams: {
					name: {
						tableName: "teams",
						columnName: "name",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
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
						default: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
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
						default: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
					},
				},
			};
			const db = {
				books: {
					price: {
						tableName: "books",
						columnName: "price",
						dataType: "numeric(6, 3)",
						default: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
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
						default: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						renameFrom: null,
						datetimePrecision: null,
					},
				},
				users: {
					name: {
						tableName: "users",
						columnName: "email",
						dataType: "text",
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
			const db = <TableInfo>{
				users: {
					name: {
						tableName: "users",
						columnName: "email",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						renameFrom: null,
						datetimePrecision: null,
					},
				},
				teams: {
					name: {
						tableName: "teams",
						columnName: "name",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						renameFrom: null,
						datetimePrecision: null,
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
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						renameFrom: null,
						datetimePrecision: null,
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
						default: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
					},
				},
			};
			const db = {
				books: {
					price: {
						tableName: "books",
						columnName: "price",
						dataType: "numeric(6, 3)",
						default: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						datetimePrecision: null,
						characterMaximumLength: null,
						renameFrom: null,
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
						default: null,
						isNullable: false,
						numericPrecision: 3,
						numericScale: 6,
						characterMaximumLength: null,
						renameFrom: null,
						datetimePrecision: null,
					},
				},
				memberships: {
					title: {
						tableName: "memberships",
						columnName: "title",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						renameFrom: null,
						datetimePrecision: null,
					},
				},
				users: {
					name: {
						tableName: "users",
						columnName: "newEmail",
						dataType: "varchar(255)",
						default: "Hello",
						isNullable: false,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: 255,
						renameFrom: "email",
						datetimePrecision: null,
					},
				},
			};
			const db = <TableInfo>{
				users: {
					name: {
						tableName: "users",
						columnName: "email",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						renameFrom: null,
						datetimePrecision: null,
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
