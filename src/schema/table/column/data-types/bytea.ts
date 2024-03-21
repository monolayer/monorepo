import { PgColumn, valueWithHash } from "../column.js";

export function bytea() {
	return new PgBytea();
}

export class PgBytea extends PgColumn<Buffer, Buffer | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("bytea", "bytea");
	}

	/**
	 * @hidden
	 */
	protected transformDefault(value: string | Buffer) {
		const valueType = typeof value;
		switch (valueType) {
			case "string":
			case "boolean":
			case "number": {
				const hexVal = Buffer.from(String(value)).toString("hex");
				return valueWithHash(`'\\x${hexVal}'::${this._native_data_type}`);
			}
			case "object": {
				if (value instanceof Buffer) {
					const hexVal = value.toString("hex");
					return valueWithHash(`'\\x${hexVal}'::${this._native_data_type}`);
				}
				const hexVal = Buffer.from(JSON.stringify(value)).toString("hex");
				return valueWithHash(`'\\x${hexVal}'::${this._native_data_type}`);
			}
			default:
				return "::";
		}
	}
}
