import { IdentifiableColumn } from "../column.js";

/**
 * Column that store whole numbers.
 *
 * @remarks
 * Range: -9223372036854775808 to +9223372036854775807.
 *
 * *PostgreSQL native data type*: {@link https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT | bigint}
 *
 * **Kysely database schema type definition**
 * ```ts
 * {
 *   readonly __select__: string | null;
 *   readonly __insert__: bigint | number | string | null | undefined;
 *   readonly __update__: bigint | number | string | null;
 * };
 * ```
 * Column constraints, generated values, and default data values will be taken into account in the type inference.
 *
 * **Note**: Read the {@link PgDatabase.infer} function documentation for more information.
 *
 * **Zod Schema**
 *
 * - Input value is `bigint`, `number`, `string`, or `null`.
 * - Output value is `string` or `null`.
 * - Explicit `undefined` values are rejected.
 * - Value must be a valid `bigint`.
 * - Value cannot be lower than -9223372036854775808.
 * - Value cannot be greater than 9223372036854775807.
 * - Input and output values are optional by default. This depends on the column's:
 *   - Constraints.
 *   - Generated values.
 *   - Default data values.
 *
 * **Note**: Read the {@link zodSchema} function documentation for more information on how the validations and
 * type inference change based on the column constraints, generated values and default data values.
 *
 * @example
 * ```ts
 * import { bigint, pgDatabase, table } from "kysely-kinetic";
 * const database = pgDatabase({
 *   tables: {
 *     example: table({
 *       columns: {
 *         id: bigint(),
 *       },
 *     }),
 *   },
 * });
 * ```
 */
export function bigint() {
	return new PgBigInt();
}

export class PgBigInt extends IdentifiableColumn<
	string,
	number | bigint | string
> {
	/**
	 * @hidden
	 */
	constructor() {
		super("bigint", "bigint");
	}
}
