import { z } from "zod";
import type { PgColumn, SerialColumn } from "~pg/schema/column/column.js";
import { PgUuid } from "~pg/schema/column/data-types/uuid.js";
import { baseSchema, finishSchema } from "~pg/schema/zod/common.js";
import { nullableColumn } from "~pg/schema/zod/helpers.js";

export function isUuid(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgUuid {
	return column instanceof PgUuid;
}
export function pgUuidSchema(column: PgUuid) {
	const isNullable = nullableColumn(column);
	const base = baseSchema(isNullable, "Expected uuid").pipe(z.string().uuid());
	return finishSchema(isNullable, base);
}
