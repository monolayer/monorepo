import { PgColumn } from "../column.js";

export function real() {
	return new PgReal();
}

export class PgReal extends PgColumn<number, number | bigint | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("real", "real");
	}
}
