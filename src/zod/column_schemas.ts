import { ZodIssueCode, z } from "zod";
import type { ZodType } from "../schema/inference.js";
import {
	ColumnIdentity,
	PgBigInt,
	PgBoolean,
	PgBytea,
	PgChar,
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
	PgText,
	PgTime,
	PgTimeTz,
	PgTimestamp,
	PgTimestampTz,
	PgUuid,
	PgVarChar,
} from "../schema/pg_column.js";
import {
	bigintSchema,
	characterSchema,
	decimalSchema,
	finishSchema,
	integerSchema,
	jsonSchema,
	timeSchema,
	timestampSchema,
	variablePrecisionSchema,
} from "./base_schemas.js";
import { testBoolish } from "./column_assertions.js";
import {
	columnData,
	customIssue,
	nullableColumn,
	toBooleanOrNull,
} from "./helpers.js";
import { baseSchema } from "./zod_schema.js";

export function pgBooleanSchema<T extends PgBoolean, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	const base = z
		.any()
		.superRefine((data, ctx) => {
			if (!testBoolish(data)) {
				if (data === undefined) {
					ctx.addIssue({
						code: ZodIssueCode.invalid_type,
						expected: "boolean",
						received: "undefined",
					});
				} else {
					return customIssue(ctx, "Invalid boolean");
				}
				return z.NEVER;
			}
		})
		.transform(toBooleanOrNull)
		.superRefine((val, ctx) => {
			if (!isNullable && val === null) {
				ctx.addIssue({
					code: ZodIssueCode.invalid_type,
					expected: "boolean",
					received: "null",
				});
				return z.NEVER;
			}
		});
	if (isNullable) {
		return base.optional() as unknown as ZodType<T, PK>;
	}
	return base as unknown as ZodType<T, PK>;
}

export function pgTextSchema<T extends PgText, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	return finishSchema(isNullable, z.string()) as unknown as ZodType<T, PK>;
}

export function pgBigintSchema<T extends PgBigInt, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const data = columnData(column);
	if (data.info.identity === ColumnIdentity.Always) {
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

export function pgByteaSchema<T extends PgBytea, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	const base = baseSchema(isNullable, "Expected Buffer or string").superRefine(
		(val, ctx) => {
			if (
				typeof val !== "string" &&
				val?.constructor.name !== "Buffer" &&
				val !== null
			) {
				return customIssue(
					ctx,
					`Expected Buffer or string, received ${typeof val}`,
				);
			}
		},
	);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function pgDateSchema<T extends PgDate, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	const base = baseSchema(
		isNullable,
		"Expected Date or String that can coerce to Date",
	).pipe(z.coerce.date());
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
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

export function pgFloat4Schema<T extends PgFloat4, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	const base = variablePrecisionSchema(-1e37, 1e37, isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function pgFloat8Schema<T extends PgFloat8, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	const base = variablePrecisionSchema(-1e308, 1e308, isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function pgInt2Schema<T extends PgInt2, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return integerSchema<T, PK>(column, -32768, 32767);
}

export function pgInt4Schema<T extends PgInt4, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return integerSchema<T, PK>(column, -2147483648, 2147483647);
}

export function pgInt8Schema<T extends PgInt8, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const data = columnData(column);
	if (data.info.identity === ColumnIdentity.Always) {
		return z.never() as unknown as ZodType<T, PK>;
	}
	const isNullable = nullableColumn(column);
	const base = bigintSchema(isNullable).pipe(
		z.coerce.bigint().min(-9223372036854775808n).max(9223372036854775807n),
	);
	return finishSchema(isNullable, base).transform((val) =>
		val !== null ? Number(val) : val,
	) as unknown as ZodType<T, PK>;
}

export function pgIntegerSchema<T extends PgInteger, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return integerSchema<T, PK>(column, -2147483648, 2147483647);
}

export function pgJsonSchema<T extends PgJson, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	const base = jsonSchema(isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function pgJsonbSchema<T extends PgJsonB, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	const base = jsonSchema(isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function pgRealSchema<T extends PgReal, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	const base = variablePrecisionSchema(-1e37, 1e37, isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function pgUuidSchema<T extends PgUuid, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	const base = baseSchema(isNullable, "Expected uuid").pipe(z.string().uuid());
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function pgVarcharSchema<T extends PgVarChar, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return characterSchema<T, PK>(column);
}

export function pgCharSchema<T extends PgChar, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return characterSchema<T, PK>(column);
}

export function pgTimeSchema<T extends PgTime, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return timeSchema<T, PK>(column, "Invalid time");
}

export function pgTimeTzSchema<T extends PgTimeTz, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return timeSchema<T, PK>(column, "Invalid time with time zone");
}

export function pgTimestampSchema<T extends PgTimestamp, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return timestampSchema<T, PK>(column);
}

export function pgTimestampTzSchema<
	T extends PgTimestampTz,
	PK extends boolean,
>(column: T): ZodType<T, PK> {
	return timestampSchema<T, PK>(column);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pgEnumSchema<T extends PgEnum<any>, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	const data = Object.fromEntries(Object.entries(column)) as {
		values: [string, ...string[]];
	};
	const enumValues = data.values as unknown as [string, ...string[]];
	const errorMessage = `Expected ${enumValues
		.map((v) => `'${v}'`)
		.join(" | ")}`;

	const base = baseSchema(isNullable, errorMessage).pipe(z.enum(enumValues));
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}
