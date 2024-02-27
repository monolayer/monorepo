import { z } from "zod";
import {
	type ColumnInfo,
	PgBigInt,
	PgBigSerial,
	PgBoolean,
	PgBytea,
	PgChar,
	PgColumnBase,
	PgColumnTypes,
	PgDate,
	PgDoublePrecision,
	PgEnum,
	PgFloat4,
	PgFloat8,
	PgInt2,
	PgInt4,
	PgInt8,
	PgInteger,
	PgJson,
	PgJsonB,
	PgNumeric,
	PgReal,
	PgSerial,
	PgText,
	PgTime,
	PgTimeTz,
	PgTimestamp,
	PgTimestampTz,
	PgUuid,
	PgVarChar,
} from "./pg_column.js";

export function zodSchema(column: PgColumnTypes) {
	switch (column.constructor) {
		case PgBoolean:
			isBoolean(column);
			return booleanSchema(column);
		case PgText:
			isText(column);
			return textSchema(column);
		case PgBigInt:
			isBigInt(column);
			return bigIntSchema(column);
		case PgSerial:
			isSerial(column);
			return serialSchema(column);
		case PgBigSerial:
			isBigSerial(column);
			return bigSerialSchema(column);
		case PgDate:
			isDate(column);
			return dateSchema(column);
		case PgDoublePrecision:
			isDoublePrecision(column);
			return doublePrecisionSchema(column);
		case PgFloat8:
			isFloat8(column);
			return float8Schema(column);
		case PgReal:
			isReal(column);
			return realSchema(column);
		case PgFloat4:
			isFloat4(column);
			return float4Schema(column);
		case PgInteger:
			isInteger(column);
			return integerSchema(column);
		case PgInt8:
			isInt8(column);
			return int8Schema(column);
		case PgInt4:
			isInt4(column);
			return int4Schema(column);
		case PgInt2:
			isInt2(column);
			return int2Schema(column);
		case PgTime:
			isTime(column);
			return timeSchema(column);
		case PgTimeTz:
			istTimeTz(column);
			return timeTzSchema(column);
		case PgTimestamp:
			isTimestamp(column);
			return timestampSchema(column);
		case PgTimestampTz:
			isTimestampTz(column);
			return timestampTzSchema(column);
		case PgUuid:
			isUuid(column);
			return uuidSchema(column);
		case PgVarChar:
			isVarChar(column);
			return varCharSchema(column);
		case PgChar:
			isChar(column);
			return charSchema(column);
		case PgNumeric:
			isNumeric(column);
			return numericSchema(column);
		case PgJson:
			isJson(column);
			return jsonSchema(column);
		case PgJsonB:
			isJsonb(column);
			return jsonBSchema(column);
		case PgBytea:
			isBytea(column);
			return byteaSchema(column);
		case PgEnum:
			isEnum(column);
			return enumSchema(column);
		default:
			return z.unknown();
	}
}

function columnSchemaWithBase<T extends z.ZodTypeAny>(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	column: Exclude<PgColumnTypes, PgEnum<any, any, any, any, any>>,
	base: T,
) {
	const info = PgColumnBase.info(column);
	if (
		(column._isPrimaryKey && info.defaultValue !== null) ||
		(info.isNullable === false && info.defaultValue !== null)
	) {
		return base.optional();
	}

	if (!column._isPrimaryKey && info.isNullable === true) {
		return base.nullable().optional();
	}
	return base;
}

function isBoolean(column: PgColumnTypes): asserts column is PgBoolean {
	if (column instanceof PgBoolean) {
		return;
	}
	throw new Error("Only a PgBoolean column is allowed");
}

function booleanSchema(column: PgBoolean) {
	const base = z
		.boolean()
		.or(z.string().refine((s) => s === "true" || s === "false"))
		.pipe(z.coerce.boolean());

	return columnSchemaWithBase(column, base);
}

function isText(column: PgColumnTypes): asserts column is PgText {
	if (column instanceof PgText) {
		return;
	}
	throw new Error("Only a PgText column is allowed");
}

function textSchema(column: PgText) {
	const base = z.string();
	return columnSchemaWithBase(column, base);
}

function isBigInt(column: PgColumnTypes): asserts column is PgBigInt {
	if (column instanceof PgBigInt) {
		return;
	}
	throw new Error("Only a PgBigInt column is allowed");
}

