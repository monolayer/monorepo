import { PgColumn } from "../column.js";
import { JsonValue } from "../types.js";

export function json() {
	return new PgJson();
}

export class PgJson extends PgColumn<JsonValue, JsonValue> {
	/**
	 * @hidden
	 */
	constructor() {
		super("json", "json");
	}
}
