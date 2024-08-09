import { z } from "zod";
import type { PgColumn, SerialColumn } from "~/schema/column/column.js";
import { PgUuid } from "~/schema/column/data-types/uuid.js";
import { baseSchema, finishSchema } from "~/schema/zod/common.js";
import { nullableColumn } from "~/schema/zod/helpers.js";

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
