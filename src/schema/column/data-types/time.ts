import { PgColumn } from "../column.js";
import { DateTimePrecision } from "../types.js";

export function time(precision?: DateTimePrecision) {
	return new PgTime(precision);
}

export class PgTime extends PgColumn<string, string> {
	/**
	 * @hidden
	 */
	constructor(precision?: DateTimePrecision) {
		if (precision !== undefined) {
			super(`time(${precision})`, `time without time zone`);
			this.info.datetimePrecision = precision;
		} else {
			super("time", `time without time zone`);
		}
	}
}
