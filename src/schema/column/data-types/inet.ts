import { StringColumn } from "../column.js";

export function inet() {
	return new PgInet();
}

export class PgInet extends StringColumn {
	/**
	 * @hidden
	 */
	constructor() {
		super("inet");
	}
}
