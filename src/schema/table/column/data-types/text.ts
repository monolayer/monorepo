import { PgColumn } from "../column.js";

export function text() {
	return new PgText();
}

export class PgText extends PgColumn<string, string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("text", "text");
	}
}
