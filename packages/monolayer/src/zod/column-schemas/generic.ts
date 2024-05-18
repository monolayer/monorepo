import type { PgColumnBase } from "~/database/schema/table/column/column.js";
import { PgGenericColumn } from "~/database/schema/table/column/generic-column.js";
import { baseSchema, finishSchema } from "../common.js";
import { nullableColumn } from "../helpers.js";

export function isPgGenericColumn(
	column: PgColumnBase<unknown, unknown, unknown>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): column is PgGenericColumn<any, any> {
	return column instanceof PgGenericColumn;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pgGenericSchema(column: PgGenericColumn<any, any>) {
	const isNullable = nullableColumn(column);
	return finishSchema(isNullable, baseSchema(isNullable, "Expected value"));
}
