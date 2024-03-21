import { z } from "zod";
import { PgColumn, SerialColumn } from "~/schema/column/column.js";
import { PgBitVarying } from "~/schema/column/data-types/bit-varying.js";
import { PgBit } from "~/schema/column/data-types/bit.js";
import type { ZodType } from "~/schema/inference.js";
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
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgBit {
	return column instanceof PgBit;
}

export function isVarbitColumn(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgBitVarying {
	return column instanceof PgBitVarying;
}
