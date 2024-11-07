import type { TableRename } from "@monorepo/state/table-column-rename.js";
import { assert, describe, test } from "vitest";
import type { TableColumnInfo } from "~push/changeset/types/schema.js";
import type { ColumnToRename, TableToRename } from "~push/state/rename.js";
import { columnInfoFactory } from "~tests/__setup__/helpers/factories/column-info-factory.js";
import {
	byColumnRename,
	byTableRename,
	computeColumnRenames,
	computeRenames,
	computeTableRenames,
	type Rename,
} from "./renames.js";

describe("table rename", () => {
	test("compute table renames", () => {
		const localTables: TableColumnInfo = {
			books: {
				name: "books",
				columns: {},
			},
			teams: {
				name: "teams",
				columns: {},
			},
			accounts: {
				name: "accounts",
				columns: {},
			},
		};

		const remoteTables: TableColumnInfo = {
			books: {
				name: "books",
				columns: {},
			},
			organizations: {
				name: "organizations",
				columns: {},
			},
			users: {
				name: "users",
				columns: {},
			},
		};
		const renameTransforms: (ColumnToRename | TableToRename)[] = [
			makeTableRenameTransform("organizations", "organizations", "teams"),
			makeTableRenameTransform("users", "users", "demo"),
			makeTableRenameTransform("demo", "demo", "accounts"),
		];

		const list = computeTableRenames(
			renameTransforms.filter(byTableRename),
			localTables,
			remoteTables,
		);

		const expected: Record<string, TableRename[]> = {
			public: [
				{
					from: "organizations",
					to: "teams",
				},
				{
					from: "users",
					to: "accounts",
				},
			],
		};

		assert.deepStrictEqual(list, expected);
	});

	test("discards repeated renames", () => {
		const localTables: TableColumnInfo = {
			books: {
				name: "books",
				columns: {},
			},
			teams: {
				name: "teams",
				columns: {},
			},
			accounts: {
				name: "accounts",
				columns: {},
			},
		};

		const remoteTables: TableColumnInfo = {
			books: {
				name: "books",
				columns: {},
			},
			organizations: {
				name: "organizations",
				columns: {},
			},
			users: {
				name: "users",
				columns: {},
			},
		};
		const renameTransforms: (ColumnToRename | TableToRename)[] = [
			makeTableRenameTransform("organizations", "organizations", "teams"),
			makeTableRenameTransform("users", "users", "demo"),
			makeTableRenameTransform("organizations", "organizations", "teams"),
			makeTableRenameTransform("demo", "demo", "accounts"),
			makeTableRenameTransform("users", "users", "demo"),
			makeTableRenameTransform("demo", "demo", "accounts"),
			makeTableRenameTransform("demo", "demo", "accounts"),
		];

		const list = computeTableRenames(
			renameTransforms.filter(byTableRename),
			localTables,
			remoteTables,
		);

		const expected: Record<string, TableRename[]> = {
			public: [
				{
					from: "organizations",
					to: "teams",
				},
				{
					from: "users",
					to: "accounts",
				},
			],
		};

		assert.deepStrictEqual(list, expected);
	});

	test("discards renames on tables that are not declared in local", () => {
		const localTables: TableColumnInfo = {
			books: {
				name: "books",
				columns: {},
			},
			teams: {
				name: "teams",
				columns: {},
			},
			accounts: {
				name: "accounts",
				columns: {},
			},
		};

		const remoteTables: TableColumnInfo = {
			books: {
				name: "books",
				columns: {},
			},
			organizations: {
				name: "organizations",
				columns: {},
			},
			users: {
				name: "users",
				columns: {},
			},
		};
		const renameTransforms: (ColumnToRename | TableToRename)[] = [
			makeTableRenameTransform("organizations", "organizations", "teams"),
			makeTableRenameTransform("users", "users", "demo"),
			makeTableRenameTransform("demo", "demo", "accounts"),
			makeTableRenameTransform("lala", "lala", "demo"),
			makeTableRenameTransform("demo", "demo", "accounts"),
		];

		const list = computeTableRenames(
			renameTransforms.filter(byTableRename),
			localTables,
			remoteTables,
		);

		const expected: Record<string, TableRename[]> = {
			public: [
				{
					from: "organizations",
					to: "teams",
				},
				{
					from: "users",
					to: "accounts",
				},
			],
		};

		assert.deepStrictEqual(list, expected);
	});
});

