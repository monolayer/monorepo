import { ZodIssueCode, z } from "zod";
import type { ZodSchemaObject, ZodType } from "./inference.js";
import {
	ColumnIdentity,
	PgBigInt,
	PgBigSerial,
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
	type Boolish,
	type ColumnInfo,
	type GeneratedAlwaysColumn,
	type NonNullableColumn,
	type PgColumn,
	type PgColumnBase,
	type PgGeneratedColumn,
} from "./pg_column.js";
import type { ColumnRecord, PgTable } from "./pg_table.js";

export type DateZodType<T extends PgTimestamp | PgTimestampTz> = z.ZodType<
	T extends NonNullableColumn
		? Date
		: T extends GeneratedAlwaysColumn
			? never
			: Date | null | undefined,
	z.ZodTypeDef,
	T extends NonNullableColumn ? Date | string : Date | string | null | undefined
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodSchema<T extends PgTable<any, any>>(table: T) {
	const cols = table.schema.columns as ColumnRecord;
	const columnSchema = Object.entries(cols).reduce((acc, [key, value]) => {
		return acc.extend({
			[key]: pgColumnSchema<typeof value, false>(value),
		});
	}, z.object({}));
	return z.object(columnSchema.shape) as unknown as TableSchema<T>;
}

function baseSchema(isNullable: boolean, errorMessage: string) {
	return z
		.any()
		.superRefine(required)
		.superRefine((val, ctx) => {
			nullable(val, ctx, isNullable, errorMessage);
		});
}

function finishSchema(isNullable: boolean, schema: z.ZodTypeAny) {
	if (isNullable) return schema.nullish();
	return schema;
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
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Invalid bigint",
				});
				return z.NEVER;
			}
		})
		.transform((val) => BigInt(val));
}

