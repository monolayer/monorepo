import { type Expression } from "kysely";
import { compileDefaultExpression } from "~/helpers/compile-default-expression.js";
import {
	IdentifiableColumn,
	isExpression,
	valueWithHash,
} from "~/schema/column/column.js";
import type { WithDefaultColumn } from "~/schema/column/types.js";

/**
 * Column that stores whole numbers.
 *
 * @remarks
 * Range: -2147483648 to +2147483647.
 * **Kysely database schema type definition**
 * ```ts
 * {
 *   readonly __select__: number | null;
 *   readonly __insert__: number | string | null | undefined;
 *   readonly __update__: number | string | null;
 * };
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * **Zod Schema**
 *
 * *Types:*
 * ```ts
 * {
 *   input?: number | string | null | undefined;
 *   output?: number | null | undefined;
 * }
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * *Validations:*
 * - Input value must be `number`, `string`, or `null`.
 * - Non-null values must be:
 *   - Coercible to `number`.
 *   - Greater or equal than -2147483648.
 *   - Less than 2147483647.
 * @example
 * ```ts
 * import { integer, schema, table } from "monolayer/pg";
 * import { zodSchema } from "monolayer/zod";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         id: integer(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * // Zod Schema
 * const schema = zodSchema(database.tables.example);
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT | integer }
 *
 * @group Schema Definition
 * @category Column Types
 */
export function integer() {
	return new PgInteger();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
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
