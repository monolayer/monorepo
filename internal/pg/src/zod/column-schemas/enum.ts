import { z } from "zod";
import type { PgColumn, SerialColumn } from "~pg/schema/column/column.js";
import type { PgEnum } from "~pg/schema/column/data-types/enumerated.js";
import { baseSchema, finishSchema } from "../common.js";
import { nullableColumn } from "../helpers.js";

export function isEnum(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): column is PgEnum<any> {
	return column.constructor.name === "PgEnum";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pgEnumSchema(column: PgEnum<any>) {
	const isNullable = nullableColumn(column);
	const data = Object.fromEntries(Object.entries(column)) as {
		values: [string, ...string[]];
	};
	const enumValues = data.values as unknown as [string, ...string[]];
	const errorMessage = `Expected ${enumValues
		.map((v) => `'${v}'`)
		.join(" | ")}`;

	const base = baseSchema(isNullable, errorMessage).pipe(z.enum(enumValues));
	return finishSchema(isNullable, base);
}
