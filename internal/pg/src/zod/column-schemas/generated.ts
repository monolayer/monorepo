import type { PgColumn, SerialColumn } from "~pg/schema/column/column.js";
import type { PgBigSerial } from "~pg/schema/column/data-types/bigserial.js";
import type { PgSerial } from "~pg/schema/column/data-types/serial.js";

export function isBigserial(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgBigSerial {
	return column.constructor.name === "PgBigSerial";
}

export function isSerial(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgSerial {
	return column.constructor.name === "PgSerial";
}
