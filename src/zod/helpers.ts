import { z } from "zod";
import {
	type Boolish,
	type ColumnInfo,
	type PgColumnBase,
	type PgColumnTypes,
} from "../schema/pg_column.js";

export function columnInfo(column: PgColumnBase<unknown, unknown, unknown>) {
	const info: ColumnInfo = Object.fromEntries(Object.entries(column)).info;
	return info;
}

export function customIssue(ctx: z.RefinementCtx, message: string) {
	ctx.addIssue({
		code: z.ZodIssueCode.custom,
		message,
	});
	return z.NEVER;
}

export function toBooleanOrNull(val: boolean | Boolish | null): boolean | null {
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
}
export function nullableColumn<T extends PgColumnTypes>(column: T) {
	return !column._primaryKey && columnInfo(column).isNullable === true;
}
