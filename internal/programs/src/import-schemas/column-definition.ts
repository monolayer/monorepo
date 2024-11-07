/* eslint-disable max-lines */
/* eslint-disable complexity */
import type { ColumnInfo } from "@monorepo/pg/schema/column/types.js";

const internalTypes = [
	"bigint",
	"bigserial",
	"bit",
	"bit varying",
	"boolean",
	"bytea",
	"character varying",
	"character",
	"cidr",
	"date",
	"double precision",
	"inet",
	"integer",
	"json",
	"jsonb",
	"macaddr",
	"macaddr8",
	"numeric",
	"real",
	"serial",
	"smallint",
	"text",
	"time with time zone",
	"time",
	"timestamp with time zone",
	"timestamp",
	"tsquery",
	"tsvector",
	"uuid",
	"varbit",
	"xml",
];

function matchType(dataType: string, enums: string[]) {
	if (enums.includes(dataType)) {
		return "enumerated";
	}
	if (dataType.includes("[]")) {
		return "generic";
	}
	if (internalTypes.includes(dataType)) {
		return dataType;
	}
	if (dataType.includes("bit(")) {
		return "bit";
	}
	if (dataType.includes("character varying(")) {
		return "character varying";
	}
	if (dataType.includes("bit varying(")) {
		return "bit varying";
	}
	if (dataType.includes("numeric(")) {
		return "numeric";
	}
	if (dataType.includes("time(")) {
		if (dataType.includes("with time zone")) {
			return "time with time zone";
		} else {
			return "time";
		}
	}
	if (dataType.includes("timestamp(")) {
		if (dataType.includes("with time zone")) {
			return "timestamp with time zone";
		} else {
			return "timestamp";
		}
	}
	return "generic";
}

