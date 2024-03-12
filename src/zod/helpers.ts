import { z } from "zod";
import {
	type Boolish,
	type ColumnInfo,
	type PgColumnBase,
	type TableColumn,
} from "../schema/pg_column.js";

type ColumnData = {
	info: ColumnInfo;
	_primaryKey: boolean;
};
export function columnData(column: PgColumnBase<unknown, unknown, unknown>) {
	const data = Object.fromEntries(Object.entries(column)) as ColumnData;
	return data;
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
export function nullableColumn<T extends TableColumn>(column: T) {
	const data = columnData(column);
	return !data._primaryKey && data.info.isNullable === true;
}
