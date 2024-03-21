import { SerialColumn } from "../column.js";

export function serial() {
	return new PgSerial();
}
export class PgSerial extends SerialColumn<number, number | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("serial", "serial");
	}
}
