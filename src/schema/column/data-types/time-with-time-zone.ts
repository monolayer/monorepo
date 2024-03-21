import { PgColumn } from "../column.js";
import { DateTimePrecision } from "../types.js";

export function timeWithTimeZone(precision?: DateTimePrecision) {
	return new PgTimeWithTimeZone(precision);
}

export function timetz(precision?: DateTimePrecision) {
	return timeWithTimeZone(precision);
}

export class PgTimeWithTimeZone extends PgColumn<string, string> {
	/**
	 * @hidden
	 */
	constructor(precision?: DateTimePrecision) {
		if (precision !== undefined) {
			super(`time(${precision}) with time zone`, `time with time zone`);
			this.info.datetimePrecision = precision;
		} else {
			super("time with time zone", `time with time zone`);
		}
	}
}
