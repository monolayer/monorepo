import { z } from "zod";
import {
	type PgColumn,
	type PgColumnBase,
	type SerialColumn,
} from "~/schema/table/column/column.js";
import { PgCharacterVarying } from "~/schema/table/column/data-types/character-varying.js";
import { PgCharacter } from "~/schema/table/column/data-types/character.js";
import { PgText } from "~/schema/table/column/data-types/text.js";
import { finishSchema } from "../common.js";
import { columnData, nullableColumn } from "../helpers.js";

export function pgVarcharSchema(column: PgCharacterVarying) {
	return characterSchema(column);
}

export function pgCharSchema(column: PgCharacter) {
	return characterSchema(column);
}

export function isVarchar(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgCharacterVarying {
	return column instanceof PgCharacterVarying;
}

export function isChar(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgCharacter {
	return column instanceof PgCharacter;
}

export function isPgText(
	column: PgColumnBase<unknown, unknown, unknown>,
): column is PgText {
	return column instanceof PgText;
}

export function pgTextSchema(column: PgText) {
	const isNullable = nullableColumn(column);
	return finishSchema(isNullable, z.string());
}

export function characterSchema(column: PgCharacter | PgCharacterVarying) {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	if (data.info.characterMaximumLength !== null) {
		return finishSchema(
			isNullable,
			z.string().max(data.info.characterMaximumLength),
		);
	}
	return finishSchema(isNullable, z.string());
}
