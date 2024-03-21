import { PgColumn, valueWithHash } from "../column.js";

export function boolean() {
	return new PgBoolean();
}

export type Boolish =
	| "true"
	| "false"
	| "yes"
	| "no"
	| 1
	| 0
	| "1"
	| "0"
	| "on"
	| "off";

export class PgBoolean extends PgColumn<boolean, boolean | Boolish> {
	/**
	 * @hidden
	 */
	constructor() {
		super("boolean", "boolean");
	}

	/**
	 * @hidden
	 */
	protected transformDefault(value: boolean | Boolish) {
		return valueWithHash(`${value}`);
	}
}
