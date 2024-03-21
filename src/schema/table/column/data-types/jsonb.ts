import { PgColumn } from "../column.js";
import { JsonValue } from "../types.js";

export function jsonb() {
	return new PgJsonB();
}

export class PgJsonB extends PgColumn<JsonValue, string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("jsonb", "jsonb");
	}
}
