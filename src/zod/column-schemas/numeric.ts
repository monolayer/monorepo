/* eslint-disable max-lines */
import { z } from "zod";
import {
	type PgColumn,
	type PgColumnBase,
	type SerialColumn,
} from "~/schema/column/column.js";
import { PgBigInt } from "~/schema/column/data-types/bigint.js";
import { type PgBigSerial } from "~/schema/column/data-types/bigserial.js";
import { PgDoublePrecision } from "~/schema/column/data-types/double-precision.js";
import { PgInteger } from "~/schema/column/data-types/integer.js";
import { PgNumeric } from "~/schema/column/data-types/numeric.js";
import { PgReal } from "~/schema/column/data-types/real.js";
import { type PgSerial } from "~/schema/column/data-types/serial.js";
import { PgSmallint } from "~/schema/column/data-types/smallint.js";
import type { ZodType } from "~/schema/inference.js";
import { baseSchema, finishSchema } from "../common.js";
import { columnData, customIssue, nullableColumn } from "../helpers.js";

export function isNumeric(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgNumeric {
	return column instanceof PgNumeric;
}

export function isDoublePrecision(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgDoublePrecision {
	return column instanceof PgDoublePrecision;
}

export function isSmallint(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgSmallint {
	return column instanceof PgSmallint;
}

export function isInteger(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgInteger {
	return column instanceof PgInteger;
}

export function isReal(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgReal {
	return column instanceof PgReal;
}

export function isBigInt(
	column: PgColumnBase<unknown, unknown, unknown>,
): column is PgBigInt {
	return column instanceof PgBigInt;
}

export function pgBigintSchema<
	T extends PgBigInt | PgBigSerial,
	PK extends boolean,
>(column: T): ZodType<T, PK> {
	const data = columnData(column);
	if (data.info.identity === "ALWAYS") {
		return z.never() as unknown as ZodType<T, PK>;
	}
	const base = bigintSchema(!data._primaryKey && data.info.isNullable === true)
		.pipe(z.bigint().min(-9223372036854775808n).max(9223372036854775807n))
		.transform((val) => val.toString());

	return finishSchema(
		!data._primaryKey && data.info.isNullable,
		base,
	) as unknown as ZodType<T, PK>;
}

export function pgDoublePrecisionSchema<
	T extends PgDoublePrecision,
	PK extends boolean,
>(column: T): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	const base = variablePrecisionSchema(-1e308, 1e308, isNullable);
	return finishSchema(isNullable, base).transform((val) =>
		val === null || val === undefined ? val : val.toString(),
	) as unknown as ZodType<T, PK>;
}

export function pgSmallintSchema<T extends PgSmallint, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return integerSchema<T, PK>(column, -32768, 32767);
}

export function pgIntegerSchema<
	T extends PgInteger | PgSerial | PgSerial,
	PK extends boolean,
>(column: T): ZodType<T, PK> {
	return integerSchema<T, PK>(column, -2147483648, 2147483647);
}

export function pgRealSchema<T extends PgReal, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	const base = variablePrecisionSchema(-1e37, 1e37, isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function pgNumericSchema<T extends PgNumeric, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const data = columnData(column);
	const isNullable = nullableColumn(column);
	const base = decimalSchema(
		data.info.numericPrecision,
		data.info.numericScale,
		isNullable,
		"Expected bigint, number or string that can be converted to a number",
	);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

function integerSchema<
	T extends PgSmallint | PgInteger | PgSerial,
	PK extends boolean,
>(column: T, minimum: number, maximum: number): ZodType<T, PK> {
	const data = columnData(column);
	if (data.info.identity === "ALWAYS") {
		return z.never() as unknown as ZodType<T, PK>;
	}
	const isNullable = !data._primaryKey && data.info.isNullable === true;

	const base = wholeNumberSchema(minimum, maximum, isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
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
			} catch (e) {
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
			} catch (e) {
				return customIssue(ctx, errorMessage);
			}
		})
		.superRefine((val: unknown) => {
			const stringValue = String(val);
			if (
				stringValue === "NaN" ||
				stringValue === "Infinity" ||
				stringValue === "-Infinity"
			) {
				return;
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
		.transform((val) => {
			return Number(val);
		});
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
			} catch (e) {
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
