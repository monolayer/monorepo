import type { PgExtension } from "../extension/extension.js";
import type { AnyPgTable } from "./table/table.js";
import type { EnumType } from "./types/enum/enum.js";

export type DatabaseSchema<T extends ColumnRecord, S extends string> = {
	name?: S;
	tables?: T;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	types?: Array<EnumType<any>>;
};

export class Schema<T extends ColumnRecord, S extends string> {
	/**
	 * @hidden
	 */
	static info(schema: AnySchema) {
		return {
			tables: schema.tables ?? {},
			types: schema.types || [],
			name: schema.name,
		};
	}

	/**
	 * Infers types to be used as the Kysely database schema type definition.
	 * @public
	 * @remarks
	 *
	 * Infers types for select, insert and update operations, taking into account the
	 * column data type, constraints, generated values, and default data values.
	 *
	 * **Typescript Types**
	 *
	 * Each column has a Typescript type for its select, insert, and update operations:
	 * | Column                | Select       | Insert                                                          | Update|
	 * | :---                  | :----:       | :----:                                                          | :----:|
	 * | bigint                | `string`     | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;|
	 * | bigserial             | `string`     | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;|
	 * | bit                   | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | bitVarying            | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | boolean               | `boolean`    | &#160;&#160;`boolean` &#124; `Boolish`*&#160;&#160;             | &#160;&#160;`boolean` &#124; `Boolish`*&#160;&#160;|
	 * | bytea                 | `Buffer`     | &#160;&#160;`Buffer` &#124; `string`&#160;&#160;                | &#160;&#160;`Buffer` &#124; `string`&#160;&#160;|
	 * | characterVarying      | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | character             | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | cidr                  | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | date                  | `Date`       | &#160;&#160;`Date` &#124; `string`&#160;&#160;                  | &#160;&#160;`Date` &#124; `string`&#160;&#160;|
	 * | doublePrecision       | `string`     | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;|
	 * | enumerated            | enum values  | &#160;&#160;enum values&#160;&#160;                             | &#160;&#160;enum values&#160;&#160;|
	 * | inet                  | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | integer               | `number`     | &#160;&#160;`number` &#124; `string`&#160;&#160;                | &#160;&#160;`number` &#124; `string`&#160;&#160;|
	 * | json                  | `JsonValue`* | &#160;&#160;`JsonValue`*&#160;&#160;                            | &#160;&#160;`JsonValue`*&#160;&#160;|
	 * | jsonb                 | `JsonValue`* | &#160;&#160;`JsonValue`*&#160;&#160;                            | &#160;&#160;`JsonValue`*&#160;&#160;|
	 * | macaddr               | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | macaddr8              | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | numeric               | `string`     | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;|
	 * | real                  | `number`     | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;|
	 * | serial                | `number`     | &#160;&#160;`number` &#124; `string`&#160;&#160;                | &#160;&#160;`number` &#124; `string`&#160;&#160;|
	 * | smallint              | `number`     | &#160;&#160;`number` &#124; `string`&#160;&#160;                | &#160;&#160;`number` &#124; `string`&#160;&#160;|
	 * | time                  | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | timeWithTimeZone      | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | timestamp             | `Date`       | &#160;&#160;`Date` &#124; `string`&#160;&#160;                  | &#160;&#160;`Date` &#124; `string`&#160;&#160;|
	 * | timestampWithTimeZone | `Date`       | &#160;&#160;`Date` &#124; `string`&#160;&#160;                  | &#160;&#160;`Date` &#124; `string`&#160;&#160;|
	 * | tsquery               | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | tsvector              | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | uuid                  | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | xml                   | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 *
	 * (*) `Boolish` and `JsonValue` are defined as follows:
	 * ```ts
	 * type Boolish = "true" | "false" | "yes" | "no" | 1 | 0 | "1" | "0" | "on" | "off";
	 * type JsonArray = JsonValue[];
	 * type JsonValue = boolean | number | string | Record<string, unknown> | JsonArray;
	 * ```
	 *
	 * **Optionality and nullability**
	 *
	 * By default, columns have:
	 * - Nullable selects, inserts and updated.
	 * - Optional inserts and updates.
	 *
	 * *Type of an `integer` named id*
	 * ```ts
	 * type id = {
	 *   readonly __select__: number | null;
	 *   readonly __insert__: number | string | null | undefined;
	 *   readonly __update__: number | string | null;
	 * };
	 * ```
	 * Columns that are generated always as identity will not accept inserts or updates:
	 *
	 * *Type of an `integer` column with generated always as identity named id*
	 * ```ts
	 * type id = {
	 *   readonly __select__: number;
	 *   readonly __insert__: never;
	 *   readonly __update__: never;
	 * };
	 * ```
	 *
	 * Columns that either:
	 * - have a primary key constraint
	 * - have a `NOT NULL` constraint
	 * - have a default data value
	 * - are generated (`serial`, `bigserial`, or generated by default as identity)
	 *
	 * will have their optionality and nullability changed according to this table:
	 * |             Column type              | &#160;&#160;Optional&#160;&#160;| &#160;&#160;Nullable&#160;&#160;|
	 * | :---                                 | :----:      | :----:     |
	 * | `NOT NULL` constraint                | no          | never      |
	 * | primary key constraint               | no          | never      |
	 * | with default data value              | always      | yes        |
	 * | `serial`                             | always      | never      |
	 * | `bigserial`                          | always      | never      |
	 * | generated by default as identity     | always      | never      |
	 *
	 * *Type of an `integer` column with a `NOT NULL` constraint named id*
	 * ```ts
	 * type id = {
	 *   readonly __select__: number;
	 *   readonly __insert__: number | string;
	 *   readonly __update__: number | string;
	 * };
	 * ```
	 * *Type of an `integer` column with a default data value and a `NOT NULL` constraint named id*
	 * ```ts
	 * type id = {
	 *   readonly __select__: number;
	 *   readonly __insert__: number | string | undefined;
	 *   readonly __update__: number | string;
	 * };
	 * ```
	 * *Type of an `bigint` column generated by default as identity*
	 * ```ts
	 * type id = {
	 *   readonly __select__: string;
	 *   readonly __insert__: bigint | number | string | undefined;
	 *   readonly __update__: bigint | number | string;
	 * };
	 * ```
	 * @example
	 * ```ts
	 * const userRole = enumType("user_role", ["admin", "user"]);
	 * const dbSchema = schema({
	 *   types: [userRole],
	 *   tables: {
	 *     users: table({
	 *       columns: {
	 *         id: integer().generatedAlwaysAsIdentity(),
	 *         name: text(),
	 *         role: enumerated(userRole).notNull(),
	 *         createdAt: timestampWithTimeZone().default(sql`now`).notNull(),
	 *       },
	 *       constraints: {
	 *         primaryKey: primaryKey(["id"]),
	 *       },
	 *     }),
	 *   }
	 * });
	 *
	 * type DB = typeof dbSchema.infer;
	 * ```
	 *
	 * The `DB` type will be:
	 *
	 * ```ts
	 * type DB = {
	 *   users: {
	 *     id: {
	 *       readonly __select__: number;
	 *       readonly __insert__: never;
	 *       readonly __update__: never;
	 *     };
	 *     name: {
	 *       readonly __select__: string;
	 *       readonly __insert__: string | null | undefined;
	 *       readonly __update__: string | null;
	 *     },
	 *     role: {
	 *       readonly __select__: "admin" | "user";
	 *       readonly __insert__: "admin" | "user";
	 *       readonly __update__: "admin" | "user";
	 *     },
	 *     createdAt: {
	 *       readonly __select__: Date;
	 *       readonly __insert__: Date | undefined;
	 *       readonly __update__: Date;
	 *     },
	 *   };
	 * };
	 * ```
	 */
	declare infer: TableInfer<T>;

