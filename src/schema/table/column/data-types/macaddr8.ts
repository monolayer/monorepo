import { StringColumn } from "../column.js";

export function macaddr8() {
	return new PgMacaddr8();
}

export class PgMacaddr8 extends StringColumn {
	/**
	 * @hidden
	 */
	constructor() {
		super("macaddr8");
	}
}
