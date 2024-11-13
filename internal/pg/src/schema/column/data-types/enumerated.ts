import { StringColumn } from "~pg/schema/column/column.js";
import type { EnumType } from "~pg/schema/column/data-types/enum.js";

/**
 * Column that stores a static, ordered set of values.
 * @param enumType - enumType
 * @remarks
 * **Kysely database schema type definition**
 * ```ts
 * const role = enumType("role", ["admin", "user"]);
 * const roleColumn = enumerated(role);
 * type RoleColumn = {
 *   readonly __select__: "admin" | "user" | null;
 *   readonly __insert__: "admin" | "user" | null | undefined;
 *   readonly __update__: "admin" | "user" | null;
 * };
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * @example
 * ```ts
 * import { enumerated, enumType, schema, table } from "@monolayer/pg/schema";
 *
 * const role = enumType("role", ["admin", "user"]);
 * const dbSchema = schema({
 *   types: [role],
 *   tables: {
 *     example: table({
 *       columns: {
 *         role: enumerated(role),
 *       },
 *     }),
 *   },
 * });
 *
 * // Kysely database schema type
 * type DB = typeof dbSchema.infer;
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-enum.html#DATATYPE-ENUM | enumerated types }
 *
 * @group Schema Definition
 * @category Column Types
 */
export function enumerated<Value extends string>(enumerated: EnumType<Value>) {
	return new PgEnum(enumerated);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class PgEnum<Value extends string> extends StringColumn<Value, Value> {
	/**
	 * @hidden
	 */
	protected readonly values: Value[];
	/**
	 * @hidden
	 */
	constructor(enumerated: EnumType<Value>) {
		super(enumerated.name);
		this.info.enum = true;
		this.values = enumerated.values;
	}
}
