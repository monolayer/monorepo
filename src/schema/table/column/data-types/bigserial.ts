import { SerialColumn } from "../column.js";

export function bigserial() {
	return new PgBigSerial();
}
export class PgBigSerial extends SerialColumn<
	string,
	number | bigint | string
> {
	/**
	 * @hidden
	 */
	constructor() {
		super("bigserial", "bigserial");
	}
}
