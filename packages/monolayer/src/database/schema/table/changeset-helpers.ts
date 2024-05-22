/* eslint-disable complexity */
import {
	executeKyselyDbStatement,
	sqlStatement,
} from "../../../changeset/helpers.js";
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

export function compileDataType(dataType: string) {
	const base = dataType.endsWith("[]") ? dataType.split("[]").at(0)! : dataType;
	const isArray = dataType.endsWith("[]");

	if (
		dataTypesWithoutSql.includes(base) ||
		dataType.includes("numeric(") ||
		(dataType.includes("time(") && !dataType.includes("with time zone")) ||
		(dataType.includes("timestamp(") && !dataType.includes("with time zone"))
	) {
		if (isArray) {
			return `sql\`${base}[]\``;
		}
		return `"${dataType}"`;
	}
	if (
		dataTypesWithSql.includes(base) ||
		dataType.includes("bit(") ||
		dataType.includes("bit varying(") ||
		dataType.includes("character(") ||
		dataType.includes("character varying(") ||
		dataType.includes("with time zone")
	) {
		if (isArray) {
			return `sql\`${base}[]\``;
		}
		return `sql\`${dataType}\``;
	}
	if (isArray) {
		return `sql\`"${base}"[]\``;
	} else {
		return `sql\`"${dataType}"\``;
	}
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
	"bit varying",
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

export function commentForDefault(
	schemaName: string,
	tableName: string,
	columnName: string,
	defaultValueAndHash: DefaultValueAndHash,
) {
	return executeKyselyDbStatement(
		`COMMENT ON COLUMN "${schemaName}"."${tableName}"."${columnName}" IS '${defaultValueAndHash.hash ?? ""}'`,
	);
}
