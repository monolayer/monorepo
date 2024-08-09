import { z } from "zod";
import type { PgColumn, SerialColumn } from "~/schema/column/column.js";
import { PgDate } from "~/schema/column/data-types/date.js";
import { PgTimeWithTimeZone } from "~/schema/column/data-types/time-with-time-zone.js";
import { PgTime } from "~/schema/column/data-types/time.js";
import { PgTimestampWithTimeZone } from "~/schema/column/data-types/timestamp-with-time-zone.js";
import { PgTimestamp } from "~/schema/column/data-types/timestamp.js";
import { baseSchema, finishSchema, stringSchema } from "~/schema/zod/common.js";
import {
	columnData,
	customIssue,
	nullableColumn,
} from "~/schema/zod/helpers.js";
import { timeRegex } from "~/schema/zod/regexes/regex.js";

export function isTime(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgTime {
	return column instanceof PgTime;
}

export function isTimeTz(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgTimeWithTimeZone {
	return column instanceof PgTimeWithTimeZone;
}

export function isTimestamp(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgTimestamp {
	return column instanceof PgTimestamp;
}

export function isTimestampTz(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgTimestampWithTimeZone {
	return column instanceof PgTimestampWithTimeZone;
}

export function isDate(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgDate {
	return column instanceof PgDate;
}

export function pgTimeSchema(column: PgTime) {
	return timeSchema(column, "Invalid time");
}

export function pgTimeTzSchema(column: PgTimeWithTimeZone) {
	return timeSchema(column, "Invalid time with time zone");
}

export function pgTimestampSchema(column: PgTimestamp) {
	return timestampSchema(column);
}

export function pgTimestampTzSchema(column: PgTimestampWithTimeZone) {
	return timestampSchema(column);
}

export function pgDateSchema(column: PgDate) {
	const isNullable = nullableColumn(column);
	const base = baseSchema(
		isNullable,
		"Expected Date or String that can coerce to Date",
	).pipe(z.coerce.date().min(new Date("-004713-12-31T23:59:59.999Z")));
	return finishSchema(isNullable, base);
}

function timestampSchema(column: PgTimestamp | PgTimestampWithTimeZone) {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = dateSchema(
		"Expected date or string with date format",
		isNullable,
	).pipe(z.coerce.date());
	return finishSchema(isNullable, base);
}

function timeSchema(
	column: PgTime | PgTimeWithTimeZone,
	invalidTimeMessage: string,
) {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = stringSchema(
		"Expected string with time format",
		isNullable,
	).pipe(z.string().regex(timeRegex, invalidTimeMessage));
	return finishSchema(isNullable, base);
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
