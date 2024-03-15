import type { ZodType } from "~/schema/inference.js";
import {
	PgTsquery,
	PgTsvector,
	type PgColumn,
	type PgGeneratedColumn,
} from "~/schema/pg_column.js";
import { finishSchema, stringSchema } from "../common.js";
import { columnData } from "../helpers.js";

export function tsvectorSchema<T extends PgTsvector, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = stringSchema("Expected string with tsvector format", isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function tsquerySchema<T extends PgTsquery, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = stringSchema("Expected string with tsquery format", isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function isTsvectorColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgTsvector {
	return column instanceof PgTsvector;
}

export function isTsQueryColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgTsquery {
	return column instanceof PgTsquery;
}
