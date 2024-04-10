import { EnumType } from "~/schema/types/enum/enum.js";
import { StringColumn } from "../column.js";

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
 * **Zod Schema**
 *
 * *Types:*
 * ```ts
 * // enumType("role", ["admin", "user"]);
 * {
 *   input?: "admin" | "user" | null | undefined;
 *   output?: "admin" | "user" | null | undefined;
 * }
 * ```
 * Nullability and optionality will change according to the column's constraints, generated values, and default data values.
 *
 * *Validations:*
 * - Explicit `undefined` values are rejected.
 * - Input values must be an enum value, or `null`.
 * @example
 * ```ts
 * import { enumerated, enumType, schema, table } from "yount";
 * import { zodSchema } from "yount/zod";
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
 * // Zod Schema
 * const schema = zodSchema(database.tables.example);
 * ```
 * @see
 * *PostgreSQL Docs*: {@link https://www.postgresql.org/docs/current/datatype-enum.html#DATATYPE-ENUM | enumerated types }
 */
export function enumerated<Value extends string>(enumerated: EnumType<Value>) {
	return new PgEnum(enumerated.name, enumerated.values);
}

export class PgEnum<Value extends string> extends StringColumn<Value, Value> {
	/**
	 * @hidden
	 */
	protected readonly values: Value[];
	/**
	 * @hidden
	 */
	constructor(name: string, values: Value[]) {
		super(name);
		this.info.enum = true;
		this.values = values;
	}
}
