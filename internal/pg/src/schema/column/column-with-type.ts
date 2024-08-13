import type { Expression } from "kysely";
import { compileDefaultExpression } from "~/helpers/compile-default-expression.js";
import { PgColumn, valueWithHash } from "~/schema/column/column.js";
import type { WithDefaultColumn } from "~/schema/column/types.js";

/**
 * @group Schema Definition
 * @category Column Types
 */
export function columnWithType<S, I = S>(dataType: string) {
	return new pgColumnWithType<S, I>(dataType);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class pgColumnWithType<S, I = S> extends PgColumn<S, I> {
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
