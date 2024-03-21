import {
	PgBigSerial,
	PgSerial,
	type PgColumn,
	type PgGeneratedColumn,
} from "~/schema/column/column.js";

export function isBigserial(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgBigSerial {
	return column instanceof PgBigSerial;
}

export function isSerial(
	column:
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
): column is PgSerial {
	return column instanceof PgSerial;
}
