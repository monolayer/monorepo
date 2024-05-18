import type { Expression } from "kysely";
import { compileDefaultExpression } from "~/introspection/helpers.js";
import { PgColumn, valueWithHash } from "./column.js";
import type { WithDefaultColumn } from "./types.js";

export function genericColumn<S, I = S>(dataType: string) {
	return new PgGenericColumn<S, I>(dataType);
}

export class PgGenericColumn<S, I = S> extends PgColumn<S, I> {
	/**
	 * @hidden
	 */
	protected declare readonly __generic: S;
	/**
	 * @hidden
	 */
	constructor(dataType: string) {
		super(dataType, dataType);
	}

	default(value: Expression<unknown>) {
		this.info.defaultValue = valueWithHash(compileDefaultExpression(value));
		this.info.volatileDefault = "unknown";
		return this as this & WithDefaultColumn;
	}
}
