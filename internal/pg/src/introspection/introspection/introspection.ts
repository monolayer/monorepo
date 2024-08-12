/* eslint-disable max-lines */
import { Kysely, sql } from "kysely";
import toposort from "toposort";
import { toSnakeCase } from "~/helpers/to-snake-case.js";
import {
	dbCheckConstraintInfo,
	localCheckConstraintInfo,
} from "~/introspection/check.js";
import { currentColumName } from "~/introspection/column-name.js";
import {
	dbColumnInfo,
	localColumnInfoByTable,
} from "~/introspection/column-two.js";
import { schemaInDb } from "~/introspection/database-schemas.js";
import { dbEnumInfo, localEnumInfo } from "~/introspection/enum.js";
import { dbExtensionInfo } from "~/introspection/extension.js";
import {
	dbForeignKeyConstraints,
	fetchForeignConstraintInfo,
	localForeignKeyConstraintInfoWithPreviousHash,
	localForeignKeys,
} from "~/introspection/foreign-key.js";
import {
	dbIndexInfo,
	type IndexInfo,
	localIndexInfoByTable,
} from "~/introspection/index.js";
import type { BuilderContext } from "~/introspection/introspection/foreign-key-builder.js";
import { currentTableName } from "~/introspection/introspection/table-name.js";
import type { InformationSchemaDB } from "~/introspection/introspection/types.js";
import {
	dbPrimaryKeyConstraintInfo,
	localPrimaryKeyConstraintInfo,
	primaryKeyConstraintInfoToQuery,
} from "~/introspection/primary-key.js";
import {
	type CheckInfo,
	type ColumnsToRename,
	extractColumnsFromPrimaryKey,
	type ForeignKeyInfo,
	type PrimaryKeyInfo,
	type TablesToRename,
	type TriggerInfo,
	type UniqueInfo,
} from "~/introspection/schema.js";
import { dbTableInfo } from "~/introspection/table-two.js";
import {
	type ForeignKeyIntrospection,
	tableInfo,
} from "~/introspection/table.js";
import { dbTriggerInfo, localTriggersInfo } from "~/introspection/trigger.js";
import {
	dbUniqueConstraintInfo,
	localUniqueConstraintInfo,
} from "~/introspection/unique.js";
import type {
	ColumnInfo,
	SchemaInfo,
	SchemaMigrationInfo,
	TableColumnInfo,
	TableInfo,
} from "~/schema/column/types.js";
import type { AnySchema } from "~/schema/schema.js";

export function introspectLocalSchema(
	schema: AnySchema,
	remoteSchema: SchemaMigrationInfo,
	camelCase: boolean,
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

export async function databaseTableDependencies(
	kysely: Kysely<InformationSchemaDB>,
	schemaName = "public",
	tables: string[] = [],
) {
	if (tables.length == 0) {
		return [];
	}

	const result = await kysely
		.selectFrom("information_schema.table_constraints")
		.fullJoin("information_schema.key_column_usage", (join) =>
			join
				.onRef(
					"information_schema.table_constraints.constraint_name",
					"=",
					"information_schema.key_column_usage.constraint_name",
				)
				.onRef(
					"information_schema.table_constraints.table_schema",
					"=",
					"information_schema.key_column_usage.table_schema",
				),
		)
		.fullJoin("information_schema.constraint_column_usage", (join) =>
			join
				.onRef(
					"information_schema.constraint_column_usage.constraint_name",
					"=",
					"information_schema.key_column_usage.constraint_name",
				)
				.onRef(
					"information_schema.constraint_column_usage.table_schema",
					"=",
					"information_schema.key_column_usage.table_schema",
				),
		)
		.fullJoin("information_schema.columns", (join) =>
			join
				.onRef(
					"information_schema.columns.table_name",
					"=",
					"information_schema.table_constraints.table_name",
				)
				.onRef(
					"information_schema.columns.column_name",
					"=",
					"information_schema.key_column_usage.column_name",
				)
				.onRef(
					"information_schema.columns.table_schema",
					"=",
					"information_schema.table_constraints.table_schema",
				),
		)
		.where(
			"information_schema.table_constraints.constraint_type",
			"=",
			"FOREIGN KEY",
		)
		.where(
			"information_schema.constraint_column_usage.table_schema",
			"=",
			schemaName,
		)
		.where("information_schema.table_constraints.table_name", "in", tables)
		.whereRef(
			"information_schema.table_constraints.table_name",
			"<>",
			"information_schema.constraint_column_usage.table_name",
		)
		.where("information_schema.columns.is_nullable", "=", "NO")
		.select([
			sql<string>`information_schema.table_constraints.table_name`.as(
				"foreigh_key_table",
			),
			sql<string>`information_schema.constraint_column_usage.table_name`.as(
				"primary_key_table",
			),
		])
		.execute();

	const mapped = result.map(
		(row) =>
			[row.foreigh_key_table, row.primary_key_table] as [
				string,
				string | undefined,
			],
	);

	return toposort(mapped);
}

export function localSchemaTableDependencies(
	local: AnySchema,
	allSchemas: AnySchema[],
) {
	const tables = local.tables;
	const entries = Object.entries(tables).reduce(
		(acc, [tableName, table]) => {
			const introspect = tableInfo(table).introspect(allSchemas);
			for (const foreignKey of introspect.foreignKeys) {
				const targetTableName = foreignKey.targetTable.split(".")[1];
				if (targetTableName !== tableName) {
					acc.push([tableName, targetTableName]);
				}
			}
			return acc;
		},
		[] as [string, string | undefined][],
	);
	return toposort(entries);
}
