import { z } from "zod";
import { type PgColumn, type SerialColumn } from "~/schema/column/column.js";
import { PgUuid } from "~/schema/column/data-types/uuid.js";
import type { ZodType } from "~/schema/inference.js";
import { baseSchema, finishSchema } from "../common.js";
import { nullableColumn } from "../helpers.js";

export function isUuid(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
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
