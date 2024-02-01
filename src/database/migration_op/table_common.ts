import { ColumnInfo, ColumnsInfo } from "../introspection/types.js";

export function tableColumnsOps(columnsInfo: ColumnsInfo) {
	return Object.entries(columnsInfo).map(([_, column]) => {
		return `addColumn(\"${column.columnName}\", \"${
			column.dataType
		}\"${optionsForColumn(column)})`;
	});
}

export function optionsForColumn(column: ColumnInfo) {
	let columnOptions = "";
	const options = [];

	if (column.isNullable === false) options.push("notNull()");
	if (column.primaryKey === true) options.push("primaryKey()");
	if (column.defaultValue !== null)
		options.push(`defaultTo(\"${column.defaultValue}\")`);
	if (options.length !== 0)
		columnOptions = `, (col) => col.${options.join(".")}`;
	return columnOptions;
}
