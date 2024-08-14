/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Expression } from "kysely";
import { PgRawConstraint } from "~pg/schema/raw-constraint.js";

/**
 * @group Schema Definition
 * @category Indexes and Constraints
 */
export function check(expression: Expression<any>) {
	return new PgCheck(expression);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgCheck {
	/**
	 * @hidden
	 */
	protected expression: Expression<any>;
	/**
	 * @hidden
	 */
	protected isExternal: boolean;

	constructor(expression: Expression<any>) {
		this.expression = expression;
		this.isExternal = false;
	}

	external() {
		this.isExternal = true;
		return this;
	}
}

export function assertCheckWithInfo<T extends PgCheck>(
	val: T,
): asserts val is T & {
	expression: string;
	hash: string;
	name: string;
	isExternal: boolean;
} {}

/**
 * @group Schema Definition
 * @category Unmanaged
 */
export function unmanagedCheck(name: string, expression: Expression<any>) {
	return new PgUnmanagedCheck(name, expression);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgUnmanagedCheck extends PgRawConstraint {}
