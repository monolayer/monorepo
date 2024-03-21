import { StringColumn } from "../column.js";

export function cidr() {
	return new PgCIDR();
}

export class PgCIDR extends StringColumn {
	/**
	 * @hidden
	 */
	constructor() {
		super("cidr");
	}
}
