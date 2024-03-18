import { z } from "zod";
import type { ZodType } from "~/schema/inference.js";
import {
	PgBit,
	PgBitVarying,
	PgColumn,
	PgGeneratedColumn,
} from "~/schema/pg_column.js";
import { finishSchema } from "../common.js";
import { columnData } from "../helpers.js";
import { bitRegex } from "../regexes/regex.js";

export function bitSchema<T extends PgBit, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = z.string().regex(bitRegex, "Invalid bit");
	if (data.info.characterMaximumLength === null) {
		data.info.characterMaximumLength = 1;
	}
	return finishSchema(
		isNullable,
		base.max(
			data.info.characterMaximumLength,
			"Bit string length does not match type",
		),
	) as unknown as ZodType<T, PK>;
}

export function varbitSchema<T extends PgBitVarying, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = z.string().regex(bitRegex, "Invalid bit");
	if (data.info.characterMaximumLength !== null) {
		return finishSchema(
			isNullable,
			base.max(
				data.info.characterMaximumLength,
				"Bit string length does not match type",
			),
		) as unknown as ZodType<T, PK>;
	}
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function isBitColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgBit {
	return column instanceof PgBit;
}

export function isVarbitColumn(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgBitVarying {
	return column instanceof PgBitVarying;
}
