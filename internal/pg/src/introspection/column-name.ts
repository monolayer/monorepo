import type { ColumnsToRename } from "~pg/introspection/schema.js";

export function changedColumnNames(
	table: string,
	schemaName: string,
	columnsToRename: ColumnsToRename,
) {
	return columnsToRename[`${schemaName}.${table}`] ?? [];
}

export function previousColumnName(
	tableName: string,
	schemaName: string,
	changedColumName: string,
	columnsToRename: ColumnsToRename,
) {
	return (
		changedColumnNames(tableName, schemaName, columnsToRename).find(
			(column) => {
				return column.to === changedColumName;
			},
		)?.from || changedColumName
	);
}

export function currentColumName(
	tableName: string,
	schemaName: string,
	columnName: string,
	columnsToRename: ColumnsToRename,
) {
	return (
		changedColumnNames(tableName, schemaName, columnsToRename).find(
			(column) => {
				return column.from === columnName;
			},
		)?.to || columnName
	);
}
