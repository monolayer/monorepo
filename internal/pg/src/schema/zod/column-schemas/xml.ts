import type { PgColumn, SerialColumn } from "~/schema/column/column.js";
import { PgXML } from "~/schema/column/data-types/xml.js";
import { finishSchema, stringSchema } from "~/schema/zod/common.js";
import { columnData } from "~/schema/zod/helpers.js";

export function xmlSchema(column: PgXML) {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = stringSchema("Expected string with xml format", isNullable);
	return finishSchema(isNullable, base);
}

export function isXMLColumn(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgXML {
	return column instanceof PgXML;
}