function jsonSchema(isNullable: boolean) {
	return baseSchema(
		isNullable,
		"Expected value that can be converted to JSON",
	).superRefine((val, ctx) => {
		const allowedTypes = ["boolean", "number", "string"];
		if (
			!allowedTypes.includes(typeof val) &&
			val.constructor.name !== "Object"
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Invalid JSON",
			});
			return z.NEVER;
		}
		try {
			if (typeof val === "string") {
				JSON.parse(val);
			}
			JSON.stringify(val);
		} catch (e) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Invalid JSON",
			});
			return z.NEVER;
		}
	});
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
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: errorMessage,
				});
				return z.NEVER;
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
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Value must be between ${minimum} and ${maximum}, NaN, Infinity, or -Infinity`,
				});
				return z.NEVER;
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
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: "Invalid decimal",
						});
						return z.NEVER;
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
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: errorMessage,
				});
				return z.NEVER;
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
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Precision of ${precision} exeeded.`,
				});
				return z.NEVER;
			}
			if (
				decimals !== undefined &&
				scale !== null &&
				scale !== 0 &&
				decimals.length > scale
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Maximum scale ${scale} exeeded.`,
				});
				return z.NEVER;
			}
		})
		.transform((val) => {
			return parseFloat(val);
		});
}

function stringSchema(
	errorMessage: string,
	isNullable: boolean,
	constructors = [] as string[],
) {
	return baseSchema(isNullable, errorMessage).superRefine((val, ctx) => {
		if (typeof val !== "string" && constructors.length === 0) {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: `${errorMessage}, received ${typeof val}`,
			});
			return z.NEVER;
		}
		if (
			typeof val !== "string" &&
			constructors.length > 0 &&
			!constructors.includes(val.constructor.name)
		) {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: `${errorMessage}, received ${typeof val}`,
			});
			return z.NEVER;
		}
	});
}

function dateSchema(errorMessage: string, isNullable: boolean) {
	return baseSchema(isNullable, errorMessage).superRefine((val, ctx) => {
		if (val.constructor.name === "Date") return;
		if (typeof val !== "string") {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: `${errorMessage}, received ${typeof val}`,
			});
			return z.NEVER;
		}
		try {
			Date.parse(val);
		} catch {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: `${errorMessage}, received ${typeof val}`,
			});
			return z.NEVER;
		}
	});
}

function required(val: unknown, ctx: z.RefinementCtx) {
	if (val === undefined) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "Required",
			fatal: true,
		});
		return z.NEVER;
	}
}

function nullable(
	val: unknown,
	ctx: z.RefinementCtx,
	nullable: boolean,
	message: string,
) {
	if (val === null && !nullable) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: `${message}, received null`,
			fatal: true,
		});
		return z.NEVER;
	}
}

function columnInfo(column: PgColumnBase<unknown, unknown, unknown>) {
	const info: ColumnInfo = Object.fromEntries(Object.entries(column)).info;
	return info;
}

function pgBooleanSchema<T extends PgBoolean, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const testBoolish = (val: unknown): val is Boolish => {
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
	};

	const toBooleanOrNull = (val: boolean | Boolish | null): boolean | null => {
		switch (val) {
			case true:
			case "true":
			case 1:
			case "1":
			case "yes":
			case "on":
				return true;
			case false:
			case "false":
			case 0:
			case "0":
			case "no":
			case "off":
				return false;
			case null:
				return null;
		}
	};

	const info = columnInfo(column);

	const nullable = !column._primaryKey && info.isNullable;

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
					ctx.addIssue({
						code: ZodIssueCode.custom,
						message: "Invalid boolean",
					});
				}
				return z.NEVER;
			}
		})
		.transform(toBooleanOrNull)
		.superRefine((val, ctx) => {
			if (!nullable && val === null) {
				ctx.addIssue({
					code: ZodIssueCode.invalid_type,
					expected: "boolean",
					received: "null",
				});
				return z.NEVER;
			}
		});
	if (nullable) {
		return base.optional() as unknown as ZodType<T, PK>;
	}
	return base as unknown as ZodType<T, PK>;
}

function pgTextSchema<T extends PgText, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const base = z.string();
	const info = columnInfo(column);

	return finishSchema(
		!column._primaryKey && info.isNullable,
		base,
	) as unknown as ZodType<T, PK>;
}

function pgBigintSchema<T extends PgBigInt, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const info = columnInfo(column);

	if (info.identity === ColumnIdentity.Always) {
		return z.never() as unknown as ZodType<T, PK>;
	}
	const base = bigintSchema(!column._primaryKey && info.isNullable === true)
		.pipe(z.bigint().min(-9223372036854775808n).max(9223372036854775807n))
		.transform((val) => val.toString());

	return finishSchema(
		!column._primaryKey && info.isNullable,
		base,
	) as unknown as ZodType<T, PK>;
}

function pgByteaSchema<T extends PgBytea, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const info = columnInfo(column);

	const isNullable = !column._primaryKey && info.isNullable === true;
	const base = baseSchema(isNullable, "Expected Buffer or string").superRefine(
		(val, ctx) => {
			if (
				typeof val !== "string" &&
				val?.constructor.name !== "Buffer" &&
				val !== null
			) {
				ctx.addIssue({
					code: ZodIssueCode.custom,
					message: `Expected Buffer or string, received ${typeof val}`,
				});
				return z.NEVER;
			}
		},
	);

	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

function pgDateSchema<T extends PgDate, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const info = columnInfo(column);
	const isNullable = !column._primaryKey && info.isNullable === true;
	const base = baseSchema(
		isNullable,
		"Expected Date or String that can coerce to Date",
	).pipe(z.coerce.date());
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

function pgDoublePrecisionSchema<
	T extends PgDoublePrecision,
	PK extends boolean,
>(column: T): ZodType<T, PK> {
	const info = columnInfo(column);
	const isNullable = !column._primaryKey && info.isNullable === true;
	const base = variablePrecisionSchema(-1e308, 1e308, isNullable);
	return finishSchema(isNullable, base).transform((val) =>
		val === null || val === undefined ? val : val.toString(),
	) as unknown as ZodType<T, PK>;
}

function pgFloat4Schema<T extends PgFloat4, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const info = columnInfo(column);
	const isNullable = !column._primaryKey && info.isNullable === true;
	const base = variablePrecisionSchema(-1e37, 1e37, isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

function pgFloat8Schema<T extends PgFloat8, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const info = columnInfo(column);
	const isNullable = !column._primaryKey && info.isNullable === true;
	const base = variablePrecisionSchema(-1e308, 1e308, isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

function integerSchema<
	T extends PgInt2 | PgInt4 | PgInteger,
	PK extends boolean,
>(column: T, minimum: number, maximum: number): ZodType<T, PK> {
	const info = columnInfo(column);
	if (info.identity === ColumnIdentity.Always) {
		return z.never() as unknown as ZodType<T, PK>;
	}
	const isNullable = !column._primaryKey && info.isNullable === true;

	const base = wholeNumberSchema(minimum, maximum, isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

function pgInt2Schema<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends PgInt2,
	PK extends boolean,
>(column: T): ZodType<T, PK> {
	return integerSchema<T, PK>(column, -32768, 32767);
}

function pgInt4Schema<T extends PgInt4, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return integerSchema<T, PK>(column, -2147483648, 2147483647);
}

function pgInt8Schema<T extends PgInt8, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const info = columnInfo(column);
	if (info.identity === ColumnIdentity.Always) {
		return z.never() as unknown as ZodType<T, PK>;
	}
	const isNullable = !column._primaryKey && info.isNullable === true;

	const base = bigintSchema(isNullable).pipe(
		z.coerce.bigint().min(-9223372036854775808n).max(9223372036854775807n),
	);
	return finishSchema(isNullable, base).transform((val) =>
		val !== null ? Number(val) : val,
	) as unknown as ZodType<T, PK>;
}

function pgIntegerSchema<T extends PgInteger, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return integerSchema<T, PK>(column, -2147483648, 2147483647);
}

function pgJsonSchema<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends PgJson,
	PK extends boolean,
>(column: T): ZodType<T, PK> {
	const info = columnInfo(column);
	const isNullable = !column._primaryKey && info.isNullable === true;
	const base = jsonSchema(isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

function pgJsonbSchema<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends PgJsonB,
	PK extends boolean,
>(column: T): ZodType<T, PK> {
	const info = columnInfo(column);
	const isNullable = !column._primaryKey && info.isNullable === true;
	const base = jsonSchema(isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

function pgRealSchema<T extends PgReal, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const info = columnInfo(column);
	const isNullable = !column._primaryKey && info.isNullable === true;
	const base = variablePrecisionSchema(-1e37, 1e37, isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

function pgUuidSchema<T extends PgUuid, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const info = columnInfo(column);
	const isNullable = !column._primaryKey && info.isNullable === true;
	const base = baseSchema(isNullable, "Expected uuid").pipe(z.string().uuid());
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

function characterSchema<T extends PgChar | PgVarChar, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const info = columnInfo(column);
	const isNullable = !column._primaryKey && info.isNullable === true;
	if (info.characterMaximumLength !== null) {
		return finishSchema(
			isNullable,
			z.string().max(info.characterMaximumLength),
		) as unknown as ZodType<T, PK>;
	}
	return finishSchema(isNullable, z.string()) as unknown as ZodType<T, PK>;
}

function pgVarcharSchema<T extends PgVarChar, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return characterSchema<T, PK>(column);
}

function pgCharSchema<T extends PgChar, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return characterSchema<T, PK>(column);
}

const TIME_REGEX =
	/^((?:\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:[+-]\d{1,2}(?::?\d{2})?)?)|(\d{6}(?:[+-]\d{2}(?::?\d{2}){0,2})?))$/;

function timeSchema<T extends PgTime | PgTimeTz, PK extends boolean>(
	column: T,
	invalidTimeMessage: string,
): ZodType<T, PK> {
	const info = columnInfo(column);
	const isNullable = !column._primaryKey && info.isNullable === true;
	const base = stringSchema(
		"Expected string with time format",
		isNullable,
	).pipe(z.string().regex(TIME_REGEX, invalidTimeMessage));
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

function pgTimeSchema<T extends PgTime, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return timeSchema<T, PK>(column, "Invalid time");
}

function pgTimeTzSchema<T extends PgTimeTz, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return timeSchema<T, PK>(column, "Invalid time with time zone");
}

function timestampSchema<
	T extends PgTimestamp | PgTimestampTz,
	PK extends boolean,
>(column: T): ZodType<T, PK> {
	const info = columnInfo(column);
	const isNullable = !column._primaryKey && info.isNullable === true;
	const base = dateSchema(
		"Expected date or string with date format",
		isNullable,
	).pipe(z.coerce.date());
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

function pgTimestampSchema<T extends PgTimestamp, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return timestampSchema<T, PK>(column);
}

function pgTimestampTzSchema<T extends PgTimestampTz, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return timestampSchema<T, PK>(column);
}

function pgNumericSchema<T extends PgNumeric, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const info = columnInfo(column);
	const isNullable = !column._primaryKey && info.isNullable === true;
	const base = decimalSchema(
		info.numericPrecision,
		info.numericScale,
		isNullable,
		"Expected bigint, number or string that can be converted to a number",
	);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

function pgEnumSchema<T extends PgEnum, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const info = columnInfo(column);
	const isNullable = !column._primaryKey && info.isNullable === true;
	const enumValues = column.values as unknown as [string, ...string[]];
	const errorMessage = `Expected ${enumValues
		.map((v) => `'${v}'`)
		.join(" | ")}`;

	const base = baseSchema(isNullable, errorMessage).pipe(z.enum(enumValues));
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TableSchema<T extends PgTable<any, any>> =
	T extends PgTable<infer C, infer PK> ? ZodSchemaObject<C, PK> : never;

function generatedColumnSchema<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends PgGeneratedColumn<any, any>,
	PK extends boolean,
>(): ZodType<T, PK> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return z.never() as unknown as ZodType<T, PK>;
}

function pgColumnSchema<
	T extends
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
	PK extends boolean = false,
>(column: T): ZodType<T, PK> {
	if (isPgBoolean(column)) {
		return pgBooleanSchema(column);
	}
	if (isPgText(column)) {
		return pgTextSchema(column);
	}
	if (isBigInt(column)) {
		return pgBigintSchema(column);
	}
	if (isGeneratedColumn(column)) {
		return generatedColumnSchema<typeof column, PK>();
	}
	if (isBytea(column)) {
		return pgByteaSchema(column);
	}
	if (isJson(column)) {
		return pgJsonSchema(column);
	}
	if (isJsonB(column)) {
		return pgJsonbSchema(column);
	}
	if (isDate(column)) {
		return pgDateSchema(column);
	}
	if (isDoublePrecision(column)) {
		return pgDoublePrecisionSchema(column);
	}
	if (isFloat4(column)) {
		return pgFloat4Schema(column);
	}
	if (isFloat8(column)) {
		return pgFloat8Schema(column);
	}
	if (isInt2(column)) {
		return pgInt2Schema(column);
	}
	if (isInt4(column)) {
		return pgInt4Schema(column);
	}
	if (isInt8(column)) {
		return pgInt8Schema(column);
	}
	if (isInteger(column)) {
		return pgIntegerSchema(column);
	}
	if (isReal(column)) {
		return pgRealSchema(column);
	}
	if (isUuid(column)) {
		return pgUuidSchema(column);
	}
	if (isTime(column)) {
		return pgTimeSchema(column);
	}
	if (isTimeTz(column)) {
		return pgTimeTzSchema(column);
	}
	if (isTimestamp(column)) {
		return pgTimestampSchema(column);
	}
	if (isTimestampTz(column)) {
		return pgTimestampTzSchema(column);
	}
	if (isNumeric(column)) {
		return pgNumericSchema(column);
	}
	if (isEnum(column)) {
		return pgEnumSchema(column);
	}
	if (isVarchar(column)) {
		return pgVarcharSchema(column);
	}
	if (isChar(column)) {
		return pgCharSchema(column);
	}
	return z.never() as unknown as ZodType<T, PK>;
}

function isPgBoolean(
	column: PgColumnBase<unknown, unknown, unknown>,
): column is PgBoolean {
	return column instanceof PgBoolean;
}

function isPgText(
	column: PgColumnBase<unknown, unknown, unknown>,
): column is PgText {
	return column instanceof PgText;
}

function isBigInt(
	column: PgColumnBase<unknown, unknown, unknown>,
): column is PgBigInt {
	return column instanceof PgBigInt;
}

function isGeneratedColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgGeneratedColumn<unknown, unknown> {
	return column instanceof PgBigSerial;
}

function isBytea(
	column:
		| PgColumnBase<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgBytea {
	return column instanceof PgBytea;
}

function isJson(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgJson {
	return column instanceof PgJson;
}

function isJsonB(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgJsonB {
	return column instanceof PgJsonB;
}

function isDate(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgDate {
	return column instanceof PgDate;
}

function isDoublePrecision(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgDoublePrecision {
	return column instanceof PgDoublePrecision;
}

function isFloat4(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgFloat4 {
	return column instanceof PgFloat4;
}

function isFloat8(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgFloat8 {
	return column instanceof PgFloat8;
}

function isInt2(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgInt2 {
	return column instanceof PgInt2;
}

function isInt4(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgInt4 {
	return column instanceof PgInt4;
}

function isInt8(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgInt8 {
	return column instanceof PgInt8;
}

function isInteger(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgInteger {
	return column instanceof PgInteger;
}

function isReal(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgReal {
	return column instanceof PgReal;
}

function isUuid(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgUuid {
	return column instanceof PgUuid;
}

function isTime(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgTime {
	return column instanceof PgTime;
}

function isTimeTz(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgTimeTz {
	return column instanceof PgTimeTz;
}

function isTimestamp(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgTimestamp {
	return column instanceof PgTimestamp;
}

function isTimestampTz(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgTimestampTz {
	return column instanceof PgTimestampTz;
}

function isNumeric(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgNumeric {
	return column instanceof PgNumeric;
}

function isEnum(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgEnum {
	return column instanceof PgEnum;
}

function isVarchar(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgVarChar {
	return column instanceof PgVarChar;
}

function isChar(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgChar {
	return column instanceof PgChar;
}
