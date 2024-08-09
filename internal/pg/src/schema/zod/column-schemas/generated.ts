import type { PgColumn, SerialColumn } from "~/schema/column/column.js";
import { PgBigSerial } from "~/schema/column/data-types/bigserial.js";
import { PgSerial } from "~/schema/column/data-types/serial.js";

export function isBigserial(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgBigSerial {
	return column instanceof PgBigSerial;
}

export function isSerial(
	column: PgColumn<unknown, unknown, unknown> | SerialColumn<unknown, unknown>,
): column is PgSerial {
	return column instanceof PgSerial;
}
