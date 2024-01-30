import { PgColumn, columnMeta } from "~/database/schema/columns.js";
import { TableRecord, pgDatabase } from "~/database/schema/database.js";
import { TableSchema, pgTable } from "~/database/schema/table.js";
import { ColumnInfo } from "./column_info.js";
import { ColumnsInfo, TableInfo } from "./table_diff.js";

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

export function schemaDBTableInfo<
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	T extends pgDatabase<TableRecord<Record<string, pgTable<string, any>>>>,
>(schema: T) {
	return Object.entries(schema.tables || []).reduce<TableInfo>(
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
