import type { PgColumn, SerialColumn } from "~pg/schema/column/column.js";
import type { PgTsquery } from "~pg/schema/column/data-types/tsquery.js";
import type { PgTsvector } from "~pg/schema/column/data-types/tsvector.js";
import { finishSchema, stringSchema } from "../common.js";
import { columnData } from "../helpers.js";

export function tsvectorSchema(column: PgTsvector) {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = stringSchema("Expected string with tsvector format", isNullable);
	return finishSchema(isNullable, base);
}

export function tsquerySchema(column: PgTsquery) {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = stringSchema("Expected string with tsquery format", isNullable);
	return finishSchema(isNullable, base);
}

export function isTsvectorColumn(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgTsvector {
	return column.constructor.name === "PgTsvector";
}

export function isTsQueryColumn(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgTsquery {
	return column.constructor.name === "PgTsquery";
}
