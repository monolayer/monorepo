/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Expression } from "kysely";
import { PgRawConstraint } from "../raw-constraint.js";

export function check(expression: Expression<any>) {
	return new PgCheck(expression);
}

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
} {
	true;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function unmanagedCheck(name: string, expression: Expression<any>) {
	return new PgUnmanagedCheck(name, expression);
}

export class PgUnmanagedCheck extends PgRawConstraint {}
