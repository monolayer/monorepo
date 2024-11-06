import { assert } from "vitest";
import type { ColumnInfo } from "~db-push/changeset/types/schema.js";

export function assertTableColumnNames(
	table: {
		name: string;
		columns: Record<string, ColumnInfo>;
	},
	names: string[],
) {
	const columnNames = Object.keys(table.columns).toSorted();
	assert.deepStrictEqual(columnNames, names.toSorted());
}

export function assertTableColumn(
	table: {
		name: string;
		columns: Record<string, ColumnInfo>;
	},
	info: ColumnInfo & { columnName: string },
) {
	const column = table.columns[info.columnName];
	assert(
		column,
		`Column "${info.columnName}" is undefined. Defined Columns: ${Object.keys(table.columns)}`,
	);
	assert.deepStrictEqual(column, info);
	return column;
}
