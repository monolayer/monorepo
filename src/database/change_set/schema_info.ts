import { PgColumn, columnMeta } from "~/database/schema/columns.js";
import { pgDatabase } from "~/database/schema/database.js";
import { TableSchema, pgTable } from "~/database/schema/table.js";
import { pgIndex } from "../schema/indexes.js";
import { ColumnsInfo, TableColumnInfo, TableIndexInfo } from "./diff.js";
import { ColumnInfo } from "./info.js";

export function schemaTableInfo(tables: pgTable<string, TableSchema>[]) {
	return tables.map((table) => ({
		tableName: table.name,
		schemaName: "public",
	}));
}

export function schemaColumnInfo(
	tableName: string,
	columnName: string,
	column: PgColumn,
): ColumnInfo {
	const meta = columnMeta<typeof column>(column);
	return {
		tableName: tableName,
		columnName: columnName,
		dataType: meta.dataType,
		characterMaximumLength: meta.characterMaximumLength,
		datetimePrecision: meta.datetimePrecision,
		isNullable: meta.isNullable,
		numericPrecision: meta.numericPrecision,
		numericScale: meta.numericScale,
		renameFrom: meta.renameFrom,
		primaryKey: meta.primaryKey,
		defaultValue: meta.defaultValue ? meta.defaultValue.toString() : null,
	};
}

export function schemaDBColumnInfoByTable(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	schema: pgDatabase<Record<string, pgTable<string, any>>>,
) {
	return Object.entries(schema.tables || []).reduce<TableColumnInfo>(
		(acc, [tableName, tableDefinition]) => {
			const columns = Object.entries(tableDefinition.columns || []);
			acc[tableName] = columns.reduce<ColumnsInfo>(
				(columnAcc, [columnName, column]) => {
					columnAcc[columnName] = schemaColumnInfo(
						tableName,
						columnName,
						column as PgColumn,
					);
					return columnAcc;
				},
				{},
			);
			return acc;
		},
		{},
	);
}

export function schemaDBIndexInfoByTable(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	schema: pgDatabase<Record<string, pgTable<string, any>>>,
) {
	return Object.entries(schema.tables || []).reduce<TableIndexInfo>(
		(acc, [tableName, tableDefinition]) => {
			const indexes = tableDefinition.indexes as pgIndex[] | undefined;
			for (const index of indexes || []) {
				// const indexName = index.name;
				acc[tableName] = [...(acc[tableName] || []), ...[index]];
			}
			return acc;
		},
		{},
	);
}
