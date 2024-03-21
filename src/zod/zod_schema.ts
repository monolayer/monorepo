import { z } from "zod";
import { tableInfo } from "~/introspection/helpers.js";
import type { PgColumn, SerialColumn } from "~/schema/column/column.js";
import type { ZodSchemaObject, ZodType } from "~/schema/inference.js";
import { type ColumnRecord } from "~/schema/table/table-column.js";
import { type PgTable } from "../schema/table/table.js";
import {
	bitSchema,
	isBitColumn,
	isVarbitColumn,
	varbitSchema,
} from "./column-schemas/bit-string.js";
import { isPgBoolean, pgBooleanSchema } from "./column-schemas/boolean.js";
import { isBytea, pgByteaSchema } from "./column-schemas/bytea.js";
import {
	isChar,
	isPgText,
	isVarchar,
	pgCharSchema,
	pgTextSchema,
	pgVarcharSchema,
} from "./column-schemas/character.js";
import {
	isDate,
	isTime,
	isTimeTz,
	isTimestamp,
	isTimestampTz,
	pgDateSchema,
	pgTimeSchema,
	pgTimeTzSchema,
	pgTimestampSchema,
	pgTimestampTzSchema,
} from "./column-schemas/date-time.js";
import { isEnum, pgEnumSchema } from "./column-schemas/enum.js";
import { isBigserial, isSerial } from "./column-schemas/generated.js";
import {
	isJson,
	isJsonB,
	pgJsonSchema,
	pgJsonbSchema,
} from "./column-schemas/json.js";
import {
	cidrSchema,
	inetSchema,
	isCidrColumn,
	isInetColumn,
	isMacaddr8Column,
	isMacaddrColumn,
	macaddr8Schema,
	macaddrSchema,
} from "./column-schemas/network-address.js";
import {
	isBigInt,
	isDoublePrecision,
	isInteger,
	isNumeric,
	isReal,
	isSmallint,
	pgBigintSchema,
	pgDoublePrecisionSchema,
	pgIntegerSchema,
	pgNumericSchema,
	pgRealSchema,
	pgSmallintSchema,
} from "./column-schemas/numeric.js";
import {
	isTsQueryColumn,
	isTsvectorColumn,
	tsquerySchema,
	tsvectorSchema,
} from "./column-schemas/text-search.js";
import { isUuid, pgUuidSchema } from "./column-schemas/uuid.js";
import { isXMLColumn, xmlSchema } from "./column-schemas/xml.js";

