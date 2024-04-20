/* eslint-disable max-lines */
import { Kysely } from "kysely";
import type { CamelCaseOptions } from "~/configuration.js";
import { dbExtensionInfo } from "~/database/extension/introspection.js";
import type { AnySchema } from "~/database/schema/schema.js";
import type { ColumnInfo } from "~/database/schema/table/column/types.js";
import { ForeignKeyBuilder } from "~/database/schema/table/constraints/foreign-key/builder.js";
import { currentTableName } from "~/introspection/table-name.js";
import {
	extractColumnsFromPrimaryKey,
	type CheckInfo,
	type ForeignKeyInfo,
	type PrimaryKeyInfo,
	type TriggerInfo,
	type UniqueInfo,
} from "~/migrations/migration-schema.js";
import type { ColumnsToRename } from "~/programs/column-diff-prompt.js";
import type { TablesToRename } from "~/programs/table-diff-prompt.js";
import { hashValue } from "~/utils.js";
import {
	dbColumnInfo,
	localColumnInfoByTable,
	type TableInfo,
} from "../database/schema/table/column/instrospection.js";
import {
	dbCheckConstraintInfo,
	localCheckConstraintInfo,
} from "../database/schema/table/constraints/check/introspection.js";
import {
	dbForeignKeyConstraintInfo,
	fetchForeignConstraintInfo,
	localForeignKeyConstraintHashes,
	localForeignKeyConstraintInfo,
} from "../database/schema/table/constraints/foreign-key/introspection.js";
import {
	dbPrimaryKeyConstraintInfo,
	localPrimaryKeyConstraintInfo,
	primaryKeyConstraintInfoToQuery,
} from "../database/schema/table/constraints/primary-key/introspection.js";
import {
	dbUniqueConstraintInfo,
	localUniqueConstraintInfo,
} from "../database/schema/table/constraints/unique/introspection.js";
import {
	dbIndexInfo,
	localIndexInfoByTable,
	type IndexInfo,
} from "../database/schema/table/index/introspection.js";
import { dbTableInfo } from "../database/schema/table/introspection.js";
import {
	dbTriggerInfo,
	localTriggersInfo,
} from "../database/schema/table/trigger/introspection.js";
import {
	dbEnumInfo,
	localEnumInfo,
	type EnumInfo,
} from "../database/schema/types/enum/introspection.js";
import { currentColumName } from "./column-name.js";

export function introspectLocalSchema(
	schema: AnySchema,
	remoteSchema: SchemaMigrationInfo,
	camelCase: CamelCaseOptions = { enabled: false },
	tablesToRename: TablesToRename = [],
	columnsToRename: ColumnsToRename = {},
): SchemaMigrationInfo {
	const foreignKeyInfo = localForeignKeyConstraintInfo(
		schema,
		camelCase,
		tablesToRename,
		columnsToRename,
	);
	const foreignKeyHashes = localForeignKeyConstraintHashes(
		schema,
		camelCase,
		tablesToRename,
		columnsToRename,
	);
	return {
		table: localColumnInfoByTable(schema, remoteSchema, camelCase),
		index: localIndexInfoByTable(schema, camelCase, columnsToRename),
		foreignKeyConstraints: foreignKeyInfo,
		uniqueConstraints: localUniqueConstraintInfo(
			schema,
			camelCase,
			columnsToRename,
		),
		checkConstraints: localCheckConstraintInfo(
			schema,
			camelCase,
			columnsToRename,
		),
		primaryKey: localPrimaryKeyConstraintInfo(
			schema,
			camelCase,
			columnsToRename,
		),
		triggers: {
			...localTriggersInfo(schema, camelCase),
		},
		enums: localEnumInfo(schema),
		foreignKeyNames: foreignKeyHashes,
	};
}

export async function introspectRemoteSchema(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	schemaName = "public",
) {
	const remoteTableInfo = await dbTableInfo(kysely, schemaName);

	const tables = remoteTableInfo.reduce<string[]>((acc, table) => {
		if (table.name !== null) acc.push(table.name);
		return acc;
	}, []);

	const remoteColumnInfo = await dbColumnInfo(kysely, schemaName, tables);

	const remoteIndexInfo = await dbIndexInfo(kysely, schemaName, tables);

	const remoteUniqueConstraintInfo = await dbUniqueConstraintInfo(
		kysely,
		schemaName,
		tables,
	);

	const remoteForeignKeyConstraints = await fetchForeignConstraintInfo(
		kysely,
		schemaName,
		tables,
	);

	const remoteConstraintHashes = remoteForeignKeyConstraints.reduce(
		(acc, result) => {
			const dbHash = result.conname!.match(/^\w+_(\w+)_yount_fk$/)![1];
			const recomputedHash = hashValue(
				ForeignKeyBuilder.toStatement({
					...result,
					isExternal: false,
				}),
			);
			const table = result.table;
			if (table !== null) {
				acc[table] = {
					...acc[table],
					...{ [`${recomputedHash}`]: `${table}:${dbHash}` },
				};
			}
			return acc;
		},
		{} as Record<string, Record<string, string>>,
	);

	const remoteForeignKeyConstraintInfo = await dbForeignKeyConstraintInfo(
		remoteForeignKeyConstraints,
	);

	const primaryKeyConstraintInfo = await dbPrimaryKeyConstraintInfo(
		kysely,
		schemaName,
		tables,
	);

	const triggerInfo = await dbTriggerInfo(kysely, schemaName, tables);

	const enumInfo = await dbEnumInfo(kysely, schemaName);

	const remoteCheckConstraintInfo = await dbCheckConstraintInfo(
		kysely,
		schemaName,
		tables,
	);

	const migrationSchema: SchemaMigrationInfo = {
		table: remoteColumnInfo,
		index: remoteIndexInfo,
		foreignKeyConstraints: remoteForeignKeyConstraintInfo,
		uniqueConstraints: remoteUniqueConstraintInfo,
		checkConstraints: remoteCheckConstraintInfo,
		primaryKey: primaryKeyConstraintInfo,
		triggers: triggerInfo,
		enums: enumInfo,
		foreignKeyNames: remoteConstraintHashes,
	};
	return migrationSchema;
}

