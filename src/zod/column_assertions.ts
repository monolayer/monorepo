/* eslint-disable max-lines */
import {
	PgBigInt,
	PgBigSerial,
	PgBit,
	PgBoolean,
	PgBytea,
	PgCIDR,
	PgChar,
	PgDate,
	PgDoublePrecision,
	PgEnum,
	PgFloat4,
	PgFloat8,
	PgInet,
	PgInt2,
	PgInt4,
	PgInt8,
	PgInteger,
	PgJson,
	PgJsonB,
	PgMacaddr,
	PgMacaddr8,
	PgNumeric,
	PgReal,
	PgStringColumn,
	PgText,
	PgTime,
	PgTimeTz,
	PgTimestamp,
	PgTimestampTz,
	PgTsquery,
	PgTsvector,
	PgUuid,
	PgVarChar,
	PgVarbit,
	PgXML,
	type Boolish,
	type PgColumn,
	type PgColumnBase,
	type PgGeneratedColumn,
} from "../schema/pg_column.js";

export function isPgBoolean(
	column: PgColumnBase<unknown, unknown, unknown>,
): column is PgBoolean {
	return column instanceof PgBoolean;
}

export function isPgText(
	column: PgColumnBase<unknown, unknown, unknown>,
): column is PgText {
	return column instanceof PgText;
}

export function isBigInt(
	column: PgColumnBase<unknown, unknown, unknown>,
): column is PgBigInt {
	return column instanceof PgBigInt;
}

export function isGeneratedColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgGeneratedColumn<unknown, unknown> {
	return column instanceof PgBigSerial;
}

export function isBytea(
	column:
		| PgColumnBase<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgBytea {
	return column instanceof PgBytea;
}

export function isJson(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgJson {
	return column instanceof PgJson;
}

export function isJsonB(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgJsonB {
	return column instanceof PgJsonB;
}

export function isDate(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgDate {
	return column instanceof PgDate;
}

export function isDoublePrecision(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgDoublePrecision {
	return column instanceof PgDoublePrecision;
}

export function isFloat4(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgFloat4 {
	return column instanceof PgFloat4;
}

export function isFloat8(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgFloat8 {
	return column instanceof PgFloat8;
}

export function isInt2(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgInt2 {
	return column instanceof PgInt2;
}

export function isInt4(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgInt4 {
	return column instanceof PgInt4;
}

export function isInt8(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgInt8 {
	return column instanceof PgInt8;
}

export function isInteger(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgInteger {
	return column instanceof PgInteger;
}

export function isReal(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgReal {
	return column instanceof PgReal;
}

export function isUuid(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgUuid {
	return column instanceof PgUuid;
}

export function isTime(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgTime {
	return column instanceof PgTime;
}

export function isTimeTz(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgTimeTz {
	return column instanceof PgTimeTz;
}

export function isTimestamp(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgTimestamp {
	return column instanceof PgTimestamp;
}

export function isTimestampTz(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgTimestampTz {
	return column instanceof PgTimestampTz;
}

export function isNumeric(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgNumeric {
	return column instanceof PgNumeric;
}

export function isEnum(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): column is PgEnum<any> {
	return column instanceof PgEnum;
}

export function isVarchar(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgVarChar {
	return column instanceof PgVarChar;
}

export function isChar(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgChar {
	return column instanceof PgChar;
}

export function isTsVector(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgTsvector {
	return column instanceof PgTsvector;
}

export function isStringColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgStringColumn {
	return column instanceof PgStringColumn;
}

export function isTsvectorColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgTsvector {
	return column instanceof PgTsvector;
}

export function isXMLColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgXML {
	return column instanceof PgXML;
}

export function isTsQueryColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgTsquery {
	return column instanceof PgTsquery;
}

export function isBitColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgBit {
	return column instanceof PgBit;
}

export function isVarbitColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgVarbit {
	return column instanceof PgVarbit;
}

export function isInetColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgInet {
	return column instanceof PgInet;
}

export function isCidrColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgCIDR {
	return column instanceof PgCIDR;
}

export function isMacaddrColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgMacaddr {
	return column instanceof PgMacaddr;
}

export function isMacaddr8Column(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgMacaddr8 {
	return column instanceof PgMacaddr8;
}

export function testBoolish(val: unknown): val is Boolish {
	switch (val) {
		case "true":
		case "false":
		case "yes":
		case "no":
		case 1:
		case 0:
		case "1":
		case "0":
		case "on":
		case "off":
		case true:
		case false:
		case null:
			return true;
		default:
			return false;
	}
}
