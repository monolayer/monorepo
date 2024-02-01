import { ColumnInfo, ColumnsInfo } from "../introspection/types.js";

export function tableColumnsOps(columnsInfo: ColumnsInfo) {
	return Object.entries(columnsInfo).flatMap(([_, column]) => {
		const base = [
			`addColumn(\"${column.columnName}\", \"${
				column.dataType
			}\"${optionsForColumn(column)})`,
			foreignKeyConstraint(column),
		];
		return base;
	});
}

export function foreignKeyConstraint(column: ColumnInfo) {
	if (column.foreignKeyConstraint === null) return "";
	return [
		`.addForeignKeyConstraint("${column.tableName}_${column.columnName}_fkey",`,
		`["${column.columnName}"], "${column.foreignKeyConstraint.table}",`,
		`["${column.foreignKeyConstraint.column}"])`,
	].join(" ");
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
