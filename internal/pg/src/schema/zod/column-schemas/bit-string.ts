import { z } from "zod";
import type { PgColumn, SerialColumn } from "~pg/schema/column/column.js";
import { PgBitVarying } from "~pg/schema/column/data-types/bit-varying.js";
import { PgBit } from "~pg/schema/column/data-types/bit.js";
import { finishSchema } from "~pg/schema/zod/common.js";
import { columnData } from "~pg/schema/zod/helpers.js";
import { bitRegex } from "~pg/schema/zod/regexes/regex.js";

export function bitSchema(column: PgBit) {
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
	);
}

export function varbitSchema(column: PgBitVarying) {
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
		);
	}
	return finishSchema(isNullable, base);
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
