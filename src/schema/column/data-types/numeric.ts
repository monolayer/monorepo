import { PgColumn } from "../column.js";

export function numeric(precision?: number, scale?: number) {
	return new PgNumeric(precision, scale);
}

export class PgNumeric extends PgColumn<string, number | bigint | string> {
	/**
	 * @hidden
	 */
	constructor(precision?: number, scale = 0) {
		if (precision !== undefined) {
			super(`numeric(${precision}, ${scale})`, "numeric");
			this.info.numericPrecision = precision;
			this.info.numericScale = scale;
		} else {
			super("numeric", "numeric");
		}
	}
}
