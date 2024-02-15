import { type ColumnInfo, ColumnUnique } from "../schema/pg_column.js";
import { sqlStatement } from "./helpers.js";

export type ColumnsInfoDiff = Record<string, ColumnInfoDiff>;

export type ColumnInfoDiff = Omit<ColumnInfo, "defaultValue"> & {
	defaultValue: string;
};

export function tableColumnsOps(columnsInfo: ColumnsInfoDiff) {
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

export function foreignKeyConstraint(column: ColumnInfoDiff) {
	if (column.foreignKeyConstraint === null) return "";
	const options = column.foreignKeyConstraint.options.split(";");
	return [
		`.addForeignKeyConstraint("${column.tableName}_${column.columnName}_fkey",`,
		`["${column.columnName}"], "${column.foreignKeyConstraint.table}",`,
		`["${column.foreignKeyConstraint.column}"], (cb) => cb.onDelete("${options[0]}").onUpdate("${options[1]}"))`,
	].join(" ");
}

export function optionsForColumn(column: ColumnInfoDiff) {
	let columnOptions = "";
	const options = [];

	if (column.isNullable === false) options.push("notNull()");
	if (column.primaryKey === true) options.push("primaryKey()");
	if (column.identity === "ALWAYS") options.push("generatedAlwaysAsIdentity()");
	if (column.identity === "BY DEFAULT")
		options.push("generatedByDefaultAsIdentity()");
	if (column.unique === ColumnUnique.NullsDistinct) options.push("unique()");
	if (column.unique === ColumnUnique.NullsNotDistinct)
		options.push("unique().nullsNotDistinct()");

	if (column.defaultValue !== null) {
		options.push(`defaultTo(${sqlStatement(column.defaultValue)})`);
	}
	if (options.length !== 0)
		columnOptions = `, (col) => col.${options.join(".")}`;
	return columnOptions;
}
