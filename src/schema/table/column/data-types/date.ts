import { PgColumn, valueWithHash } from "../column.js";

export function date() {
	return new PgDate();
}

export class PgDate extends PgColumn<Date, Date | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("date", "date");
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
		return valueWithHash(
			`'${val.split("T")[0] || ""}'::${this._native_data_type}`,
		);
	}
}
