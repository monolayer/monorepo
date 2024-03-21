import { MaxLengthColumn } from "../column.js";

export function varbit(maximumLength?: number) {
	return new PgBitVarying(maximumLength);
}

export function bitVarying(maximumLength?: number) {
	return varbit(maximumLength);
}

export class PgBitVarying extends MaxLengthColumn<string, string> {
	/**
	 * @hidden
	 */
	constructor(maximumLength?: number) {
		super("varbit", maximumLength);
	}
}
