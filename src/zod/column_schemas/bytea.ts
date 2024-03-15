import type { ZodType } from "~/schema/inference.js";
import {
	PgBytea,
	type PgColumnBase,
	type PgGeneratedColumn,
} from "~/schema/pg_column.js";
import { baseSchema, finishSchema } from "../common.js";
import { customIssue, nullableColumn } from "../helpers.js";

export function isBytea(
	column:
		| PgColumnBase<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgBytea {
	return column instanceof PgBytea;
}

export function pgByteaSchema<T extends PgBytea, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
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
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}