function bigIntSchema(column: PgBigInt | PgInt8) {
	const base = bigintSchema().pipe(
		z.coerce.bigint().min(-9223372036854775808n).max(9223372036854775807n),
	);
	return columnSchemaWithBase(column, base);
}

function isInt8(column: PgColumnTypes): asserts column is PgInt8 {
	if (column instanceof PgInt8) {
		return;
	}
	throw new Error("Only a PgInt8 column is allowed");
}

function int8Schema(column: PgInt8) {
	return bigIntSchema(column);
}

function isSerial(column: PgColumnTypes): asserts column is PgSerial {
	if (column instanceof PgSerial) {
		return;
	}
	throw new Error("Only a PgSerial column is allowed");
}

function serialSchema(column: PgSerial) {
	const base = z
		.number()
		.or(z.string())
		.pipe(z.coerce.number().min(1).max(2147483648))
		.optional();

	return base;
}

function isBigSerial(column: PgColumnTypes): asserts column is PgBigSerial {
	if (column instanceof PgBigSerial) {
		return;
	}
	throw new Error("Only a PgBigSerial column is allowed");
}

function bigSerialSchema(column: PgBigSerial) {
	const base = bigintSchema()
		.pipe(z.coerce.bigint().min(1n).max(9223372036854775807n))
		.optional();
	return base;
}

function bigintSchema() {
	return z
		.bigint()
		.or(z.number())
		.or(z.string())
		.transform((s, ctx) => {
			try {
				return BigInt(s);
			} catch (e) {
				ctx.addIssue({
					code: z.ZodIssueCode.invalid_type,
					expected: "bigint",
					received: "string",
					message: `Cannot convert '${s}' to a BigInt`,
				});
				return z.NEVER;
			}
		});
}

function isDate(column: PgColumnTypes): asserts column is PgDate {
	if (column instanceof PgDate) {
		return;
	}
	throw new Error("Only a PgDate column is allowed");
}

function dateSchema(column: PgDate) {
	const base = z.date().or(z.string().pipe(z.coerce.date()));
	return columnSchemaWithBase(column, base);
}

function isDoublePrecision(
	column: PgColumnTypes,
): asserts column is PgDoublePrecision {
	if (column instanceof PgDoublePrecision) {
		return;
	}
	throw new Error("Only a PgDoublePrecision column is allowed");
}

function doublePrecisionSchema(column: PgDoublePrecision | PgFloat8) {
	return variablePrecisionSchema(column, -1e308, 1e308);
}

function isFloat8(column: PgColumnTypes): asserts column is PgFloat8 {
	if (column instanceof PgFloat8) {
		return;
	}
	throw new Error("Only a PgFloat8 column is allowed");
}

function float8Schema(column: PgFloat8) {
	return variablePrecisionSchema(column, -1e308, 1e308);
}

function isReal(column: PgColumnTypes): asserts column is PgReal {
	if (column instanceof PgReal) {
		return;
	}
	throw new Error("Only a PgReal column is allowed");
}

function realSchema(column: PgReal) {
	return variablePrecisionSchema(column, -1e37, 1e37);
}

function isFloat4(column: PgColumnTypes): asserts column is PgFloat4 {
	if (column instanceof PgFloat4) {
		return;
	}
	throw new Error("Only a PgFloat4 column is allowed");
}

function float4Schema(column: PgFloat4) {
	return variablePrecisionSchema(column, -1e37, 1e37);
}

function isInteger(column: PgColumnTypes): asserts column is PgInteger {
	if (column instanceof PgInteger) {
		return;
	}
	throw new Error("Only a PgInteger column is allowed");
}

function integerSchema(column: PgInteger) {
	return wholeNumberSchema(column, -2147483648, 2147483647);
}

function isInt4(column: PgColumnTypes): asserts column is PgInt4 {
	if (column instanceof PgInt4) {
		return;
	}
	throw new Error("Only a PgInt4 column is allowed");
}

function int4Schema(column: PgInt4) {
	return wholeNumberSchema(column, -2147483648, 2147483647);
}

function isInt2(column: PgColumnTypes): asserts column is PgInt2 {
	if (column instanceof PgInt2) {
		return;
	}
	throw new Error("Only a PgInt2 column is allowed");
}

