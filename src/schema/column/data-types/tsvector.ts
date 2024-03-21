import { StringColumn } from "../column.js";

export function tsvector() {
	return new PgTsvector();
}

export class PgTsvector extends StringColumn {
	/**
	 * @hidden
	 */
	constructor() {
		super("tsvector");
	}
}
