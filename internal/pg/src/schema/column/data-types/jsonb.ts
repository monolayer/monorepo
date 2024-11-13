import type { Expression } from "kysely";
import { compileDefaultExpression } from "~pg/helpers/compile-default-expression.js";
import {
	isExpression,
	PgColumn,
	valueWithHash,
} from "~pg/schema/column/column.js";
import type { JsonValue, WithDefaultColumn } from "~pg/schema/column/types.js";

/**
 * Column that stores JSON data.
 *
 * @remarks
 * Data is stored in a decomposed binary format. Slower to input than a `json` column, but significantly faster to process.
 *
 * Supports indexing.
 *
 * **Kysely database schema type definition**
 * ```ts
 * type JsonArray = JsonValue[];
 * type JsonValue = boolean | number | string | Record<string, any> | JsonArray;
 * {
 *   readonly __select__: JsonValue | null;
 *   readonly __insert__: JsonValue | null | undefined;
 *   readonly __update__: JsonValue | null;
 * };
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * You can customize the data type of the column by providing a type argument to the `json` function.
 *
 * **Warning**: the Zod schema for a `json` column only validates that data can be conforms to the `JsonValue` type.
 * When using a custom data type you shoud adapt it. See examples.
 *
 * @example
 *
 * *Default Data Type*
 * ```ts
 * import { json, schema, table } from "@monolayer/pg/schema";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         document: json(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 *
 * *Custom Data Example*
 * ```ts
 * import { jsonb, schema, table } from "@monolayer/pg/schema";
 *
 * type Data = { count: number; name: string  };
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         info: jsonb<Data>(),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 *
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-json.html#DATATYPE-JSON | jsonb}
 *
 * @group Schema Definition
 * @category Column Types
 */
export function jsonb<T extends JsonValue = JsonValue>() {
	return new PgJsonB<T, T>();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgJsonB<S extends JsonValue = JsonValue, I = S> extends PgColumn<
	S,
	I
> {
	/**
	 * @hidden
	 */
	protected declare readonly __select__: S;
	/**
	 * @hidden
	 */
	protected declare readonly __insert__: S;

	/**
	 * @hidden
	 */
	constructor() {
		super("jsonb", "jsonb");
	}

	default(value: I | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = valueWithHash(compileDefaultExpression(value));
			this.info.volatileDefault = "yes";
		} else {
			if (typeof value === "string") {
				this.info.defaultValue = this.transformDefault(value);
			} else {
				this.info.defaultValue = this.transformDefault(
					JSON.stringify(value) as I,
				);
			}
			this.info.volatileDefault = "no";
		}
		return this as this & WithDefaultColumn;
	}
}
