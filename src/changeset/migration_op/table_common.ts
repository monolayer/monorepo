import { type ColumnInfo } from "../../schema/pg_column.js";
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

export function tableColumnsComments(columnsInfo: ColumnsInfoDiff) {
	return Object.entries(columnsInfo).flatMap(([, column]) => {
		if (column.defaultValue !== null) {
			const valueAndHash = toValueAndHash(column.defaultValue);
			return [
				`await sql\`COMMENT ON COLUMN "${column.tableName}"."${column.columnName}" IS '${valueAndHash.hash}'\`.execute(db);`,
			];
		} else {
			return [];
		}
	});
}

interface DefaultValueAndHash {
	value?: string;
	hash?: string;
}

export function toValueAndHash(value: string) {
	const match = value.match(/(\w+):(.+)/);

	const valueAndHash: DefaultValueAndHash = {};

	if (match !== null && match[1] !== undefined && match[2] !== undefined) {
		valueAndHash.hash = match[1];
		valueAndHash.value = match[2];
	}
	return valueAndHash;
}

export function optionsForColumn(column: ColumnInfoDiff) {
	let columnOptions = "";
	const options = [];

	if (column.isNullable === false) options.push("notNull()");
	if (column.identity === "ALWAYS") options.push("generatedAlwaysAsIdentity()");
	if (column.identity === "BY DEFAULT")
		options.push("generatedByDefaultAsIdentity()");

	if (column.defaultValue !== null) {
		const defaultValueAndHash = toValueAndHash(String(column.defaultValue));

		options.push(`defaultTo(${sqlStatement(defaultValueAndHash.value ?? "")})`);
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
	if (dataType.includes("timetz(")) {
		return `sql\`${dataType}\``;
	}
	if (isStringColumn(dataType)) {
		return `sql\`${dataType}\``;
	}
	return `"${dataType}"`;
}

function isStringColumn(dataType: string) {
	switch (dataType) {
		case "tsvector":
		case "tsquery":
		case "xml":
			return true;
		default:
			return false;
	}
}
