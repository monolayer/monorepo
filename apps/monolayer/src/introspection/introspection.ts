/* eslint-disable max-lines */
import { Kysely } from "kysely";
import { toSnakeCase } from "~/changeset/helpers.js";
import type { CamelCaseOptions } from "~/configuration.js";
import { schemaInDb } from "~/database/database_schemas/introspection.js";
import { dbExtensionInfo } from "~/database/extension/introspection.js";
import type { ForeignKeyIntrospection } from "~/database/schema/introspect-table.js";
import { type AnySchema } from "~/database/schema/schema.js";
import type { ColumnInfo } from "~/database/schema/table/column/types.js";
import type { BuilderContext } from "~/database/schema/table/constraints/foreign-key/builder.js";
import type {
	ColumnsToRename,
	TablesToRename,
} from "~/introspection/introspect-schemas.js";
import {
	extractColumnsFromPrimaryKey,
	type CheckInfo,
	type ForeignKeyInfo,
	type PrimaryKeyInfo,
	type TriggerInfo,
	type UniqueInfo,
} from "~/introspection/schema.js";
import { currentTableName } from "~/introspection/table-name.js";
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
	dbForeignKeyConstraints,
	fetchForeignConstraintInfo,
	localForeignKeyConstraintInfoWithPreviousHash,
	localForeignKeys,
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
import {
	databaseTableDependencies,
	localSchemaTableDependencies,
} from "./dependencies.js";

export function introspectLocalSchema(
	schema: AnySchema,
	remoteSchema: SchemaMigrationInfo,
	camelCase: CamelCaseOptions = { enabled: false },
	tablesToRename: TablesToRename = [],
	columnsToRename: ColumnsToRename = {},
	schemaName: string,
	allSchemas: AnySchema[],
): SchemaMigrationInfo {
	const foreignKeyInfo = localForeignKeyConstraintInfoWithPreviousHash(
		schema,
		camelCase,
		tablesToRename,
		columnsToRename,
		allSchemas,
	);
	const foreignKeyDefinitions = localForeignKeys(
		schema,
		camelCase,
		tablesToRename,
		columnsToRename,
		allSchemas,
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
		tablePriorities: localSchemaTableDependencies(schema, allSchemas),
		schemaInfo:
			schemaName === "public"
				? {}
				: { [toSnakeCase(schemaName, camelCase)]: true },
		foreignKeyDefinitions,
	};
}

