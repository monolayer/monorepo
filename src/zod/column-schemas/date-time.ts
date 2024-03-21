import { z } from "zod";
import {
	PgDate,
	PgTime,
	PgTimeWithTimeZone,
	PgTimestamp,
	PgTimestampWithTimeZone,
	type PgColumn,
	type PgGeneratedColumn,
} from "~/schema/column/column.js";
import type { ZodType } from "~/schema/inference.js";
import { baseSchema, finishSchema, stringSchema } from "../common.js";
import { columnData, customIssue, nullableColumn } from "../helpers.js";
import { timeRegex } from "../regexes/regex.js";

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
): column is PgTimeWithTimeZone {
	return column instanceof PgTimeWithTimeZone;
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
): column is PgTimestampWithTimeZone {
	return column instanceof PgTimestampWithTimeZone;
}

export function isDate(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgDate {
	return column instanceof PgDate;
}

export function pgTimeSchema<T extends PgTime, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return timeSchema<T, PK>(column, "Invalid time");
}

export function pgTimeTzSchema<
	T extends PgTimeWithTimeZone,
	PK extends boolean,
>(column: T): ZodType<T, PK> {
	return timeSchema<T, PK>(column, "Invalid time with time zone");
}

export function pgTimestampSchema<T extends PgTimestamp, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return timestampSchema<T, PK>(column);
}

export function pgTimestampTzSchema<
	T extends PgTimestampWithTimeZone,
	PK extends boolean,
>(column: T): ZodType<T, PK> {
	return timestampSchema<T, PK>(column);
}

export function pgDateSchema<T extends PgDate, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	const base = baseSchema(
		isNullable,
		"Expected Date or String that can coerce to Date",
	).pipe(z.coerce.date().min(new Date("-004713-12-31T23:59:59.999Z")));
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

function timestampSchema<
	T extends PgTimestamp | PgTimestampWithTimeZone,
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

function timeSchema<T extends PgTime | PgTimeWithTimeZone, PK extends boolean>(
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

function dateSchema(errorMessage: string, isNullable: boolean) {
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
