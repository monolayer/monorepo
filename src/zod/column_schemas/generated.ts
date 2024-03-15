import { z } from "zod";
import type { ZodType } from "~/schema/inference.js";
import {
	PgBigSerial,
	type PgColumn,
	type PgGeneratedColumn,
} from "~/schema/pg_column.js";

export function generatedColumnSchema<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends PgGeneratedColumn<any, any>,
	PK extends boolean,
>(): ZodType<T, PK> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return z.never() as unknown as ZodType<T, PK>;
}

export function isGeneratedColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgGeneratedColumn<unknown, unknown> {
	return column instanceof PgBigSerial;
}
