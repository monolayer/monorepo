import type { ColumnsToRename } from "~/programs/column-diff-prompt.js";

export function previousColumnName(
	tableName: string,
	changedColumName: string,
	columnsToRename: ColumnsToRename,
) {
	const renamedTableColums = columnsToRename[tableName];
	if (renamedTableColums === undefined) {
		return changedColumName;
	}
	return (
		renamedTableColums.find((column) => {
			return column.to === changedColumName;
		})?.from || changedColumName
	);
}

export function currentColumName(
	tableName: string,
	previousColumName: string,
	columnsToRename: ColumnsToRename,
) {
	const renamedTableColums = columnsToRename[tableName];
	if (renamedTableColums === undefined) {
		return previousColumName;
	}
	return (
		renamedTableColums.find((column) => {
			return column.from === previousColumName;
		})?.to || previousColumName
	);
}
