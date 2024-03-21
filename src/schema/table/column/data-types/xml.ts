import { StringColumn } from "../column.js";

export function xml() {
	return new PgXML();
}

export class PgXML extends StringColumn {
	/**
	 * @hidden
	 */
	constructor() {
		super("xml");
	}
}
