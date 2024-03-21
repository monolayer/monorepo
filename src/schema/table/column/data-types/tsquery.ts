import { StringColumn } from "../column.js";

export function tsquery() {
	return new PgTsquery();
}

export class PgTsquery extends StringColumn {
	/**
	 * @hidden
	 */
	constructor() {
		super("tsquery");
	}
}
