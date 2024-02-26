import { z } from "zod";
import {
	PgBigInt,
	PgBigSerial,
	PgBoolean,
	PgColumnBase,
	PgColumnTypes,
	PgDate,
	PgDoublePrecision,
	PgEnum,
	PgFloat8,
	PgSerial,
	PgText,
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
		default:
			return z.unknown();
	}
}

function columnSchemaWithBase(
	column: PgColumnTypes,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	base: z.ZodType<any, any, any>,
) {
	if (column instanceof PgEnum) {
		return base;
	}
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

function bigIntSchema(column: PgBigInt) {
	const base = bigintSchema().pipe(
		z.coerce.bigint().min(-9223372036854775808n).max(9223372036854775807n),
	);
	return columnSchemaWithBase(column, base);
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
		.pipe(z.coerce.number().min(-1e308).max(1e308));
	return columnSchemaWithBase(column, base);
}

function isFloat8(column: PgColumnTypes): asserts column is PgFloat8 {
	if (column instanceof PgFloat8) {
		return;
	}
	throw new Error("Only a PgFloat8 column is allowed");
}

function float8Schema(column: PgFloat8) {
	return doublePrecisionSchema(column);
}
