import { StringColumn } from "../column.js";

export function macaddr() {
	return new PgMacaddr();
}

export class PgMacaddr extends StringColumn {
	/**
	 * @hidden
	 */
	constructor() {
		super("macaddr");
	}
}
