import type { ColumnsToRename } from "~/programs/column-diff-prompt.js";

export function changedColumnNames(
	table: string,
	columnsToRename: ColumnsToRename,
) {
	return columnsToRename[table] ?? [];
}

export function previousColumnName(
	tableName: string,
	changedColumName: string,
	columnsToRename: ColumnsToRename,
) {
	return (
		changedColumnNames(tableName, columnsToRename).find((column) => {
			return column.to === changedColumName;
		})?.from || changedColumName
	);
}

export function currentColumName(
	tableName: string,
	previousColumName: string,
	columnsToRename: ColumnsToRename,
) {
	return (
		changedColumnNames(tableName, columnsToRename).find((column) => {
			return column.from === previousColumName;
		})?.to || previousColumName
	);
}