export async function remoteExtensions(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
) {
	const extensions = await dbExtensionInfo(kysely);
	return {
		extensions,
	};
}

export type DbTableInfo = {
	table: TableColumnInfo;
	index?: IndexInfo;
};

export type TableColumnInfo = Record<string, TableInfo>;

export type LocalTableInfo = {
	table: TableColumnInfo;
	index?: IndexInfo;
};

export type SchemaMigrationInfo = {
	table: TableColumnInfo;
	index: IndexInfo;
	foreignKeyConstraints: ForeignKeyInfo;
	uniqueConstraints: UniqueInfo;
	checkConstraints: CheckInfo;
	primaryKey: PrimaryKeyInfo;
	triggers: TriggerInfo;
	enums: EnumInfo;
	foreignKeyNames?: Record<string, Record<string, string>>;
};

export function renameTables(
	remote: SchemaMigrationInfo,
	tablesToRename: TablesToRename,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	columnsToRename: ColumnsToRename,
) {
	const renamedTables = Object.entries(remote.table).reduce(
		(acc, [table, schema]) => {
			const current = currentTableName(table, tablesToRename);
			const renamedColumns = Object.entries(schema.columns).reduce(
				(schemaAcc, [column, info]) => {
					schemaAcc[column] = {
						...info,
					};
					return schemaAcc;
				},
				{} as Record<string, ColumnInfo>,
			);
			acc[current] = {
				name: schema.name,
				columns: renamedColumns,
			};
			return acc;
		},
		{} as TableColumnInfo,
	);

	const renamedIndexes = Object.entries(remote.index).reduce(
		(acc, [table, indexes]) => {
			const current = currentTableName(table, tablesToRename);
			acc[current] = indexes;
			return acc;
		},
		{} as IndexInfo,
	);

	const renamedForeignKeys = Object.entries(
		remote.foreignKeyConstraints,
	).reduce((acc, [table, foreignKeys]) => {
		const current = currentTableName(table, tablesToRename);
		acc[current] = foreignKeys;
		return acc;
	}, {} as ForeignKeyInfo);

	const renamedUniqueConstraints = Object.entries(
		remote.uniqueConstraints,
	).reduce((acc, [table, uniqueConstraints]) => {
		const current = currentTableName(table, tablesToRename);
		acc[current] = uniqueConstraints;
		return acc;
	}, {} as UniqueInfo);

	const renamedCheckConstraints = Object.entries(
		remote.checkConstraints,
	).reduce((acc, [table, checkConstraints]) => {
		const current = currentTableName(table, tablesToRename);
		acc[current] = checkConstraints;
		return acc;
	}, {} as CheckInfo);

	const renamedPrimaryKeys = Object.entries(remote.primaryKey).reduce(
		(acc, [table, primaryKey]) => {
			const current = currentTableName(table, tablesToRename);
			Object.entries(primaryKey).reduce(
				(acc, [primaryKey, info]) => {
					const extractedColumns = extractColumnsFromPrimaryKey(info).map(
						(column) => {
							return currentColumName(current, column, columnsToRename);
						},
					);
					acc[primaryKey] = primaryKeyConstraintInfoToQuery({
						constraintType: "PRIMARY KEY",
						table: table,
						columns: extractedColumns,
					});
					return acc;
				},
				{} as Record<string, string>,
			);
			acc[current] = primaryKey;
			return acc;
		},
		{} as PrimaryKeyInfo,
	);

	const renamedTriggers = Object.entries(remote.triggers).reduce(
		(acc, [table, triggers]) => {
			const current = currentTableName(table, tablesToRename);
			acc[current] = triggers;
			return acc;
		},
		{} as TriggerInfo,
	);
	const renamedSchema: SchemaMigrationInfo = {
		table: renamedTables,
		index: renamedIndexes,
		foreignKeyConstraints: renamedForeignKeys,
		uniqueConstraints: renamedUniqueConstraints,
		checkConstraints: renamedCheckConstraints,
		primaryKey: renamedPrimaryKeys,
		triggers: renamedTriggers,
		enums: remote.enums,
		foreignKeyNames: remote.foreignKeyNames,
	};
	return renamedSchema;
}

export function renameRemoteColums(
	remote: SchemaMigrationInfo,
	columnsToRename: ColumnsToRename,
) {
	return Object.entries(remote.table).reduce(
		(acc, [tableName, tableInfo]) => {
			const tableColumns = Object.entries(tableInfo.columns);
			const renamedColumns = tableColumns.reduce(
				(tcAcc, [columnName, columnInfo]) => {
					currentColumName(tableName, columnName, columnsToRename);
					tcAcc[currentColumName(tableName, columnName, columnsToRename)] =
						columnInfo;
					return tcAcc;
				},
				{} as Record<string, ColumnInfo>,
			);
			acc[tableName] = {
				name: tableInfo.name,
				columns: renamedColumns,
			};
			return acc;
		},
		{} as Record<string, TableInfo>,
	);
}
