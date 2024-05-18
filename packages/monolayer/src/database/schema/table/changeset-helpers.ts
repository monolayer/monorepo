/* eslint-disable complexity */
import { sqlStatement } from "../../../changeset/helpers.js";
import { type ColumnInfo } from "./column/types.js";
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
	if (dataType.includes("character(")) {
		return `sql\`${dataType}\``;
	}
	if (dataType.includes("character varying(")) {
		return `sql\`${dataType}\``;
	}
	if (dataType.includes("with time zone")) {
		return `sql\`${dataType}\``;
	}
	if (useSqlInDataType(dataType)) {
		return `sql\`${dataType}\``;
	}
	return `"${dataType}"`;
}

function useSqlInDataType(dataType: string) {
	if (dataTypesWithoutSql.includes(dataType)) {
		return false;
	}
	if (dataTypesWithSql.includes(dataType)) {
		return true;
	}
	if (dataType.includes("bit(")) {
		return true;
	}
	if (dataType.includes("[]")) {
		return true;
	}
	if (
		dataType.includes("numeric(") ||
		dataType.includes("time(") ||
		dataType.includes("timestamp(")
	) {
		return false;
	}

	return true;
}

const dataTypesWithoutSql = [
	"bigint",
	"bigserial",
	"boolean",
	"bytea",
	"date",
	"double precision",
	"integer",
	"json",
	"jsonb",
	"real",
	"serial",
	"text",
	"time",
	"numeric",
	"uuid",
	"timestamp",
];

const dataTypesWithSql = [
	"smallint",
	"character",
	"character varying",
	"time with time zone",
	"timestamp with time zone",
	"tsvector",
	"tsquery",
	"xml",
	"bit",
	"varbit",
	"inet",
	"cidr",
	"macaddr",
	"macaddr8",
];
