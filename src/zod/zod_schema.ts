import { z } from "zod";
import type { ZodSchemaObject, ZodType } from "~/schema/inference.js";
import type { PgColumn, PgGeneratedColumn } from "~/schema/pg_column.js";
import {
	tableInfo,
	type ColumnRecord,
	type PgTable,
} from "../schema/pg_table.js";
import { generatedColumnSchema } from "./base_schemas.js";
import {
	isBigInt,
	isBitColumn,
	isBytea,
	isChar,
	isDate,
	isDoublePrecision,
	isEnum,
	isFloat4,
	isFloat8,
	isGeneratedColumn,
	isInt2,
	isInt4,
	isInt8,
	isInteger,
	isJson,
	isJsonB,
	isNumeric,
	isPgBoolean,
	isPgText,
	isReal,
	isTime,
	isTimeTz,
	isTimestamp,
	isTimestampTz,
	isTsQueryColumn,
	isTsVector,
	isUuid,
	isVarbitColumn,
	isVarchar,
	isXMLColumn,
} from "./column_assertions.js";
import {
	bitSchema,
	pgBigintSchema,
	pgBooleanSchema,
	pgByteaSchema,
	pgCharSchema,
	pgDateSchema,
	pgDoublePrecisionSchema,
	pgEnumSchema,
	pgFloat4Schema,
	pgFloat8Schema,
	pgInt2Schema,
	pgInt4Schema,
	pgInt8Schema,
	pgIntegerSchema,
	pgJsonSchema,
	pgJsonbSchema,
	pgNumericSchema,
	pgRealSchema,
	pgTextSchema,
	pgTimeSchema,
	pgTimeTzSchema,
	pgTimestampSchema,
	pgTimestampTzSchema,
	pgUuidSchema,
	pgVarcharSchema,
	stringSchema,
	varbitSchema,
} from "./column_schemas.js";
import { nullable, required } from "./refinements.js";

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
export function baseSchema(isNullable: boolean, errorMessage: string) {
	return z
		.any()
		.superRefine(required)
		.superRefine((val, ctx) => {
			nullable(val, ctx, isNullable, errorMessage);
		});
}

// eslint-disable-next-line complexity
export function pgColumnSchema<
	T extends
		| PgColumn<unknown, unknown, unknown>
		| PgGeneratedColumn<unknown, unknown>,
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
	if (isGeneratedColumn(column)) {
		return generatedColumnSchema<typeof column, PK>();
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
	if (isFloat4(column)) {
		return pgFloat4Schema(column);
	}
	if (isFloat8(column)) {
		return pgFloat8Schema(column);
	}
	if (isInt2(column)) {
		return pgInt2Schema(column);
	}
	if (isInt4(column)) {
		return pgInt4Schema(column);
	}
	if (isInt8(column)) {
		return pgInt8Schema(column);
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
	if (isTsVector(column)) {
		return stringSchema(column);
	}
	if (isTsQueryColumn(column)) {
		return stringSchema(column);
	}
	if (isXMLColumn(column)) {
		return stringSchema(column);
	}
	if (isBitColumn(column)) {
		return bitSchema(column);
	}
	if (isVarbitColumn(column)) {
		return varbitSchema(column);
	}
	return z.never() as unknown as ZodType<T, PK>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TableSchema<T extends PgTable<any, any>> =
	T extends PgTable<infer C, infer PK> ? ZodSchemaObject<C, PK> : never;
