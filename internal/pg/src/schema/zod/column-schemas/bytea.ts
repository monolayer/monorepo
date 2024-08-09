import type { PgColumnBase, SerialColumn } from "~/schema/column/column.js";
import { PgBytea } from "~/schema/column/data-types/bytea.js";
import { baseSchema, finishSchema } from "~/schema/zod/common.js";
import { customIssue, nullableColumn } from "~/schema/zod/helpers.js";

export function isBytea(
	column:
		| PgColumnBase<unknown, unknown, unknown>
		| SerialColumn<unknown, unknown>,
): column is PgBytea {
	return column instanceof PgBytea;
}

export function pgByteaSchema(column: PgBytea) {
	const isNullable = nullableColumn(column);
	const base = baseSchema(isNullable, "Expected Buffer or string").superRefine(
		(val, ctx) => {
			if (
				typeof val !== "string" &&
				val?.constructor.name !== "Buffer" &&
				val !== null
			) {
				return customIssue(
					ctx,
					`Expected Buffer or string, received ${typeof val}`,
				);
			}
		},
	);
	return finishSchema(isNullable, base);
}
