import toposort from "toposort";
import { toSnakeCase } from "~pg/helpers/to-snake-case.js";
import { currentColumName } from "~pg/introspection/column-name.js";
import type { ColumnRecord } from "~pg/schema/column.js";
import type {
	SchemaMigrationInfo,
	TableInfo,
} from "~pg/schema/column/types.js";
import { type AnySchema, Schema } from "~pg/schema/schema.js";
import type { AnyPgTable } from "~pg/schema/table.js";

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
	camelCase: boolean,
	tableName: string,
	columnsToRename: ColumnsToRename,
	schemaName: string,
) {
	return (Object.entries(columns) ?? []).reduce<string[]>(
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
	camelCase: boolean = false,
) {
	const tableInSchema = findTable(table, schema);
	if (tableInSchema !== undefined) {
		return toSnakeCase(tableInSchema[0], camelCase);
	}
}

export function findTable(table: AnyPgTable, schema: AnySchema) {
	const tables = Schema.info(schema).tables;
	return Object.entries(tables || {}).find(
		([, value]) => table.columns === value.columns,
	);
}

export function findTableByNameInDatabaseSchema(
	table: string,
	schema: AnySchema,
	camelCase: boolean = false,
) {
	const tables = Schema.info(schema).tables;
	const tableInSchema = Object.entries(tables || {}).find(
		([tableName]) => tableName === table,
	);
	if (tableInSchema !== undefined) {
		return toSnakeCase(tableInSchema[0], camelCase);
	}
}

export type TablesToRename = {
	from: string;
	to: string;
}[];

export type ColumnsToRename = Record<
	string,
	{
		from: string;
		to: string;
	}[]
>;
