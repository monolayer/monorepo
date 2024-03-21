import { PgColumn, valueWithHash } from "../column.js";

export function uuid() {
	return new PgUuid();
}

export class PgUuid extends PgColumn<string, string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("uuid", "uuid");
	}

	/**
	 * @hidden
	 */
	protected transformDefault(value: string) {
		return valueWithHash(`'${value.toLowerCase()}'::uuid`);
	}
}
