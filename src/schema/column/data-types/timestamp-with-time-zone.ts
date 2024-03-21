import { PgColumn, valueWithHash } from "../column.js";
import { DateTimePrecision } from "../types.js";

export function timestampWithTimeZone(precision?: DateTimePrecision) {
	return new PgTimestampWithTimeZone(precision);
}

export function timestamptz(precision?: DateTimePrecision) {
	return timestampWithTimeZone(precision);
}

export class PgTimestampWithTimeZone extends PgColumn<Date, Date | string> {
	/**
	 * @hidden
	 */
	constructor(precision?: DateTimePrecision) {
		if (precision !== undefined) {
			super(
				`timestamp(${precision}) with time zone`,
				`timestamp with time zone`,
			);
			this.info.datetimePrecision = precision;
		} else {
			super("timestamp with time zone", `timestamp with time zone`);
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
