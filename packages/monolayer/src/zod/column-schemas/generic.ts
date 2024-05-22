import { pgColumnWithType } from "~/database/schema/table/column/column-with-type.js";
import type { PgColumnBase } from "~/database/schema/table/column/column.js";
import { baseSchema, finishSchema } from "../common.js";
import { nullableColumn } from "../helpers.js";

export function isPgGenericColumn(
	column: PgColumnBase<unknown, unknown, unknown>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): column is pgColumnWithType<any, any> {
	return column instanceof pgColumnWithType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pgGenericSchema(column: pgColumnWithType<any, any>) {
	const isNullable = nullableColumn(column);
	return finishSchema(isNullable, baseSchema(isNullable, "Expected value"));
}