function int2Schema(column: PgInt2) {
	return wholeNumberSchema(column, -32768, 32767);
}

const TIME_REGEX =
	/^((?:\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:[+-]\d{1,2}(?::?\d{2})?)?)|(\d{6}(?:[+-]\d{2}(?::?\d{2}){0,2})?))$/;

function isTime(column: PgColumnTypes): asserts column is PgTime {
	if (column instanceof PgTime) {
		return;
	}
	throw new Error("Only a PgTime column is allowed");
}

function timeSchema(column: PgTime) {
	const base = z.string().regex(TIME_REGEX);
	return columnSchemaWithBase(column, base);
}

function istTimeTz(column: PgColumnTypes): asserts column is PgTimeTz {
	if (column instanceof PgTimeTz) {
		return;
	}
	throw new Error("Only a PgTimeTz column is allowed");
}

function timeTzSchema(column: PgTimeTz) {
	const base = z.string().regex(TIME_REGEX);
	return columnSchemaWithBase(column, base);
}

function isTimestamp(column: PgColumnTypes): asserts column is PgTimestamp {
	if (column instanceof PgTimestamp) {
		return;
	}
	throw new Error("Only a PgTimestamp column is allowed");
}

function timestampSchema(column: PgTimestamp) {
	const base = z.date().or(z.string().pipe(z.coerce.date()));
	return columnSchemaWithBase(column, base);
}

function isTimestampTz(column: PgColumnTypes): asserts column is PgTimestampTz {
	if (column instanceof PgTimestampTz) {
		return;
	}
	throw new Error("Only a PgTimestamp column is allowed");
}

function timestampTzSchema(column: PgTimestampTz) {
	const base = z.date().or(z.string().pipe(z.coerce.date()));
	return columnSchemaWithBase(column, base);
}

function isUuid(column: PgColumnTypes): asserts column is PgUuid {
	if (column instanceof PgUuid) {
		return;
	}
	throw new Error("Only a PgUuid column is allowed");
}

function uuidSchema(column: PgUuid) {
	const base = z.string().uuid();
	return columnSchemaWithBase(column, base);
}

function isVarChar(column: PgColumnTypes): asserts column is PgVarChar {
	if (column instanceof PgVarChar) {
		return;
	}
	throw new Error("Only a PgVarChar column is allowed");
}

function varCharSchema(column: PgVarChar) {
	return charactedColumnWithMaximumLength(column);
}

function isChar(column: PgColumnTypes): asserts column is PgChar {
	if (column instanceof PgChar) {
		return;
	}
	throw new Error("Only a PgChar column is allowed");
}

function charSchema(column: PgChar) {
	return charactedColumnWithMaximumLength(column);
}

function isNumeric(column: PgColumnTypes): asserts column is PgNumeric {
	if (column instanceof PgNumeric) {
		return;
	}
	throw new Error("Only a PgNumeric column is allowed");
}

function numericSchema(column: PgNumeric) {
	return decimalSchema(column);
}

function isJson(column: PgColumnTypes): asserts column is PgJson {
	if (column instanceof PgJson) {
		return;
	}
	throw new Error("Only a PgJson column is allowed");
}

function jsonSchema(column: PgJson | PgJsonB) {
	const base = z
		.string()
		.or(z.number())
		.or(z.boolean())
		.or(z.record(z.any()))
		.transform((val, ctx) => {
			try {
				if (typeof val === "string") {
					return JSON.parse(val);
				}
				if (typeof val !== "number" || typeof val !== "boolean") {
					return JSON.stringify(val);
				}
				return val;
			} catch (e) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Invalid JSON",
				});
				return z.NEVER;
			}
		});
	return columnSchemaWithBase(column, base);
}

function isJsonb(column: PgColumnTypes): asserts column is PgJsonB {
	if (column instanceof PgJsonB) {
		return;
	}
	throw new Error("Only a PgJsonB column is allowed");
}

function jsonBSchema(column: PgJsonB) {
	return jsonSchema(column);
}

function isBytea(column: PgColumnTypes): asserts column is PgBytea {
	if (column instanceof PgBytea) {
		return;
	}
	throw new Error("Only a PgBytea column is allowed");
}