describe("column renames", () => {
	test("compute multiple renames on column", () => {
		const localTables: TableColumnInfo = {
			users: {
				name: "users",
				columns: {
					id: columnInfoFactory({
						columnName: "id",
						dataType: "integer",
						identity: "ALWAYS",
						isNullable: false,
					}),
					confirmedSubscription: columnInfoFactory({
						columnName: "confirmedSubscription",
						dataType: "boolean",
						isNullable: false,
					}),
					updatedAt: columnInfoFactory({
						columnName: "updatedAt",
						dataType: "timestamptz",
						isNullable: false,
					}),
				},
			},
		};

		const remoteTables: TableColumnInfo = {
			users: {
				name: "users",
				columns: {
					id: columnInfoFactory({
						columnName: "id",
						dataType: "integer",
						identity: "ALWAYS",
						isNullable: false,
					}),
					confirmed: columnInfoFactory({
						columnName: "confirmed",
						dataType: "boolean",
						isNullable: false,
					}),
					updatedAt: columnInfoFactory({
						columnName: "updatedAt",
						dataType: "timestamptz",
						isNullable: false,
					}),
				},
			},
		};
		const renameTransforms: (ColumnToRename | TableToRename)[] = [
			makeColumnRenameTransform("users", "confirmed", "confirmedNew"),
			makeColumnRenameTransform("users", "confirmedNew", "confirmedNewsletter"),
			makeColumnRenameTransform(
				"users",
				"confirmedNewsletter",
				"confirmedSubscription",
			),
		];

		const list = computeColumnRenames(
			renameTransforms.filter(byColumnRename),
			localTables,
			remoteTables,
		);

		const expected: Rename = {
			"public.users": [
				{
					from: "confirmed",
					to: "confirmedSubscription",
				},
			],
		};

		assert.deepStrictEqual(list, expected);
	});

	test("compute multiple renames on columns", () => {
		const localTables: TableColumnInfo = {
			users: {
				name: "users",
				columns: {
					id: columnInfoFactory({
						columnName: "id",
						dataType: "integer",
						identity: "ALWAYS",
						isNullable: false,
					}),
					confirmedSubscription: columnInfoFactory({
						columnName: "confirmedSubscription",
						dataType: "boolean",
						isNullable: false,
					}),
					updatedAt: columnInfoFactory({
						columnName: "updatedAt",
						dataType: "timestamptz",
						isNullable: false,
					}),
				},
			},
			organizations: {
				name: "organizations",
				columns: {
					newName: columnInfoFactory({
						columnName: "newName",
						dataType: "text",
						isNullable: false,
					}),
				},
			},
		};

		const remoteTables: TableColumnInfo = {
			users: {
				name: "users",
				columns: {
					id: columnInfoFactory({
						columnName: "id",
						dataType: "integer",
						identity: "ALWAYS",
						isNullable: false,
					}),
					confirmed: columnInfoFactory({
						columnName: "confirmed",
						dataType: "boolean",
						isNullable: false,
					}),
					updatedAt: columnInfoFactory({
						columnName: "updatedAt",
						dataType: "timestamptz",
						isNullable: false,
					}),
				},
			},
			organizations: {
				name: "organizations",
				columns: {
					name: columnInfoFactory({
						columnName: "name",
						dataType: "text",
						isNullable: false,
					}),
				},
			},
		};
		const renameTransforms: (ColumnToRename | TableToRename)[] = [
			makeColumnRenameTransform("users", "confirmed", "confirmedOne"),
			makeColumnRenameTransform("organizations", "name", "newName"),
			makeColumnRenameTransform("users", "confirmed", "confirmedNew"),
			makeColumnRenameTransform("users", "confirmedOne", "confirmedTwo"),
			makeColumnRenameTransform("users", "confirmedNew", "confirmedNewsletter"),
			makeColumnRenameTransform(
				"users",
				"confirmedNewsletter",
				"confirmedSubscription",
			),
		];

		const list = computeColumnRenames(
			renameTransforms.filter(byColumnRename),
			localTables,
			remoteTables,
		);

		const expected: Rename = {
			"public.users": [
				{
					from: "confirmed",
					to: "confirmedSubscription",
				},
			],
			"public.organizations": [
				{
					from: "name",
					to: "newName",
				},
			],
		};
		assert.deepStrictEqual(list, expected);
	});

	test("discards repeated renames on columns", () => {
		const localTables: TableColumnInfo = {
			users: {
				name: "users",
				columns: {
					id: columnInfoFactory({
						columnName: "id",
						dataType: "integer",
						identity: "ALWAYS",
						isNullable: false,
					}),
					confirmedSubscription: columnInfoFactory({
						columnName: "confirmedSubscription",
						dataType: "boolean",
						isNullable: false,
					}),
					updatedAt: columnInfoFactory({
						columnName: "updatedAt",
						dataType: "timestamptz",
						isNullable: false,
					}),
				},
			},
			organizations: {
				name: "organizations",
				columns: {
					newName: columnInfoFactory({
						columnName: "newName",
						dataType: "text",
						isNullable: false,
					}),
				},
			},
		};

		const remoteTables: TableColumnInfo = {
			users: {
				name: "users",
				columns: {
					id: columnInfoFactory({
						columnName: "id",
						dataType: "integer",
						identity: "ALWAYS",
						isNullable: false,
					}),
					confirmed: columnInfoFactory({
						columnName: "confirmed",
						dataType: "boolean",
						isNullable: false,
					}),
					updatedAt: columnInfoFactory({
						columnName: "updatedAt",
						dataType: "timestamptz",
						isNullable: false,
					}),
				},
			},
			organizations: {
				name: "organizations",
				columns: {
					name: columnInfoFactory({
						columnName: "name",
						dataType: "text",
						isNullable: false,
					}),
				},
			},
		};
		const renameTransforms: (ColumnToRename | TableToRename)[] = [
			makeColumnRenameTransform("users", "confirmed", "confirmedOne"),
			makeColumnRenameTransform("organizations", "name", "newName"),
			makeColumnRenameTransform("users", "confirmed", "confirmedNew"),
			makeColumnRenameTransform("users", "confirmed", "confirmedNew"), // Repeated
			makeColumnRenameTransform("users", "confirmedOne", "confirmedTwo"),
			makeColumnRenameTransform("users", "confirmedNew", "confirmedNewsletter"),
			makeColumnRenameTransform("organizations", "name", "newName"), // Repeated
			makeColumnRenameTransform(
				"users",
				"confirmedNewsletter",
				"confirmedSubscription",
			),
			makeColumnRenameTransform(
				"users",
				"confirmedNewsletter",
				"confirmedSubscription",
			), // repeated
		];

		const list = computeColumnRenames(
			renameTransforms.filter(byColumnRename),
			localTables,
			remoteTables,
		);

		const expected: Rename = {
			"public.users": [
				{
					from: "confirmed",
					to: "confirmedSubscription",
				},
			],
			"public.organizations": [
				{
					from: "name",
					to: "newName",
				},
			],
		};
		assert.deepStrictEqual(list, expected);
	});

	test("discards renames on column that are not declared in local", () => {
		const localTables: TableColumnInfo = {
			users: {
				name: "users",
				columns: {
					id: columnInfoFactory({
						columnName: "id",
						dataType: "integer",
						identity: "ALWAYS",
						isNullable: false,
					}),
					confirmedNew: columnInfoFactory({
						columnName: "confirmedNew",
						dataType: "boolean",
						isNullable: false,
					}),
					updatedAt: columnInfoFactory({
						columnName: "updatedAt",
						dataType: "timestamptz",
						isNullable: false,
					}),
				},
			},
		};

		const remoteTables: TableColumnInfo = {
			users: {
				name: "users",
				columns: {
					id: columnInfoFactory({
						columnName: "id",
						dataType: "integer",
						identity: "ALWAYS",
						isNullable: false,
					}),
					confirmedNewsletter: columnInfoFactory({
						columnName: "confirmedNewsletter",
						dataType: "boolean",
						isNullable: false,
					}),
					updatedAt: columnInfoFactory({
						columnName: "updatedAt",
						dataType: "timestamptz",
						isNullable: false,
					}),
				},
			},
		};
		const renameTransforms: (ColumnToRename | TableToRename)[] = [
			makeColumnRenameTransform("users", "confirmed", "confirmedNew"),
			makeColumnRenameTransform("users", "confirmedNew", "confirmedNewsletter"),
			makeColumnRenameTransform(
				"users",
				"confirmedNewsletter",
				"confirmedSubscription",
			),
		];

		const list = computeColumnRenames(
			renameTransforms.filter(byColumnRename),
			localTables,
			remoteTables,
		);

		const expected: Rename = {};
		assert.deepStrictEqual(list, expected);
	});
});

