import { z } from "zod";
import type { ZodType } from "../schema/inference.js";
import {
	ColumnIdentity,
	PgTimestamp,
	PgTimestampTz,
	type AnyPGColumn,
	type PgChar,
	type PgGeneratedColumn,
	type PgInt2,
	type PgInt4,
	type PgInteger,
	type PgTime,
	type PgTimeTz,
	type PgVarChar,
} from "../schema/pg_column.js";
import { columnData, customIssue } from "./helpers.js";
import { timeRegex } from "./regexes/regex.js";
import { baseSchema } from "./zod_schema.js";

export function timestampSchema<
	T extends PgTimestamp | PgTimestampTz,
	PK extends boolean,
>(column: T): ZodType<T, PK> {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = dateSchema(
		"Expected date or string with date format",
		isNullable,
	).pipe(z.coerce.date());
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function timeSchema<T extends PgTime | PgTimeTz, PK extends boolean>(
	column: T,
	invalidTimeMessage: string,
): ZodType<T, PK> {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = stringSchema(
		"Expected string with time format",
		isNullable,
	).pipe(z.string().regex(timeRegex, invalidTimeMessage));
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function integerSchema<
	T extends PgInt2 | PgInt4 | PgInteger,
	PK extends boolean,
>(column: T, minimum: number, maximum: number): ZodType<T, PK> {
	const data = columnData(column);
	if (data.info.identity === ColumnIdentity.Always) {
		return z.never() as unknown as ZodType<T, PK>;
	}
	const isNullable = !data._primaryKey && data.info.isNullable === true;

	const base = wholeNumberSchema(minimum, maximum, isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function dateSchema(errorMessage: string, isNullable: boolean) {
	return baseSchema(isNullable, errorMessage).superRefine((val, ctx) => {
		if (val.constructor.name === "Date") return;
		if (typeof val !== "string") {
			return customIssue(ctx, `${errorMessage}, received ${typeof val}`);
		}
		try {
			Date.parse(val);
		} catch {
			return customIssue(ctx, `${errorMessage}, received ${typeof val}`);
		}
	});
}

export function bigintSchema(isNullable: boolean) {
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

export function jsonSchema(isNullable: boolean) {
	return baseSchema(
		isNullable,
		"Expected value that can be converted to JSON",
	).superRefine((val, ctx) => {
		const allowedTypes = ["boolean", "number", "string"];
		if (
			!allowedTypes.includes(typeof val) &&
			val.constructor.name !== "Object"
		) {
			return customIssue(ctx, "Invalid JSON");
		}
		try {
			if (typeof val === "string") {
				JSON.parse(val);
			}
			JSON.stringify(val);
		} catch (e) {
			return customIssue(ctx, "Invalid JSON");
		}
	});
}

export function variablePrecisionSchema(
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

export function wholeNumberSchema(
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

export function decimalSchema(
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

export function stringSchema(
	errorMessage: string,
	isNullable: boolean,
	constructors = [] as string[],
) {
	return baseSchema(isNullable, errorMessage).superRefine((val, ctx) => {
		if (typeof val !== "string" && constructors.length === 0) {
			return customIssue(ctx, `${errorMessage}, received ${typeof val}`);
		}
		if (
			typeof val !== "string" &&
			constructors.length > 0 &&
			!constructors.includes(val.constructor.name)
		) {
			return customIssue(ctx, `${errorMessage}, received ${typeof val}`);
		}
	});
}

export function characterSchema<
	T extends PgChar | PgVarChar,
	PK extends boolean,
>(column: T): ZodType<T, PK> {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	if (data.info.characterMaximumLength !== null) {
		return finishSchema(
			isNullable,
			z.string().max(data.info.characterMaximumLength),
		) as unknown as ZodType<T, PK>;
	}
	return finishSchema(isNullable, z.string()) as unknown as ZodType<T, PK>;
}

export function regexStringSchema<T extends AnyPGColumn, PK extends boolean>(
	column: AnyPGColumn,
	regexp: RegExp,
	errorMessage: string,
): ZodType<T, PK> {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = z.string().regex(regexp, errorMessage);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function generatedColumnSchema<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends PgGeneratedColumn<any, any>,
	PK extends boolean,
>(): ZodType<T, PK> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return z.never() as unknown as ZodType<T, PK>;
}

export function finishSchema(isNullable: boolean, schema: z.ZodTypeAny) {
	if (isNullable) return schema.nullish();
	return schema;
}
