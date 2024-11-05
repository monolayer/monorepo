import {
	type PgColumn,
	type SerialColumn,
} from "@monorepo/pg/schema/column//column.js";
import type { PgBitVarying } from "@monorepo/pg/schema/column/data-types/bit-varying.js";
import type { PgBit } from "@monorepo/pg/schema/column/data-types/bit.js";
import { z } from "zod";
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
	return column.constructor.name === "PgBit";
}

export function isVarbitColumn(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgBitVarying {
	return column.constructor.name === "PgBitVarying";
}
