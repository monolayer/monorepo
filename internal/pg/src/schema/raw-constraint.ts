import type { Expression } from "kysely";

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgRawConstraint {
	constructor(
		public name: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		protected expression: Expression<any>,
	) {}
}
