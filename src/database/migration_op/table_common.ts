import { type ColumnInfo } from "../schema/pg_column.js";
import { sqlStatement } from "./helpers.js";
export type ColumnsInfoDiff = Record<string, ColumnInfoDiff>;

export type ColumnInfoDiff = Omit<ColumnInfo, "defaultValue"> & {
	defaultValue: string;
};

export function tableColumnsOps(columnsInfo: ColumnsInfoDiff) {
	return Object.entries(columnsInfo).flatMap(([, column]) => {
		const base = [
			`addColumn("${column.columnName}", ${compileDataType(
				column.dataType,
				column.enum,
			)}${optionsForColumn(column)})`,
		];
		return base;
	});
}

export function optionsForColumn(column: ColumnInfoDiff) {
	let columnOptions = "";
	const options = [];

	if (column.isNullable === false) options.push("notNull()");
	if (column.identity === "ALWAYS") options.push("generatedAlwaysAsIdentity()");
	if (column.identity === "BY DEFAULT")
		options.push("generatedByDefaultAsIdentity()");

	if (column.defaultValue !== null) {
		options.push(`defaultTo(${sqlStatement(column.defaultValue)})`);
	}
	if (options.length !== 0)
		columnOptions = `, (col) => col.${options.join(".")}`;
	return columnOptions;
}

export function compileDataType(dataType: string, isEnum: boolean) {
	if (isEnum) {
		return `sql\`${dataType}\``;
	}
	if (dataType === "smallint") {
		return "sql`smallint`";
	}
	return `"${dataType}"`;
}
