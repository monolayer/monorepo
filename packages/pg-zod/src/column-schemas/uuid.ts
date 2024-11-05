import type {
	PgColumn,
	SerialColumn,
} from "@monorepo/pg/schema/column/column.js";
import type { PgUuid } from "@monorepo/pg/schema/column/data-types/uuid.js";
import { z } from "zod";
import { baseSchema, finishSchema } from "../common.js";
import { nullableColumn } from "../helpers.js";

export function isUuid(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgUuid {
	return column.constructor.name === "PgUuid";
}
export function pgUuidSchema(column: PgUuid) {
	const isNullable = nullableColumn(column);
	const base = baseSchema(isNullable, "Expected uuid").pipe(z.string().uuid());
	return finishSchema(isNullable, base);
}
