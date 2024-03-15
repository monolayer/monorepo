import { z } from "zod";
import type { ZodType } from "~/schema/inference.js";
import {
	PgEnum,
	type PgColumn,
	type PgGeneratedColumn,
} from "~/schema/pg_column.js";
import { baseSchema, finishSchema } from "../common.js";
import { nullableColumn } from "../helpers.js";

export function isEnum(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): column is PgEnum<any> {
	return column instanceof PgEnum;
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
