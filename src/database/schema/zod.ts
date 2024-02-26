import { z } from "zod";
import {
	PgBigInt,
	PgBigSerial,
	PgBoolean,
	PgColumnBase,
	PgColumnTypes,
	PgEnum,
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