/**
 * Return a Zod schema for the table.
 * @public
 * @remarks
 *
 * The schema will be for all columns defined in the table.
 * You can use `extend`, `pick`, `omit`, or `shape` to adapt/expand the schema.
 *
 * **Schema validations for all columns**
 * - Input and output values are optional by default.
 * - Input and output types will be automatically inferred.
 * - Explicit `undefined` values will result in an error.
 * - Each column type has extended validation rules to allow only accepted values for the column type.
 * Refer to each columm documentation for a description on the specific validation rules.
 * For example, the schema for an `integer` column:
 *   - Will not allow values lower than -2147483648.
 *   - Will not allow values greater that 2147483647.
 * - The schema will take into account account constraints, generated values and default data values.
 * For example, a non-nullable, primary key column:
 *   - Can't be null.
 *   - Input value and output values are required.
 *
 * **Schema Types**
 *
 * Each column has a Typescript type for input and output values (parsed) in the schema.
 * The output values match the select type for the column(except `bytea` columns *)
 *
 *
 * (*) Since {@link https://nodejs.org/api/buffer.html | Buffer } is a Node.js API, the schema will not coerce the input to Buffer for browser compatibility.
 * The output type will be the same as the input type.
 *
 * | Column                | Input                                                           | Output|
 * | :---                  | :----:                                                          | :----:|
 * | bigint                | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`string` &#160;&#160;|
 * | bigserial             | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`string`&#160;&#160;|
 * | bit                   | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
 * | bitVarying            | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
 * | boolean               | &#160;&#160;`boolean` &#124; `Boolish`*&#160;&#160;             | &#160;&#160;`boolean`&#160;&#160;|
 * | bytea                 | &#160;&#160;`Buffer` &#124; `string`&#160;&#160;                | &#160;&#160;`Buffer` &#124; `string`&#160;&#160;|
 * | characterVarying      | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
 * | character             | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
 * | cidr                  | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
 * | date                  | &#160;&#160;`Date` &#124; `string`&#160;&#160;                  | &#160;&#160;`Date`&#160;&#160;|
 * | doublePrecision       | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`string`&#160;&#160;|
 * | enumerated            | &#160;&#160;enum values&#160;&#160;                             | &#160;&#160;enum values&#160;&#160;|
 * | inet                  | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
 * | integer               | &#160;&#160;`number` &#124; `string`&#160;&#160;                | &#160;&#160;`number`&#160;&#160;|
 * | json                  | &#160;&#160;`JsonValue`*&#160;&#160;                            | &#160;&#160;`JsonValue`*&#160;&#160;|
 * | jsonb                 | &#160;&#160;`JsonValue`*&#160;&#160;                            | &#160;&#160;`JsonValue`*&#160;&#160;|
 * | macaddr               | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
 * | macaddr8              | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
 * | numeric               | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`number`&#160;&#160;|
 * | real                  | &#160;&#160;`bigint` &#124; `number` &#124; `string`&#160;&#160;| &#160;&#160;`string`&#160;&#160;|
 * | serial                | &#160;&#160;`number` &#124; `string`&#160;&#160;                | &#160;&#160;`number`&#160;&#160;|
 * | smallint              | &#160;&#160;`number` &#124; `string`&#160;&#160;                | &#160;&#160;`number`&#160;&#160;|
 * | time                  | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
 * | timeWithTimeZone      | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
 * | timestamp             | &#160;&#160;`Date` &#124; `string`&#160;&#160;                  | &#160;&#160;`Date`&#160;&#160;|
 * | timestampWithTimeZone | &#160;&#160;`Date` &#124; `string`&#160;&#160;                  | &#160;&#160;`Date`&#160;&#160;|
 * | tsquery               | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
 * | tsvector              | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
 * | uuid                  | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
 * | xml                   | &#160;&#160;`string`&#160;&#160;                                | &#160;&#160;`string`&#160;&#160;|
 *
 * (*) `Boolish` and `JsonValue` are defined as follows:
 * ```ts
 * type Boolish = "true" | "false" | "yes" | "no" | 1 | 0 | "1" | "0" | "on" | "off";
 * type JsonArray = JsonValue[];
 * type JsonValue = boolean | number | string | Record<string, unknown> | JsonArray;
 * ```
 * @example
 * ```ts
 * const userRole = enumType("user_role", ["admin", "user"]);
 * const users = table({
 *   columns: {
 *     id: integer().generatedAlwaysAsIdentity(),
 *     name: text(),
 *     role: enumerated(userRole).notNull(),
 *     orderCount: integer().notNull().default(0),
 *     createdAt: timestampWithTimeZone().default(sql`now`).notNull(),
 *   },
 *   constraints: {
 *     primaryKey: primaryKey(["id"]),
 *   },
 * });
 * const schema = zodSchema(users);
 * type InputType = z.input<typeof schema>;
 * type OutputType = z.output<typeof schema>;
 * ```
 *
 * `InputType` will be:
 *
 * ```ts
 * type InputType = {
 *   id: never;
 *   name?: string | null | undefined;
 *   role: "user" | "admin";
 *   orderCount: number | string | undefined;
 *   createdAt?: Date | string | undefined;
 * }
 * ```
 *
 * `OutputType` will be:
 *
 * ```ts
 * type OutputType = {
 *   id: never;
 *   name?: string | null | undefined;
 *   orderCount?: number | undefined;
 *   role: "user" | "admin";
 *   createdAt?: Date | undefined;
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodSchema<T extends PgTable<any, any>>(table: T) {
	const cols = tableInfo(table).schema.columns as ColumnRecord;
	const columnSchema = Object.entries(cols).reduce((acc, [key, value]) => {
		return acc.extend({
			[key]: pgColumnSchema<typeof value, false>(value),
		});
	}, z.object({}));
	return z.object(columnSchema.shape) as unknown as TableSchema<T>;
}

// eslint-disable-next-line complexity
export function pgColumnSchema<
	T extends
		| PgColumn<unknown, unknown, unknown>
		| SerialColumn<unknown, unknown>,
	PK extends boolean = false,
>(column: T): ZodType<T, PK> {
	if (isPgBoolean(column)) {
		return pgBooleanSchema(column);
	}
	if (isPgText(column)) {
		return pgTextSchema(column);
	}
	if (isBigInt(column)) {
		return pgBigintSchema(column);
	}
	if (isSerial(column)) {
		return pgIntegerSchema(column);
	}
	if (isBigserial(column)) {
		return pgBigintSchema(column);
	}
	if (isBytea(column)) {
		return pgByteaSchema(column);
	}
	if (isJson(column)) {
		return pgJsonSchema(column);
	}
	if (isJsonB(column)) {
		return pgJsonbSchema(column);
	}
	if (isDate(column)) {
		return pgDateSchema(column);
	}
	if (isDoublePrecision(column)) {
		return pgDoublePrecisionSchema(column);
	}
	if (isSmallint(column)) {
		return pgSmallintSchema(column);
	}
	if (isInteger(column)) {
		return pgIntegerSchema(column);
	}
	if (isReal(column)) {
		return pgRealSchema(column);
	}
	if (isUuid(column)) {
		return pgUuidSchema(column);
	}
	if (isTime(column)) {
		return pgTimeSchema(column);
	}
	if (isTimeTz(column)) {
		return pgTimeTzSchema(column);
	}
	if (isTimestamp(column)) {
		return pgTimestampSchema(column);
	}
	if (isTimestampTz(column)) {
		return pgTimestampTzSchema(column);
	}
	if (isNumeric(column)) {
		return pgNumericSchema(column);
	}
	if (isEnum(column)) {
		return pgEnumSchema(column);
	}
	if (isVarchar(column)) {
		return pgVarcharSchema(column);
	}
	if (isChar(column)) {
		return pgCharSchema(column);
	}
	if (isTsvectorColumn(column)) {
		return tsvectorSchema(column);
	}
	if (isTsQueryColumn(column)) {
		return tsquerySchema(column);
	}
	if (isXMLColumn(column)) {
		return xmlSchema(column);
	}
	if (isBitColumn(column)) {
		return bitSchema(column);
	}
	if (isVarbitColumn(column)) {
		return varbitSchema(column);
	}
	if (isInetColumn(column)) {
		return inetSchema(column);
	}
	if (isCidrColumn(column)) {
		return cidrSchema(column);
	}
	if (isMacaddrColumn(column)) {
		return macaddrSchema(column);
	}
	if (isMacaddr8Column(column)) {
		return macaddr8Schema(column);
	}
	return z.never() as unknown as ZodType<T, PK>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TableSchema<T extends PgTable<any, any>> =
	T extends PgTable<infer C, infer PK> ? ZodSchemaObject<C, PK> : never;
