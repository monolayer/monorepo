import toposort from "toposort";
import type { CamelCaseOptions } from "~/configuration.js";
import { type ColumnRecord } from "~/database/schema/table/table-column.js";
import type { AnyPgTable } from "~/database/schema/table/table.js";
import { currentColumName } from "~/introspection/column-name.js";
import { tableInfo } from "~/introspection/helpers.js";
import type { ColumnsToRename } from "~/introspection/introspect-schemas.js";
import { SchemaMigrationInfo } from "~/introspection/introspection.js";
import { toSnakeCase } from "../changeset/helpers.js";
import { Schema, type AnySchema } from "../database/schema/schema.js";
import type { TableInfo } from "../database/schema/table/column/instrospection.js";

type TableName = string;
type Name = string;
type Definition = string;
export type PrimaryKeyInfo = Record<TableName, Record<Name, Definition>>;
export type ForeignKeyInfo = Record<TableName, Record<Name, Definition>>;
export type UniqueInfo = Record<TableName, Record<Name, Definition>>;
export type TriggerInfo = Record<TableName, Record<Name, Definition>>;
export type CheckInfo = Record<TableName, Record<Name, Definition>>;

export function findColumn(columName: string, schemaTable?: TableInfo) {
	const table = schemaTable;
	if (table !== undefined && table.columns[columName] !== undefined) {
		return table.columns[columName];
	}
}

export function primaryKeyColumns(
	columns: ColumnRecord,
	camelCase: CamelCaseOptions,
	tableName: string,
	columnsToRename: ColumnsToRename,
	schemaName: string,
) {
	return Object.entries(columns).reduce<string[]>(
		(acc, [columnName, column]) => {
			const transformedColumnName = currentColumName(
				tableName,
				schemaName,
				toSnakeCase(columnName, camelCase),
				columnsToRename,
			);
			const primaryKey = Object.fromEntries(Object.entries(column))
				._primaryKey as boolean;
			if (primaryKey === true) {
				acc.push(transformedColumnName);
			}
			return acc;
		},
		[],
	);
}

export function findPrimaryKey(
	tableName: string,
	primaryKeyInfo?: PrimaryKeyInfo,
) {
	return Object.entries(primaryKeyInfo || {}).flatMap(
		([schemaTableName, primaryKeyRecord]) => {
			if (schemaTableName === tableName) {
				for (const primaryKeyDefinition of Object.values(primaryKeyRecord)) {
					return extractColumnsFromPrimaryKey(primaryKeyDefinition);
				}
			}
			return [];
		},
	);
}

export function extractColumnsFromPrimaryKey(pkey: string) {
	const [, columns] = pkey.split("(");
	return columns?.replace(/"/g, "").split(")")[0]?.split(", ") || [];
}

export function findForeignKeysTargetTables(
	schema: SchemaMigrationInfo,
	tableName: string,
) {
	const foreignKeys = schema.foreignKeyConstraints[tableName];
	if (foreignKeys === undefined) {
		return [];
	}
	return Object.values(foreignKeys).flatMap((fk) => {
		const [, targetTable] = fk.split("REFERENCES ");
		if (targetTable !== undefined) {
			const targetTables = targetTable.split(" (")[0];
			if (targetTables !== undefined) {
				return targetTables.replace(/"/g, "");
			}
		}
		return [];
	});
}

type NodeTuple = [string, string | undefined];

export function buildNodes(
	droppedTables: string[],
	remote: SchemaMigrationInfo,
) {
	const nodes = droppedTables.flatMap((droppedTable) => {
		const deps = findForeignKeysTargetTables(remote, droppedTable);
		if (deps.length === 0) {
			return [[droppedTable, undefined] as NodeTuple];
		}
		return deps.map((dep) => [droppedTable, dep] as NodeTuple);
	});
	return toposort(nodes).filter((node) => node !== undefined);
}

export function findColumnByNameInTable(table: TableInfo, columnName: string) {
	const entries = Object.entries(table.columns);
	const column = entries.find(([, value]) => value.columnName === columnName);
	if (column !== undefined) {
		return column[1];
	}
}

export function columnNameKey(table: TableInfo, columnName: string) {
	const entries = Object.entries(table.columns);
	const column = entries.find(([, value]) => value.columnName === columnName);
	if (column !== undefined) {
		return column[0];
	}
}

export function tableNameInSchema(
	table: AnyPgTable,
	schema: AnySchema,
	camelCase: CamelCaseOptions = { enabled: false },
) {
	const tableInSchema = findTable(table, schema);
	if (tableInSchema !== undefined) {
		return toSnakeCase(tableInSchema[0], camelCase);
	}
}

export function findTable(table: AnyPgTable, schema: AnySchema) {
	const tables = Schema.info(schema).tables;
	return Object.entries(tables || {}).find(
		([, value]) =>
			tableInfo(value).definition.columns ===
			tableInfo(table).definition.columns,
	);
}

export function findTableByNameInDatabaseSchema(
	table: string,
	schema: AnySchema,
	camelCase: CamelCaseOptions = { enabled: false },
) {
	const tables = Schema.info(schema).tables;
	const tableInSchema = Object.entries(tables || {}).find(
		([tableName]) => tableName === table,
	);
	if (tableInSchema !== undefined) {
		return toSnakeCase(tableInSchema[0], camelCase);
	}
}