const dataTypeOptions = {
	bigint: {
		defaultable: true,
		identifiable: true,
		nullable: true,
	},
	bigserial: {
		defaultable: false,
		identifiable: false,
		nullable: false,
	},
	bit: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	"bit varying": {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	boolean: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	bytea: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	"character varying": {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	character: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	cidr: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	date: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	"double precision": {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	generic: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	inet: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	integer: {
		defaultable: true,
		identifiable: true,
		nullable: true,
	},
	json: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	jsonb: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	macaddr: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	macaddr8: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	numeric: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	real: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	serial: {
		defaultable: false,
		identifiable: false,
		nullable: false,
	},
	smallint: {
		defaultable: true,
		identifiable: true,
		nullable: true,
	},
	text: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	"time with time zone": {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	time: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	"timestamp with time zone": {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	timestamp: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	tsquery: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	tsvector: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	uuid: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	varbit: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	xml: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
	enumerated: {
		defaultable: true,
		identifiable: false,
		nullable: true,
	},
};

export function columnDefinition(
	columnInfo: ColumnInfo,
	enums: {
		name: string;
		definition: string;
	}[],
) {
	const matchedType = matchType(
		columnInfo.dataType,
		enums.map((e) => e.name),
	);

	const code: string[] = [];
	let importName: string = "";

	switch (matchedType) {
		case "enumerated":
			code.push(
				`enumerated(${enums.find((e) => e.name === columnInfo.dataType)?.name})`,
			);
			importName = "enumerated";
			break;
		case "bigint":
			code.push("bigint()");
			importName = "bigint";
			break;
		case "bigserial":
			code.push("bigserial()");
			importName = "bigserial";
			break;
		case "bit":
			if (columnInfo.characterMaximumLength) {
				code.push(`bit(${columnInfo.characterMaximumLength})`);
			} else {
				code.push("bit()");
			}
			importName = "bit";
			break;
		case "bit varying":
			if (columnInfo.characterMaximumLength) {
				code.push(`bitVarying(${columnInfo.characterMaximumLength})`);
			} else {
				code.push("bitVarying()");
			}
			importName = "bitVarying";
			break;
		case "boolean":
			code.push("boolean()");
			importName = "boolean";
			break;
		case "bytea":
			code.push("bytea()");
			importName = "bytea";
			break;
		case "character varying":
			if (columnInfo.characterMaximumLength) {
				code.push(`characterVarying(${columnInfo.characterMaximumLength})`);
			} else {
				code.push("characterVarying()");
			}
			importName = "characterVarying";
			break;
		case "character":
			if (columnInfo.characterMaximumLength) {
				code.push(`character(${columnInfo.characterMaximumLength})`);
			} else {
				code.push("character()");
			}
			importName = "character";
			break;
		case "cidr":
			code.push("cidr()");
			importName = "cidr";
			break;
		case "date":
			code.push("date()");
			importName = "date";
			break;
		case "double precision":
			code.push("doublePrecision()");
			importName = "doublePrecision";
			break;
		case "generic":
			code.push(`columnWithType("${columnInfo.dataType}")`);
			importName = "columnWithType";
			break;
		case "inet":
			code.push("inet()");
			importName = "inet";
			break;
		case "integer":
			code.push("integer()");
			importName = "integer";
			break;
		case "json":
			code.push("json()");
			importName = "json";
			break;
		case "jsonb":
			code.push("jsonb()");
			importName = "jsonb";
			break;
		case "macaddr":
			code.push("macaddr()");
			importName = "macaddr";
			break;
		case "macaddr8":
			code.push("macaddr8()");
			importName = "macaddr8";
			break;
		case "numeric":
			if (columnInfo.numericPrecision && columnInfo.numericScale) {
				code.push(
					`numeric(${columnInfo.numericPrecision}, ${columnInfo.numericScale})`,
				);
			} else {
				code.push("numeric()");
			}
			importName = "numeric";
			break;
		case "real":
			code.push("real()");
			importName = "real";
			break;
		case "serial":
			code.push("serial()");
			importName = "serial";
			break;
		case "smallint":
			code.push("smallint()");
			importName = "smallint";
			break;
		case "text":
			code.push("text()");
			importName = "text";
			break;
		case "time":
			if (columnInfo.datetimePrecision) {
				code.push(`time(${columnInfo.datetimePrecision})`);
			} else {
				code.push("time()");
			}
			importName = "time";
			break;
		case "time with time zone":
			if (columnInfo.datetimePrecision) {
				code.push(`timeWithTimeZone(${columnInfo.datetimePrecision})`);
			} else {
				code.push("timeWithTimeZone()");
			}
			importName = "timeWithTimeZone";
			break;
		case "timestamp":
			if (columnInfo.datetimePrecision) {
				code.push(`timestamp(${columnInfo.datetimePrecision})`);
			} else {
				code.push("timestamp()");
			}
			importName = "timestamp";
			break;
		case "timestamp with time zone":
			if (columnInfo.datetimePrecision) {
				code.push(`timestampWithTimeZone(${columnInfo.datetimePrecision})`);
			} else {
				code.push("timestampWithTimeZone()");
			}
			importName = "timestampWithTimeZone";
			break;
		case "tsquery":
			code.push("tsquery()");
			importName = "tsquery";
			break;
		case "tsvector":
			code.push("tsvector()");
			importName = "tsvector";
			break;
		case "uuid":
			code.push("uuid()");
			importName = "uuid";
			break;
		case "xml":
			code.push("xml()");
			importName = "xml";
			break;
	}
	if (
		dataTypeOptions[matchedType as keyof typeof dataTypeOptions].nullable &&
		columnInfo.isNullable === false
	) {
		code.push(`notNull()`);
	}
	if (
		dataTypeOptions[matchedType as keyof typeof dataTypeOptions].identifiable
	) {
		if (columnInfo.identity === "ALWAYS") {
			code.push(`generatedAlwaysAsIdentity()`);
		} else if (columnInfo.identity === "BY DEFAULT") {
			code.push(`generatedByDefaultAsIdentity()`);
		}
	}
	if (
		dataTypeOptions[matchedType as keyof typeof dataTypeOptions].defaultable &&
		columnInfo.defaultValue !== null
	) {
		const base = columnInfo.defaultValue.replace(/^(\w+)?:/, "");
		const defaultValue =
			matchedType !== "generic" ? base.replace(/::(\w|\s)+$/, "") : base;
		const value =
			matchedType === "text" ? defaultValue : `sql\`${defaultValue}\``;
		code.push(`default(${value})`);
	}

	return { code: code.join("."), importName };
}
