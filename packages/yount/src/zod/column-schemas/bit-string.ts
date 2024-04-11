import { z } from "zod";
import {
	PgColumn,
	SerialColumn,
} from "~/database/schema/table/column/column.js";
import { PgBitVarying } from "~/database/schema/table/column/data-types/bit-varying.js";
import { PgBit } from "~/database/schema/table/column/data-types/bit.js";
import { finishSchema } from "../common.js";
import { columnData } from "../helpers.js";
import { bitRegex } from "../regexes/regex.js";

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
