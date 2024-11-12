import type { PgColumn, SerialColumn } from "~pg/schema/column/column.js";
import type { PgXML } from "~pg/schema/column/data-types/xml.js";
import { finishSchema, stringSchema } from "../common.js";
import { columnData } from "../helpers.js";

export function xmlSchema(column: PgXML) {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = stringSchema("Expected string with xml format", isNullable);
	return finishSchema(isNullable, base);
}

export function isXMLColumn(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgXML {
	return column.constructor.name === "PgXML";
}
