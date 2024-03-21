import { PgColumn } from "../column.js";

export function doublePrecision() {
	return new PgDoublePrecision();
}

export class PgDoublePrecision extends PgColumn<
	string,
	number | bigint | string
> {
	/**
	 * @hidden
	 */
	constructor() {
		super("double precision", "double precision");
	}
}
