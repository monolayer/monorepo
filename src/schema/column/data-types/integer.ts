import { type Expression } from "kysely";
import { compileDefaultExpression } from "~/introspection/schemas.js";
import { IdentifiableColumn, isExpression, valueWithHash } from "../column.js";
import { WithDefaultColumn } from "../types.js";

export function integer() {
	return new PgInteger();
}

export class PgInteger extends IdentifiableColumn<number, number | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("integer", "integer");
	}

	default(value: number | string | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = valueWithHash(compileDefaultExpression(value));
		} else {
			this.info.defaultValue = valueWithHash(`${value}`);
		}
		return this as this & WithDefaultColumn;
	}

	/**
	 * @hidden
	 */
	protected transformDefault(value: string | number) {
		return valueWithHash(`${value}`);
	}
}