function byteaSchema(column: PgBytea) {
	const base = z.any().transform((val, ctx) => {
		if (
			val === null ||
			val === undefined ||
			val.constructor.name === "Buffer" ||
			typeof val === "string"
		) {
			return val;
		}
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "Expected Buffer or String.",
		});
		return z.NEVER;
	});

	return columnSchemaFromNullAndUndefined(
		column,
		PgColumnBase.info(column),
		base,
	);
}

function isEnum(
	column: PgColumnTypes,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
): asserts column is PgEnum<any, any, any, any, any> {
	if (column instanceof PgEnum) {
		return;
	}
	throw new Error("Only a PgEnum column is allowed");
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function enumSchema(column: PgEnum<any, any, any, any, any>) {
	const base = z.enum(column.values).or(z.null()).or(z.undefined());
	return columnSchemaFromNullAndUndefined(column, column.info, base);
}

function columnSchemaFromNullAndUndefined<T extends z.ZodTypeAny>(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	column: PgBytea | PgEnum<any, any, any, any, any>,
	info: Omit<ColumnInfo, "columnName" | "tableName">,
	base: T,
) {
	if (
		(column._isPrimaryKey && info.defaultValue !== null) ||
		info.isNullable === false
	) {
		if (info.defaultValue !== null) {
			return base.optional().refine((val) => val !== null);
		}
		return base.refine((val) => val !== null && val !== undefined);
	}

	if (column._isPrimaryKey) {
		return base.refine((val) => val !== null && val !== undefined);
	}

	if (!column._isPrimaryKey && info.isNullable === true) {
		return base.optional();
	}
	return base;
}

function charactedColumnWithMaximumLength(column: PgVarChar | PgChar) {
	const info = PgColumnBase.info(column);
	if (info.characterMaximumLength !== null) {
		return columnSchemaWithBase(
			column,
			z.string().max(info.characterMaximumLength),
		);
	}
	return columnSchemaWithBase(column, z.string());
}

function variablePrecisionSchema(
	column: PgDoublePrecision | PgFloat8 | PgReal | PgFloat4,
	minimum: number,
	maximum: number,
) {
	const base = z
		.bigint()
		.or(z.number())
		.or(z.string())
		.transform((s, ctx) => {
			try {
				if (typeof s === "string") {
					return parseFloat(s) || BigInt(s);
				}
				return s;
			} catch (e) {
				ctx.addIssue({
					code: z.ZodIssueCode.invalid_type,
					expected: "bigint",
					received: "string",
					message: `Cannot convert '${s}' to a Number or a BigInt`,
				});
				return z.NEVER;
			}
		})
		.pipe(z.coerce.number().min(minimum).max(maximum));
	return columnSchemaWithBase(column, base);
}

function wholeNumberSchema(
	column: PgInteger | PgInt4 | PgInt2,
	minimum: number,
	maximum: number,
) {
	const base = z
		.number()
		.or(z.string())
		.pipe(z.coerce.number().int().min(minimum).max(maximum));
	return columnSchemaWithBase(column, base);
}

function decimalSchema(column: PgNumeric) {
	const info = PgColumnBase.info(column);
	const base = z
		.bigint()
		.or(z.number())
		.or(z.string())
		.transform((s, ctx) => {
			try {
				if (typeof s === "string") {
					return parseFloat(s) || BigInt(s);
				}
				return s;
			} catch (e) {
				ctx.addIssue({
					code: z.ZodIssueCode.invalid_type,
					expected: "bigint",
					received: "string",
					message: `Cannot convert '${s}' to a Number or a BigInt`,
				});
				return z.NEVER;
			}
		})
		.pipe(
			z.coerce
				.number()
				.refine(
					(n) => {
						const numberString = n.toString();
						const [wholeNumber, _decimals] = numberString.split(".");
						if (wholeNumber !== undefined && info.numericPrecision !== null) {
							return wholeNumber.length <= info.numericPrecision;
						}
						return true;
					},
					{
						message: `Precision of ${info.numericPrecision} exeeded.`,
					},
				)
				.refine(
					(n) => {
						const numberString = n.toString();
						const [_wholeNumber, decimals] = numberString.split(".");
						if (
							decimals !== undefined &&
							info.numericScale !== null &&
							info.numericScale !== 0
						) {
							return decimals.length <= info.numericScale;
						}
						return true;
					},
					{
						message: `Maximum scale ${info.numericScale} exeeded.`,
					},
				),
		);
	return columnSchemaWithBase(column, base);
}