	/**
	 * Infers types with a schema namespace to be used as the Kysely database schema type definition.
	 * @public
	 * @remarks
	 *
	 * Infers types for select, insert and update operations, taking into account the
	 * database schema, column data type, constraints, generated values, and default data values.
	 *
	 * **Typescript Types**
	 *
	 * Each column has a Typescript type for its select, insert, and update operations:
	 * | Column                | Select       | Insert                                                          | Update|
	 * | :---                  | :----:       | :----:                                                          | :----:|
	 * | bigint                | `string`     | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;|
	 * | bigserial             | `string`     | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;|
	 * | bit                   | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | bitVarying            | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | boolean               | `boolean`    | &#160;&#160;`boolean` &#124; `Boolish`*&#160;&#160;             | &#160;&#160;`boolean` &#124; `Boolish`*&#160;&#160;|
	 * | bytea                 | `Buffer`     | &#160;&#160;`Buffer` &#124; `string`&#160;&#160;                | &#160;&#160;`Buffer` &#124; `string`&#160;&#160;|
	 * | characterVarying      | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | character             | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | cidr                  | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | date                  | `Date`       | &#160;&#160;`Date` &#124; `string`&#160;&#160;                  | &#160;&#160;`Date` &#124; `string`&#160;&#160;|
	 * | doublePrecision       | `string`     | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;|
	 * | enumerated            | enum values  | &#160;&#160;enum values&#160;&#160;                             | &#160;&#160;enum values&#160;&#160;|
	 * | inet                  | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | integer               | `number`     | &#160;&#160;`number` &#124; `string`&#160;&#160;                | &#160;&#160;`number` &#124; `string`&#160;&#160;|
	 * | json                  | `JsonValue`* | &#160;&#160;`JsonValue`*&#160;&#160;                            | &#160;&#160;`JsonValue`*&#160;&#160;|
	 * | jsonb                 | `JsonValue`* | &#160;&#160;`JsonValue`*&#160;&#160;                            | &#160;&#160;`JsonValue`*&#160;&#160;|
	 * | macaddr               | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | macaddr8              | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | numeric               | `string`     | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;|
	 * | real                  | `number`     | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;|
	 * | serial                | `number`     | &#160;&#160;`number` &#124; `string`&#160;&#160;                | &#160;&#160;`number` &#124; `string`&#160;&#160;|
	 * | smallint              | `number`     | &#160;&#160;`number` &#124; `string`&#160;&#160;                | &#160;&#160;`number` &#124; `string`&#160;&#160;|
	 * | time                  | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | timeWithTimeZone      | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | timestamp             | `Date`       | &#160;&#160;`Date` &#124; `string`&#160;&#160;                  | &#160;&#160;`Date` &#124; `string`&#160;&#160;|
	 * | timestampWithTimeZone | `Date`       | &#160;&#160;`Date` &#124; `string`&#160;&#160;                  | &#160;&#160;`Date` &#124; `string`&#160;&#160;|
	 * | tsquery               | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | tsvector              | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | uuid                  | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 * | xml                   | `string`     | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
	 *
	 * (*) `Boolish` and `JsonValue` are defined as follows:
	 * ```ts
	 * type Boolish = "true" | "false" | "yes" | "no" | 1 | 0 | "1" | "0" | "on" | "off";
	 * type JsonArray = JsonValue[];
	 * type JsonValue = boolean | number | string | Record<string, unknown> | JsonArray;
	 * ```
	 *
	 * **Optionality and nullability**
	 *
	 * By default, columns have:
	 * - Nullable selects, inserts and updated.
	 * - Optional inserts and updates.
	 *
	 * *Type of an `integer` named id*
	 * ```ts
	 * type id = {
	 *   readonly __select__: number | null;
	 *   readonly __insert__: number | string | null | undefined;
	 *   readonly __update__: number | string | null;
	 * };
	 * ```
	 * Columns that are generated always as identity will not accept inserts or updates:
	 *
	 * *Type of an `integer` column with generated always as identity named id*
	 * ```ts
	 * type id = {
	 *   readonly __select__: number;
	 *   readonly __insert__: never;
	 *   readonly __update__: never;
	 * };
	 * ```
	 *
	 * Columns that either:
	 * - have a primary key constraint
	 * - have a `NOT NULL` constraint
	 * - have a default data value
	 * - are generated (`serial`, `bigserial`, or generated by default as identity)
	 *
	 * will have their optionality and nullability changed according to this table:
	 * |             Column type              | &#160;&#160;Optional&#160;&#160;| &#160;&#160;Nullable&#160;&#160;|
	 * | :---                                 | :----:      | :----:     |
	 * | `NOT NULL` constraint                | no          | never      |
	 * | primary key constraint               | no          | never      |
	 * | with default data value              | always      | yes        |
	 * | `serial`                             | always      | never      |
	 * | `bigserial`                          | always      | never      |
	 * | generated by default as identity     | always      | never      |
	 *
	 * *Type of an `integer` column with a `NOT NULL` constraint named id*
	 * ```ts
	 * type id = {
	 *   readonly __select__: number;
	 *   readonly __insert__: number | string;
	 *   readonly __update__: number | string;
	 * };
	 * ```
	 * *Type of an `integer` column with a default data value and a `NOT NULL` constraint named id*
	 * ```ts
	 * type id = {
	 *   readonly __select__: number;
	 *   readonly __insert__: number | string | undefined;
	 *   readonly __update__: number | string;
	 * };
	 * ```
	 * *Type of an `bigint` column generated by default as identity*
	 * ```ts
	 * type id = {
	 *   readonly __select__: string;
	 *   readonly __insert__: bigint | number | string | undefined;
	 *   readonly __update__: bigint | number | string;
	 * };
	 * ```
	 * @example
	 * ```ts
	 * const userRole = enumType("user_role", ["admin", "user"]);
	 * const dbSchema = schema({
	 *   schema: "accounts"
	 *   types: [userRole],
	 *   tables: {
	 *     users: table({
	 *       columns: {
	 *         id: integer().generatedAlwaysAsIdentity(),
	 *         name: text(),
	 *         role: enumerated(userRole).notNull(),
	 *         createdAt: timestampWithTimeZone().default(sql`now`).notNull(),
	 *       },
	 *       constraints: {
	 *         primaryKey: primaryKey(["id"]),
	 *       },
	 *     }),
	 *   }
	 * });
	 *
	 * type DB = typeof dbSchema.infer;
	 * ```
	 *
	 * The `DB` type will be:
	 *
	 * ```ts
	 * type DB = {
	 *   "accounts.users": {
	 *     id: {
	 *       readonly __select__: number;
	 *       readonly __insert__: never;
	 *       readonly __update__: never;
	 *     };
	 *     name: {
	 *       readonly __select__: string;
	 *       readonly __insert__: string | null | undefined;
	 *       readonly __update__: string | null;
	 *     },
	 *     role: {
	 *       readonly __select__: "admin" | "user";
	 *       readonly __insert__: "admin" | "user";
	 *       readonly __update__: "admin" | "user";
	 *     },
	 *     createdAt: {
	 *       readonly __select__: Date;
	 *       readonly __insert__: Date | undefined;
	 *       readonly __update__: Date;
	 *     },
	 *   };
	 * };
	 * ```
	 */
	declare inferWithSchemaNamespace: TableInferWithSchema<T, S>;