describe("table and column renames", () => {
	test("compute renames", () => {
		const localTables: TableColumnInfo = {
			books: {
				name: "books",
				columns: {
					newName: columnInfoFactory({
						columnName: "newName",
						dataType: "text",
						isNullable: false,
					}),
				},
			},
			teams: {
				name: "teams",
				columns: {
					id: columnInfoFactory({
						columnName: "id",
						dataType: "integer",
						identity: "ALWAYS",
						isNullable: false,
					}),
					confirmedSubscription: columnInfoFactory({
						columnName: "confirmedSubscription",
						dataType: "boolean",
						isNullable: false,
					}),
					updatedAt: columnInfoFactory({
						columnName: "updatedAt",
						dataType: "timestamptz",
						isNullable: false,
					}),
				},
			},
			accounts: {
				name: "accounts",
				columns: {},
			},
		};

		const remoteTables: TableColumnInfo = {
			books: {
				name: "books",
				columns: {
					name: columnInfoFactory({
						columnName: "name",
						dataType: "text",
						isNullable: false,
					}),
				},
			},
			organizations: {
				name: "organizations",
				columns: {
					id: columnInfoFactory({
						columnName: "id",
						dataType: "integer",
						identity: "ALWAYS",
						isNullable: false,
					}),
					confirmed: columnInfoFactory({
						columnName: "confirmed",
						dataType: "boolean",
						isNullable: false,
					}),
					updatedAt: columnInfoFactory({
						columnName: "updatedAt",
						dataType: "timestamptz",
						isNullable: false,
					}),
				},
			},
			users: {
				name: "users",
				columns: {},
			},
		};

		const renameTransforms: (ColumnToRename | TableToRename)[] = [
			makeColumnRenameTransform("organizations", "confirmed", "confirmedOne"),
			makeColumnRenameTransform("oldTable", "name", "newName"),
			makeColumnRenameTransform("organizations", "confirmed", "confirmedNew"),
			makeColumnRenameTransform(
				"organizations",
				"confirmedOne",
				"confirmedTwo",
			),
			makeColumnRenameTransform(
				"organizations",
				"confirmedNew",
				"confirmedNewsletter",
			),
			makeColumnRenameTransform(
				"organizations",
				"confirmedNewsletter",
				"confirmedSubscription",
			),

			makeTableRenameTransform("organizations", "organizations", "teams"),
			makeTableRenameTransform("users", "users", "demo"),
			makeTableRenameTransform("demo", "demo", "accounts"),
			makeColumnRenameTransform("books", "name", "newName"),
		];

		const list = computeRenames(renameTransforms, localTables, remoteTables);

		const expected: Record<string, Record<string, TableRename[]>> = {
			tables: {
				public: [
					{
						from: "organizations",
						to: "teams",
					},
					{
						from: "users",
						to: "accounts",
					},
				],
			},
			columns: {
				"public.teams": [
					{
						from: "confirmed",
						to: "confirmedSubscription",
					},
				],
				"public.books": [
					{
						from: "name",
						to: "newName",
					},
				],
			},
		};
		assert.deepStrictEqual(list, expected);
	});

	test("compute renames on table column change", () => {
		const localTables: TableColumnInfo = {
			user_accounts: {
				name: "users_accounts",
				columns: {
					newName: columnInfoFactory({
						columnName: "newName",
						dataType: "text",
						isNullable: false,
					}),
				},
			},
		};

		const remoteTables: TableColumnInfo = {
			users: {
				name: "users",
				columns: {
					oldName: columnInfoFactory({
						columnName: "oldName",
						dataType: "text",
						isNullable: false,
					}),
				},
			},
		};

		const renameTransforms: (ColumnToRename | TableToRename)[] = [
			makeTableRenameTransform("users", "users", "user_accounts"),
			makeColumnRenameTransform("user_accounts", "oldName", "dekmoName"),
			makeColumnRenameTransform("user_accounts", "oldName", "newName"),
		];

		const list = computeRenames(renameTransforms, localTables, remoteTables);

		const expected: Record<string, Record<string, TableRename[]>> = {
			tables: {
				public: [
					{
						from: "users",
						to: "user_accounts",
					},
				],
			},
			columns: {
				"public.user_accounts": [
					{
						from: "oldName",
						to: "newName",
					},
				],
			},
		};
		assert.deepStrictEqual(list, expected);
	});

	test("compute renames with column rename then table rename", () => {
		const localTables: TableColumnInfo = {
			user_accounts: {
				name: "users_accounts",
				columns: {
					newName: columnInfoFactory({
						columnName: "newName",
						dataType: "text",
						isNullable: false,
					}),
				},
			},
		};

		const remoteTables: TableColumnInfo = {
			users: {
				name: "users",
				columns: {
					oldName: columnInfoFactory({
						columnName: "oldName",
						dataType: "text",
						isNullable: false,
					}),
				},
			},
		};

		const renameTransforms: (ColumnToRename | TableToRename)[] = [
			makeColumnRenameTransform("users", "oldName", "newName"),
			makeTableRenameTransform("users", "users", "user_accounts"),
		];

		const list = computeRenames(renameTransforms, localTables, remoteTables);

		const expected: Record<string, Record<string, TableRename[]>> = {
			tables: {
				public: [
					{
						from: "users",
						to: "user_accounts",
					},
				],
			},
			columns: {
				"public.user_accounts": [
					{
						from: "oldName",
						to: "newName",
					},
				],
			},
		};
		assert.deepStrictEqual(list, expected);
	});
});

function makeColumnRenameTransform(table: string, from: string, to: string) {
	return {
		schema: "public",
		table,
		from,
		to,
		name: "2024-b7a00b78",
		type: "columnRename",
	} satisfies ColumnToRename;
}

export function makeTableRenameTransform(
	table: string,
	from: string,
	to: string,
) {
	return {
		schema: "public",
		table,
		from,
		to,
		name: "2024-b7a00b78",
		type: "tableRename",
	} satisfies TableToRename;
}
