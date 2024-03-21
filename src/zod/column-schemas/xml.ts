import type { ZodType } from "~/schema/inference.js";
import {
	type PgColumn,
	type SerialColumn,
} from "~/schema/table/column/column.js";
import { PgXML } from "~/schema/table/column/data-types/xml.js";
import { finishSchema, stringSchema } from "../common.js";
import { columnData } from "../helpers.js";

export function xmlSchema<T extends PgXML, PK extends boolean>(
	column: T,
): ZodType<T, PK> {
	const data = columnData(column);
	const isNullable = !data._primaryKey && data.info.isNullable === true;
	const base = stringSchema("Expected string with xml format", isNullable);
	return finishSchema(isNullable, base) as unknown as ZodType<T, PK>;
}

export function isXMLColumn(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgXML {
	return column instanceof PgXML;
}
