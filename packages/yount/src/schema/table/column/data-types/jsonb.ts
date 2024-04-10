import { PgColumn } from "../column.js";
import { JsonValue } from "../types.js";

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
 * **Zod Schema**
 *
 * *Types:*
 * ```ts
 * // type JsonArray = JsonValue[];
 * // type JsonValue = boolean | number | string | Record<string, any> | JsonArray;
 * {
 *   input?: JsonValue | null | undefined;
 *   output?: JsonValue | null | undefined;
 * }
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * *Validations:*
 * - Explicit `undefined` values are rejected.
 * - Input values must be `JsonValue` or `null`.
 * - String values must be valid JSON.
 * - Record values must be convertible to a JSON string.
 * @example
 * ```ts
 * import { json, schema, table } from "yount";
 * import { zodSchema } from "yount/zod";
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
 * // Zod Schema
 * const schema = zodSchema(database.tables.example);
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-json.html#DATATYPE-JSON | jsonb}
 */
export function jsonb() {
	return new PgJsonB();
}

export class PgJsonB extends PgColumn<JsonValue, JsonValue> {
	/**
	 * @hidden
	 */
	constructor() {
		super("jsonb", "jsonb");
	}
}
