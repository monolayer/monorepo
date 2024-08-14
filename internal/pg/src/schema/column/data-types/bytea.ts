import { PgColumn, valueWithHash } from "~pg/schema/column/column.js";

/**
 * Column that stores binary strings.
 * @remarks
 * **Kysely database schema type definition**
 * ```ts
 * {
 *   readonly __select__: Buffer | null;
 *   readonly __insert__: Buffer | string | null | undefined;
 *   readonly __update__: Buffer | string | null;
 * };
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * **Zod Schema**
 *
 * *Types:*
 * ```ts
 * {
 *   input?: Buffer | string | null | undefined;
 *   output?: Buffer | string | null | undefined;
 * }
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * *Validations:*
 * - Explicit `undefined` values are rejected.
 * - Value must be a `Buffer`, `string`, or `null`.
 *
 * *Note*: Since {@link https://nodejs.org/api/buffer.html | Buffer } is a Node.js API, the schema will not coerce the input to Buffer for browser compatibility.
 * @example
 * ```ts
 * import { schema, table, bytea } from "monolayer/pg";
 * import { zodSchema } from "monolayer/zod";
 *
 * const dbSchema = schema({
 *   tables: {
 *     example: table({
 *       columns: {
 *         image: bytea(),
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
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-binary.html#DATATYPE-BINARY | bytea}
 *
 * @group Schema Definition
 * @category Column Types
 */
export function bytea() {
	return new PgBytea();
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgBytea extends PgColumn<Buffer, Buffer | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("bytea", "bytea");
	}

	/**
	 * @hidden
	 */
	protected transformDefault(value: string | Buffer) {
		const valueType = typeof value;
		switch (valueType) {
			case "string":
			case "boolean":
			case "number": {
				const hexVal = Buffer.from(String(value)).toString("hex");
				return valueWithHash(`'\\x${hexVal}'::${this._native_data_type}`);
			}
			case "object": {
				if (value instanceof Buffer) {
					const hexVal = value.toString("hex");
					return valueWithHash(`'\\x${hexVal}'::${this._native_data_type}`);
				}
				const hexVal = Buffer.from(JSON.stringify(value)).toString("hex");
				return valueWithHash(`'\\x${hexVal}'::${this._native_data_type}`);
			}
			default:
				return "::";
		}
	}
}
