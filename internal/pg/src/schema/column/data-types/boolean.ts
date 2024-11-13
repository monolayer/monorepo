import { PgColumn, valueWithHash } from "../column.js";

/**
 * Column that stores booleans.
 * @remarks
 * Can have several states: "true", "false", or "unknown" (represented by null).
 *
 * **Kysely database schema type definition**
 * ```ts
 * type Boolish = "true" | "false" | "yes" | "no" | 1 | 0 | "1" | "0" | "on" | "off";
 * {
 *   readonly __select__: boolean | null;
 *   readonly __insert__: boolean | Boolish | null | undefined;
 *   readonly __update__: boolean | Boolish | null;
 * };
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * @example
 * ```ts
 * import { boolean, schema, table } from "@monolayer/pg/schema";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         active: boolean(),
 *       },
 *     }),
 *   },
 * });
 * ```
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * @see
 * *PostgreSQL native data type*: {@link https://www.postgresql.org/docs/current/datatype-boolean.html#DATATYPE-BOOLEAN | boolean }
 *
 * @group Schema Definition
 * @category Column Types
 */
export function boolean() {
	return new PgBoolean();
}

export type Boolish =
	| "true"
	| "false"
	| "yes"
	| "no"
	| 1
	| 0
	| "1"
	| "0"
	| "on"
	| "off";

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgBoolean extends PgColumn<boolean, boolean | Boolish> {
	/**
	 * @hidden
	 */
	constructor() {
		super("boolean", "boolean");
	}

	/**
	 * @hidden
	 */
	protected transformDefault(value: boolean | Boolish) {
		return valueWithHash(`${value}`);
	}
}
