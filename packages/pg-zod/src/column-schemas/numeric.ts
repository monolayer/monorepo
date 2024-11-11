import type {
	PgColumn,
	PgColumnBase,
	SerialColumn,
} from "@monorepo/pg/schema/column/column.js";
import type { PgBigInt } from "@monorepo/pg/schema/column/data-types/bigint.js";
import type { PgBigSerial } from "@monorepo/pg/schema/column/data-types/bigserial.js";
import type { PgDoublePrecision } from "@monorepo/pg/schema/column/data-types/double-precision.js";
import type { PgInteger } from "@monorepo/pg/schema/column/data-types/integer.js";
import type { PgNumeric } from "@monorepo/pg/schema/column/data-types/numeric.js";
import type { PgReal } from "@monorepo/pg/schema/column/data-types/real.js";
import type { PgSerial } from "@monorepo/pg/schema/column/data-types/serial.js";
import type { PgSmallint } from "@monorepo/pg/schema/column/data-types/smallint.js";
import { z } from "zod";
import { baseSchema, finishIdenditySchema, finishSchema } from "../common.js";
import { columnData, customIssue, nullableColumn } from "../helpers.js";

export function isNumeric(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgNumeric {
	return column.constructor.name === "PgNumeric";
}

export function isDoublePrecision(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgDoublePrecision {
	return column.constructor.name === "PgDoublePrecision";
}

export function isSmallint(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgSmallint {
	return column.constructor.name === "PgSmallint";
}

export function isInteger(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgInteger {
	return column.constructor.name === "PgInteger";
}

export function isReal(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgReal {
	return column.constructor.name === "PgReal";
}

export function isBigInt(
	column: PgColumnBase<unknown, unknown, unknown>,
): column is PgBigInt {
	return column.constructor.name === "PgBigInt";
}

export function pgBigintSchema(column: PgBigInt | PgBigSerial) {
	const data = columnData(column);
	if (data.info.identity === "ALWAYS") {
		return z.undefined();
	}
	const base = bigintSchema(!data._primaryKey && data.info.isNullable === true)
		.pipe(z.bigint().min(-9223372036854775808n).max(9223372036854775807n))
		.transform((val) => val.toString());

	return finishIdenditySchema(
		!data._primaryKey && data.info.isNullable,
		data.info.identity,
		base,
	);
}

export function pgDoublePrecisionSchema(column: PgDoublePrecision) {
	const isNullable = nullableColumn(column);
	const base = variablePrecisionSchema(-1e308, 1e308, isNullable).transform(
		(val) => val.toString(),
	);
	return finishSchema(isNullable, base);
}

export function pgSmallintSchema(column: PgSmallint) {
	return integerSchema(column, -32768, 32767);
}

export function pgIntegerSchema(column: PgInteger | PgSerial | PgSerial) {
	return integerSchema(column, -2147483648, 2147483647);
}

export function pgRealSchema(column: PgReal) {
	const isNullable = nullableColumn(column);
	const base = variablePrecisionSchema(-1e37, 1e37, isNullable);
	return finishSchema(isNullable, base);
}

export function pgNumericSchema(column: PgNumeric) {
	const data = columnData(column);
	const isNullable = nullableColumn(column);
	const base = decimalSchema(
		data.info.numericPrecision,
		data.info.numericScale,
		isNullable,
		"Expected bigint, number or string that can be converted to a number",
	);
	return finishSchema(isNullable, base);
}

function integerSchema(
	column: PgSmallint | PgInteger | PgSerial,
	minimum: number,
	maximum: number,
) {
	const data = columnData(column);
	if (data.info.identity === "ALWAYS") {
		return z.undefined();
	}
	const isNullable = !data._primaryKey && data.info.isNullable === true;

	const base = wholeNumberSchema(minimum, maximum, isNullable);
	return finishIdenditySchema(
		!data._primaryKey && data.info.isNullable,
		data.info.identity,
		base,
	);
}

function bigintSchema(isNullable: boolean) {
	return baseSchema(
		isNullable,
		"Expected BigInt, Number or String that can coerce to BigInt",
	)
		.superRefine((val, ctx) => {
			try {
				if (val === "") throw new Error("Invalid bigint");
				BigInt(val);
			} catch {
				return customIssue(ctx, "Invalid bigint");
			}
		})
		.transform((val) => BigInt(val));
}

function variablePrecisionSchema(
	minimum: number,
	maximum: number,
	isNullable: boolean,
) {
	const errorMessage =
		"Expected bigint, Number or String that can be converted to a floating-point number or a bigint";

	return baseSchema(isNullable, errorMessage)
		.superRefine((val: unknown, ctx: z.RefinementCtx) => {
			try {
				if (val === "") throw new Error("Invalid");
				if (typeof val === "string") {
					const number = parseFloat(val);
					if (typeof number === "number") {
						if (Number.isNaN(number) && val !== "NaN") {
							throw new Error("Invalid number");
						}
						return;
					}
					BigInt(val);
				}
			} catch {
				return customIssue(ctx, errorMessage);
			}
		})
		.superRefine((val: unknown, ctx: z.RefinementCtx) => {
			const stringValue = String(val);
			if (
				stringValue === "NaN" ||
				stringValue === "Infinity" ||
				stringValue === "-Infinity"
			) {
				return;
			}
			const number = Number(val);
			if (number < minimum || number > maximum) {
				return customIssue(
					ctx,
					`Value must be between ${minimum} and ${maximum}, NaN, Infinity, or -Infinity`,
				);
			}
		})
		.transform((val) => Number(val));
}

function wholeNumberSchema(
	minimum: number,
	maximum: number,
	isNullable: boolean,
) {
	return baseSchema(
		isNullable,
		"Expected Number or String that can be converted to a number",
	)
		.superRefine((val, ctx) => {
			if (typeof val === "bigint") {
				ctx.addIssue({
					code: z.ZodIssueCode.invalid_type,
					expected: "number",
					received: typeof val,
				});
				return z.NEVER;
			}
		})
		.pipe(z.coerce.number().int().min(minimum).max(maximum));
}

function decimalSchema(
	precision: number | null,
	scale: number | null,
	isNullable: boolean,
	errorMessage: string,
) {
	return baseSchema(isNullable, errorMessage)
		.superRefine((val: unknown, ctx: z.RefinementCtx) => {
			try {
				if (typeof val === "string") {
					if (val === "") {
						return customIssue(ctx, "Invalid decimal");
					}
					const number = parseFloat(val);
					if (typeof number === "number") {
						if (Number.isNaN(number) && val !== "NaN") {
							throw new Error("Invalid number");
						}
						return;
					}
					BigInt(val);
				}
			} catch {
				return customIssue(ctx, errorMessage);
			}
		})
		.superRefine((val: unknown, ctx: z.RefinementCtx) => {
			const stringValue = String(val);
			if (
				stringValue === "NaN" ||
				stringValue === "Infinity" ||
				stringValue === "-Infinity"
			) {
				return;
			}
			const [wholeNumber, decimals] = stringValue.split(".");
			if (
				wholeNumber !== undefined &&
				precision !== null &&
				wholeNumber.length > precision
			) {
				return customIssue(ctx, `Precision of ${precision} exeeded.`);
			}
			if (
				decimals !== undefined &&
				scale !== null &&
				scale !== 0 &&
				decimals.length > scale
			) {
				return customIssue(ctx, `Maximum scale ${scale} exeeded.`);
			}
		})
		.transform((val) => {
			return parseFloat(val);
		});
}
