import { z } from "zod";
import type { ZodSchemaObject, ZodType } from "~/schema/inference.js";
import type { PgColumn, PgGeneratedColumn } from "~/schema/pg_column.js";
import {
	tableInfo,
	type ColumnRecord,
	type PgTable,
} from "../schema/pg_table.js";
import {
	bitSchema,
	isBitColumn,
	isVarbitColumn,
	varbitSchema,
} from "./column_schemas/bit_string.js";
import { isPgBoolean, pgBooleanSchema } from "./column_schemas/boolean.js";
import { isBytea, pgByteaSchema } from "./column_schemas/bytea.js";
import {
	isChar,
	isPgText,
	isVarchar,
	pgCharSchema,
	pgTextSchema,
	pgVarcharSchema,
} from "./column_schemas/character.js";
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
} from "./column_schemas/date_time.js";
import { isEnum, pgEnumSchema } from "./column_schemas/enum.js";
import {
	generatedColumnSchema,
	isGeneratedColumn,
} from "./column_schemas/generated.js";
import {
	isJson,
	isJsonB,
	pgJsonSchema,
	pgJsonbSchema,
} from "./column_schemas/json.js";
import {
	cidrSchema,
	inetSchema,
	isCidrColumn,
	isInetColumn,
	isMacaddr8Column,
	isMacaddrColumn,
	macaddr8Schema,
	macaddrSchema,
} from "./column_schemas/network_address.js";
import {
	isBigInt,
	isDoublePrecision,
	isFloat4,
	isFloat8,
	isInt2,
	isInt4,
	isInt8,
	isInteger,
	isNumeric,
	isReal,
	pgBigintSchema,
	pgDoublePrecisionSchema,
	pgFloat4Schema,
	pgFloat8Schema,
	pgInt2Schema,
	pgInt4Schema,
	pgInt8Schema,
	pgIntegerSchema,
	pgNumericSchema,
	pgRealSchema,
} from "./column_schemas/numeric.js";
import {
	isTsQueryColumn,
	isTsvectorColumn,
	tsquerySchema,
	tsvectorSchema,
} from "./column_schemas/text_search.js";
import { isUuid, pgUuidSchema } from "./column_schemas/uuid.js";
import { isXMLColumn, xmlSchema } from "./column_schemas/xml.js";

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
