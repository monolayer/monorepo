import { z } from "zod";
import {
	PgUuid,
	type PgColumn,
	type PgGeneratedColumn,
} from "~/schema/column.js";
import type { ZodType } from "~/schema/inference.js";
import { baseSchema, finishSchema } from "../common.js";
import { nullableColumn } from "../helpers.js";

export function isUuid(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgUuid {
	return column instanceof PgUuid;
}
export function pgUuidSchema<T extends PgUuid, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	const base = baseSchema(isNullable, "Expected uuid").pipe(z.string().uuid());
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}
