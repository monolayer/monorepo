import { beforeEach, describe, expect, test } from "vitest";
import { TableInfo } from "~/database/change_set/table_diff.js";
import {
	dbChangeset,
	dbDiff,
	isColumnChangeDifference,
	isColumnCreateDifference,
	isColumnDropDifference,
	isTableCreateDifference,
	isTableDropDifference,
} from "~/database/db_changeset.js";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";

type TableDiffContext = {
	localSchema: TableInfo;
	dbSchema: TableInfo;
};

describe("#dbDiff", () => {
	beforeEach((context: TableDiffContext) => {
		context.localSchema = {
			users: {
				name: columnInfoFactory({
					tableName: "users",
					columnName: "name",
					dataType: "varchar",
					defaultValue: "hello",
				}),
				email: columnInfoFactory({
					tableName: "users",
					columnName: "email",
					dataType: "varchar(255)",
					characterMaximumLength: 255,
				}),
			},
			members: {
				name: columnInfoFactory({
					tableName: "members",
					columnName: "name",
					dataType: "varchar",
					defaultValue: "hello",
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
			accounts: {
				name: columnInfoFactory({
					tableName: "accounts",
					columnName: "name",
					dataType: "text",
				}),
			},
			memberships: {
				title: columnInfoFactory({
					tableName: "memberships",
					columnName: "title",
					dataType: "text",
				}),
			},
		};
		context.dbSchema = {
			accounts: {
				name: columnInfoFactory({
					tableName: "accounts",
					columnName: "name",
					dataType: "text",
				}),
			},
			books: {
				name: columnInfoFactory({
					tableName: "books",
					columnName: "name",
					dataType: "text",
				}),
			},
			members: {
				name: columnInfoFactory({
					tableName: "members",
					columnName: "name",
					dataType: "text",
				}),
				email: columnInfoFactory({
					tableName: "members",
					columnName: "email",
					dataType: "text",
				}),
				location: columnInfoFactory({
					tableName: "members",
					columnName: "location",
					dataType: "text",
				}),
			},
		};
	});

	test("results", (context: TableDiffContext) => {
		const diff = dbDiff(context.localSchema, context.dbSchema);
		expect(diff).toStrictEqual({
			added: [
				{
					path: ["users"],
					type: "CREATE",
					value: {
						name: columnInfoFactory({
							tableName: "users",
							columnName: "name",
							dataType: "varchar",
							defaultValue: "hello",
						}),
						email: columnInfoFactory({
							tableName: "users",
							columnName: "email",
							dataType: "varchar(255)",
							characterMaximumLength: 255,
						}),
					},
				},
				{
					path: ["memberships"],
					type: "CREATE",
					value: {
						title: columnInfoFactory({
							tableName: "memberships",
							columnName: "title",
							dataType: "text",
						}),
					},
				},
			],
			removed: [
				{
					path: ["books"],
					type: "REMOVE",
					oldValue: {
						name: columnInfoFactory({
							tableName: "books",
							columnName: "name",
							dataType: "text",
						}),
					},
				},
			],
			changed: {
				members: [
					{
						path: ["members", "name", "dataType"],
						type: "CHANGE",
						value: "varchar",
						oldValue: "text",
					},
					{
						path: ["members", "name", "defaultValue"],
						type: "CHANGE",
						value: "hello",
						oldValue: null,
					},
					{
						path: ["members", "email", "dataType"],
						type: "CHANGE",
						value: "varchar(255)",
						oldValue: "text",
					},
					{
						path: ["members", "email", "characterMaximumLength"],
						type: "CHANGE",
						value: 255,
						oldValue: null,
					},
					{
						path: ["members", "location"],
						type: "REMOVE",
						oldValue: columnInfoFactory({
							tableName: "members",
							columnName: "location",
							dataType: "text",
						}),
					},
					{
						path: ["members", "city"],
						type: "CREATE",
						value: columnInfoFactory({
							tableName: "members",
							columnName: "city",
							dataType: "text",
						}),
					},
				],
			},
		});
	});

	test("difference type guards", (context: TableDiffContext) => {
		const diff = dbDiff(context.localSchema, context.dbSchema);
		for (const added of diff.added) {
			expect(isTableCreateDifference(added)).toBe(true);
		}
		for (const changed of diff.removed) {
			expect(isTableDropDifference(changed)).toBe(true);
		}
		for (const changed of Object.entries(diff.changed)) {
			const changes = changed[1];
			for (const change of changes) {
				if (change.type === "CHANGE") {
					expect(isColumnChangeDifference(change)).toBe(true);
				}
				if (change.type === "CREATE") {
					expect(isColumnCreateDifference(change)).toBe(true);
				}
				if (change.type === "REMOVE") {
					expect(isColumnDropDifference(change)).toBe(true);
				}
			}
		}
	});
});

describe("#dbChangeset", () => {
	test("added tables", () => {
		const changeset = dbChangeset(
			{
				users: {
					name: columnInfoFactory({
						tableName: "users",
						columnName: "name",
						dataType: "varchar",
					}),
				},
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
					}),
				},
				members: {
					name: columnInfoFactory({
						tableName: "members",
						columnName: "name",
						dataType: "varchar",
						defaultValue: "hello",
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
						defaultValue: "hello",
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
			{
				users: {
					name: columnInfoFactory({
						tableName: "users",
						columnName: "name",
						dataType: "varchar",
					}),
				},
				shops: {
					name: columnInfoFactory({
						tableName: "members",
						columnName: "name",
						dataType: "varchar",
						defaultValue: "hello",
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
						defaultValue: "bcn",
					}),
				},
			},
		);

		expect(changeset).toStrictEqual([
			{
				tableName: "books",
				type: "create",
				up: [
					'createTable("books")',
					'addColumn("id", "serial", (col) => col.primaryKey())',
					'addColumn("name", "text")',
				],
				down: ['dropTable("books")'],
			},
			{
				tableName: "members",
				type: "create",
				up: [
					'createTable("members")',
					'addColumn("name", "varchar", (col) => col.defaultTo("hello"))',
					'addColumn("email", "varchar(255)")',
					'addColumn("city", "text", (col) => col.notNull())',
				],
				down: ['dropTable("members")'],
			},
			{
				tableName: "shops",
				type: "drop",
				up: ['dropTable("shops")'],
				down: [
					'createTable("shops")',
					'addColumn("name", "varchar", (col) => col.defaultTo("hello"))',
					'addColumn("email", "varchar(255)")',
					'addColumn("city", "text", (col) => col.notNull())',
				],
			},
			{
				tableName: "samples",
				type: "change",
				up: [
					'alterTable("samples")',
					'dropConstraint("samples_pk")',
					'alterColumn("id", (col) => col.primaryKey())',
				],
				down: [
					'alterTable("samples")',
					'dropConstraint("samples_pk")',
					'alterColumn("name", (col) => col.primaryKey())',
				],
			},
			{
				tableName: "addresses",
				type: "change",
				up: [
					'alterTable("addresses")',
					'alterColumn("name", (col) => col.setDataType("varchar"))',
					'alterColumn("name", (col) => col.setDefault("hello"))',
					'alterColumn("name", (col) => col.setNotNull())',
					'alterColumn("email", (col) => col.setDataType("varchar"))',
					'alterColumn("city", (col) => col.dropDefault())',
					'alterColumn("city", (col) => col.setNotNull())',
					'addColumn("id", "serial", (col) => col.primaryKey())',
					'addColumn("country", "text")',
				],
				down: [
					'alterTable("addresses")',
					'dropColumn("country")',
					'dropColumn("id")',
					'alterColumn("city", (col) => col.dropNotNull())',
					'alterColumn("city", (col) => col.setDefault("bcn"))',
					'alterColumn("email", (col) => col.setDataType("varchar(255)"))',
					'alterColumn("name", (col) => col.dropNotNull())',
					'alterColumn("name", (col) => col.dropDefault())',
					'alterColumn("name", (col) => col.setDataType("text"))',
				],
			},
		]);
	});
});