	/**
	 * @hidden
	 */
	protected name?: S;

	/**
	 * @hidden
	 */
	protected extensions?: Array<PgExtension>;

	public tables: T;

	/**
	 * @hidden
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected types?: Array<EnumType<any>>;

	/**
	 * @hidden
	 */
	constructor(schema: DatabaseSchema<T, S>) {
		this.tables = schema.tables || ({} as T);
		this.types = schema.types;
		this.name = schema.name;
	}
}

type TableInfer<T extends ColumnRecord> = string extends keyof T
	? // eslint-disable-next-line @typescript-eslint/no-explicit-any
		any
	: {
			[K in keyof T]: T[K]["infer"];
		};

type TableInferWithSchema<
	T extends ColumnRecord,
	S extends string | undefined,
> = string extends keyof T
	? // eslint-disable-next-line @typescript-eslint/no-explicit-any
		any
	: {
			[K in keyof T as K extends string
				? undefined extends S
					? `public.${K}`
					: `${S}.${K}`
				: never]: T[K]["infer"];
		};

export function schema<T extends ColumnRecord, S extends string = "public">(
	schema: DatabaseSchema<T, S>,
) {
	return new Schema<T, S>(schema);
}

export type ColumnRecord = Record<string, AnyPgTable>;
export type AnySchema = Schema<Record<string, AnyPgTable>, string>;
