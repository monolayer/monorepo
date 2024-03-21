import { PgColumn } from "../column.js";
import { JsonValue } from "../types.js";

export function jsonb() {
	return new PgJsonB();
}

export class PgJsonB extends PgColumn<JsonValue, JsonValue> {
	/**
	 * @hidden
	 */
	constructor() {
		super("jsonb", "jsonb");
	}
}
