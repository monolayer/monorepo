import { PgColumn, valueWithHash } from "../column.js";
import { DateTimePrecision } from "../types.js";

export function timestamp(precision?: DateTimePrecision) {
	return new PgTimestamp(precision);
}

export class PgTimestamp extends PgColumn<Date, Date | string> {
	/**
	 * @hidden
	 */
	constructor(precision?: DateTimePrecision) {
		if (precision !== undefined) {
			super(`timestamp(${precision})`, `timestamp without time zone`);
			this.info.datetimePrecision = precision;
		} else {
			super("timestamp", `timestamp without time zone`);
		}
	}

	/**
	 * @hidden
	 */
	protected transformDefault(value: string | Date) {
		let val: string;
		if (value instanceof Date) {
			val = value.toISOString();
		} else {
			val = value;
		}
		return valueWithHash(`'${val}'::${this._native_data_type}`);
	}
}
