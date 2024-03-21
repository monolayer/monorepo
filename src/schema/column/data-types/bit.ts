import { MaxLengthColumn } from "../column.js";

export function bit(fixedLength?: number) {
	return new PgBit(fixedLength);
}

export class PgBit extends MaxLengthColumn<string, string> {
	/**
	 * @hidden
	 */
	constructor(fixedLength?: number) {
		super("bit", fixedLength ?? 1);
	}
}
