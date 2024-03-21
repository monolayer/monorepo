import { IdentifiableColumn } from "../column.js";

export function smallint() {
	return new PgSmallint();
}

export class PgSmallint extends IdentifiableColumn<number, number | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("smallint", "smallint");
	}
}
