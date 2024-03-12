import toposort from "toposort";
import type { CamelCaseOptions } from "~/config.js";
import { toSnakeCase } from "../changeset/migration_op/helpers.js";
import type { ColumnsInfo } from "../introspection/columns.js";
import type { EnumInfo } from "../introspection/enums.js";
import type { ExtensionInfo } from "../introspection/extensions.js";
import type { IndexInfo } from "../introspection/indexes.js";
import type { TableColumnInfo } from "../introspection/schemas.js";
import { PgDatabase, type AnyPgDatabase } from "../schema/pg_database.js";
import {
	tableInfo,
	type AnyPgTable,
	type ColumnRecord,
} from "../schema/pg_table.js";

type TableName = string;
type Name = string;
type Definition = string;
export type PrimaryKeyInfo = Record<TableName, Record<Name, Definition>>;
export type ForeignKeyInfo = Record<TableName, Record<Name, Definition>>;
export type UniqueInfo = Record<TableName, Record<Name, Definition>>;
export type TriggerInfo = Record<TableName, Record<Name, Definition>>;

export type MigrationSchema = {
	extensions: ExtensionInfo;
	table: TableColumnInfo;
	index: IndexInfo;
	foreignKeyConstraints: ForeignKeyInfo;
	uniqueConstraints: UniqueInfo;
	primaryKey: PrimaryKeyInfo;
	triggers: TriggerInfo;
	enums: EnumInfo;
};

export function findColumn(
	schema: MigrationSchema,
	tableName: string,
	columName: string,
) {
	const table = schema.table[tableName];
	if (table !== undefined && table[columName] !== undefined) {
		return table[columName];
	}
}

export function primaryKeyColumns(
	columns: ColumnRecord,
	camelCase: CamelCaseOptions,
) {
	return Object.entries(columns).reduce<string[]>(
		(acc, [columnName, column]) => {
			const transformedColumnName = toSnakeCase(columnName, camelCase);
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

export function findPrimaryKey(schema: MigrationSchema, tableName: string) {
	return Object.entries(schema.primaryKey).flatMap(
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
	const [, columns] = pkey.split("PRIMARY KEY (");
	return columns?.replace(/"/g, "").split(")")[0]?.split(", ") || [];
}

export function findForeignKeysTargetTables(
	schema: MigrationSchema,
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

export function buildNodes(droppedTables: string[], remote: MigrationSchema) {
	const nodes = droppedTables.flatMap((droppedTable) => {
		const deps = findForeignKeysTargetTables(remote, droppedTable);
		if (deps.length === 0) {
			return [[droppedTable, undefined] as NodeTuple];
		}
		return deps.map((dep) => [droppedTable, dep] as NodeTuple);
	});
	return toposort(nodes).filter((node) => node !== undefined);
}

export function findColumnByNameInTable(
	table: ColumnsInfo,
	columnName: string,
) {
	const entries = Object.entries(table);
	const column = entries.find(([, value]) => value.columnName === columnName);
	if (column !== undefined) {
		return column[1];
	}
}

export function findTableInDatabaseSchema(
	table: AnyPgTable,
	schema: AnyPgDatabase,
	camelCase: CamelCaseOptions = { enabled: false },
) {
	const tables = PgDatabase.info(schema).tables;
	const tableInSchema = Object.entries(tables || {}).find(
		([, value]) =>
			tableInfo(value).schema.columns === tableInfo(table).schema.columns,
	);
	if (tableInSchema !== undefined) {
		return toSnakeCase(tableInSchema[0], camelCase);
	}
}

export function findTableByNameInDatabaseSchema(
	table: string,
	schema: AnyPgDatabase,
	camelCase: CamelCaseOptions = { enabled: false },
) {
	const tables = PgDatabase.info(schema).tables;
	const tableInSchema = Object.entries(tables || {}).find(
		([tableName]) => tableName === table,
	);
	if (tableInSchema !== undefined) {
		return toSnakeCase(tableInSchema[0], camelCase);
	}
}