export async function introspectRemoteSchema(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	schemaName = "public",
	builderContext: BuilderContext,
) {
	const remoteTableInfo = await dbTableInfo(kysely, schemaName);

	const tables = remoteTableInfo.reduce<string[]>((acc, table) => {
		if (table.name !== null) acc.push(table.name);
		return acc;
	}, []);

	const tablePriorities = await databaseTableDependencies(
		kysely,
		schemaName,
		tables,
	);

	const remoteColumnInfo = await dbColumnInfo(kysely, schemaName, tables);

	const remoteIndexInfo = await dbIndexInfo(
		kysely,
		schemaName,
		tables,
		builderContext,
	);

	const remoteUniqueConstraintInfo = await dbUniqueConstraintInfo(
		kysely,
		schemaName,
		tables,
		builderContext,
	);

	const remoteForeignKeyConstraints = await fetchForeignConstraintInfo(
		kysely,
		schemaName,
		tables,
		builderContext,
	);

	const remoteForeignKeyConstraintInfo = await dbForeignKeyConstraints(
		remoteForeignKeyConstraints,
		builderContext,
	);

	const primaryKeyConstraintInfo = await dbPrimaryKeyConstraintInfo(
		kysely,
		schemaName,
		tables,
	);

	const triggerInfo = await dbTriggerInfo(
		kysely,
		schemaName,
		tables,
		builderContext,
	);

	const enumInfo = await dbEnumInfo(kysely, schemaName);

	const remoteCheckConstraintInfo = await dbCheckConstraintInfo(
		kysely,
		schemaName,
		tables,
		builderContext,
	);

	const schemaInfo = (await schemaInDb(kysely, schemaName)).reduce(
		(acc, schema) => {
			acc[schema.name] = true;
			return acc;
		},
		{} as SchemaInfo,
	);

	const migrationSchema: SchemaMigrationInfo = {
		table: remoteColumnInfo,
		index: remoteIndexInfo,
		foreignKeyConstraints: remoteForeignKeyConstraintInfo.info,
		uniqueConstraints: remoteUniqueConstraintInfo,
		checkConstraints: remoteCheckConstraintInfo,
		primaryKey: primaryKeyConstraintInfo,
		triggers: triggerInfo,
		enums: enumInfo,
		tablePriorities,
		schemaInfo,
		foreignKeyDefinitions: remoteForeignKeyConstraintInfo.definitions,
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

export type SchemaInfo = Record<string, boolean>;

export type SchemaMigrationInfo = {
	table: TableColumnInfo;
	index: IndexInfo;
	foreignKeyConstraints: ForeignKeyInfo;
	uniqueConstraints: UniqueInfo;
	checkConstraints: CheckInfo;
	primaryKey: PrimaryKeyInfo;
	triggers: TriggerInfo;
	enums: EnumInfo;
	foreignKeyDefinitions?: Record<
		string,
		Record<string, ForeignKeyIntrospection>
	>;
	tablePriorities: string[];
	schemaInfo: SchemaInfo;
};

export function renameTables(
	remote: SchemaMigrationInfo,
	tablesToRename: TablesToRename,
	columnsToRename: ColumnsToRename,
	schemaName: string,
) {
	const renamedTables = Object.entries(remote.table).reduce(
		(acc, [table, schema]) => {
			const current = currentTableName(table, tablesToRename, schemaName);
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
			const current = currentTableName(table, tablesToRename, schemaName);
			acc[current] = indexes;
			return acc;
		},
		{} as IndexInfo,
	);

	const renamedForeignKeys = Object.entries(
		remote.foreignKeyConstraints,
	).reduce((acc, [table, foreignKeys]) => {
		const current = currentTableName(table, tablesToRename, schemaName);
		acc[current] = foreignKeys;
		return acc;
	}, {} as ForeignKeyInfo);

	const renamedForeignKeysDefinitions = Object.entries(
		remote.foreignKeyDefinitions || {},
	).reduce(
		(acc, [table, foreignKeys]) => {
			const current = currentTableName(table, tablesToRename, schemaName);
			acc[current] = foreignKeys;
			return acc;
		},
		{} as Record<string, Record<string, ForeignKeyIntrospection>>,
	);

	const renamedUniqueConstraints = Object.entries(
		remote.uniqueConstraints,
	).reduce((acc, [table, uniqueConstraints]) => {
		const current = currentTableName(table, tablesToRename, schemaName);
		acc[current] = uniqueConstraints;
		return acc;
	}, {} as UniqueInfo);

	const renamedCheckConstraints = Object.entries(
		remote.checkConstraints,
	).reduce((acc, [table, checkConstraints]) => {
		const current = currentTableName(table, tablesToRename, schemaName);
		acc[current] = checkConstraints;
		return acc;
	}, {} as CheckInfo);

	const renamedPrimaryKeys = Object.entries(remote.primaryKey).reduce(
		(acc, [table, primaryKey]) => {
			const current = currentTableName(table, tablesToRename, schemaName);
			Object.entries(primaryKey).reduce(
				(acc, [primaryKey, info]) => {
					const extractedColumns = extractColumnsFromPrimaryKey(info).map(
						(column) => {
							return currentColumName(
								current,
								schemaName,
								column,
								columnsToRename,
							);
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
			const current = currentTableName(table, tablesToRename, schemaName);
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
		tablePriorities: remote.tablePriorities,
		schemaInfo: remote.schemaInfo,
		foreignKeyDefinitions: renamedForeignKeysDefinitions,
	};
	return renamedSchema;
}

export function renameRemoteColums(
	remote: SchemaMigrationInfo,
	columnsToRename: ColumnsToRename,
	schemaName: string,
) {
	return Object.entries(remote.table).reduce(
		(acc, [tableName, tableInfo]) => {
			const tableColumns = Object.entries(tableInfo.columns);
			const renamedColumns = tableColumns.reduce(
				(tcAcc, [columnName, columnInfo]) => {
					currentColumName(tableName, schemaName, columnName, columnsToRename);
					tcAcc[
						currentColumName(tableName, schemaName, columnName, columnsToRename)
					] = columnInfo;
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
