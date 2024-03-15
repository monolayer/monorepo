import { z } from "zod";
import type { ZodType } from "~/schema/inference.js";
import {
	PgChar,
	PgText,
	PgVarChar,
	type PgColumn,
	type PgColumnBase,
	type PgGeneratedColumn,
} from "~/schema/pg_column.js";
import { finishSchema } from "../common.js";
import { columnData, nullableColumn } from "../helpers.js";

export function pgVarcharSchema<T extends PgVarChar, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return characterSchema<T, PK>(column);
}

export function pgCharSchema<T extends PgChar, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	return characterSchema<T, PK>(column);
}

export function isVarchar(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgVarChar {
	return column instanceof PgVarChar;
}

export function isChar(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgChar {
	return column instanceof PgChar;
}

export function isPgText(
	column: PgColumnBase<unknown, unknown, unknown>,
): column is PgText {
	return column instanceof PgText;
}

export function pgTextSchema<T extends PgText, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const isNullable = nullableColumn(column);
	return finishSchema(isNullable, z.string()) as unknown as ZodType<T, PK>;
}

export function characterSchema<
	T extends PgChar | PgVarChar,
	PK extends boolean,
>(column: T): ZodType<T, PK> {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	if (data.info.characterMaximumLength !== null) {
		return finishSchema(
			isNullable,
			z.string().max(data.info.characterMaximumLength),
		) as unknown as ZodType<T, PK>;
	}
	return finishSchema(isNullable, z.string()) as unknown as ZodType<T, PK>;
}
