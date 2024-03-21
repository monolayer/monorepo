import type { Simplify } from "kysely";
import type { PgCheck } from "../check/check.js";
import type { PgEnum } from "../column/column.js";
import type { PgBigInt } from "../column/data-types/bigint.js";
import type { PgBigSerial } from "../column/data-types/bigserial.js";
import type { PgBoolean } from "../column/data-types/boolean.js";
import type { PgBytea } from "../column/data-types/bytea.js";
import type { PgCharacterVarying } from "../column/data-types/character-varying.js";
import type { PgCharacter } from "../column/data-types/character.js";
import type { PgDate } from "../column/data-types/date.js";
import type { PgDoublePrecision } from "../column/data-types/double-precision.js";
import type { PgInteger } from "../column/data-types/integer.js";
import type { PgJson } from "../column/data-types/json.js";
import type { PgJsonB } from "../column/data-types/jsonb.js";
import type { PgNumeric } from "../column/data-types/numeric.js";
import type { PgReal } from "../column/data-types/real.js";
import type { PgSerial } from "../column/data-types/serial.js";
import type { PgSmallint } from "../column/data-types/smallint.js";
import type { PgText } from "../column/data-types/text.js";
import type { PgTimeWithTimeZone } from "../column/data-types/time-with-time-zone.js";
import type { PgTime } from "../column/data-types/time.js";
import type { PgTimestampWithTimeZone } from "../column/data-types/timestamp-with-time-zone.js";
import type { PgTimestamp } from "../column/data-types/timestamp.js";
import type { PgUuid } from "../column/data-types/uuid.js";
import type { PgForeignKey } from "../foreign-key/foreign-key.js";
import { type PgIndex } from "../index/index.js";
import { InferColumnTypes } from "../inference.js";
import {
	introspectTable,
	type TableIntrospection,
} from "../introspect-table.js";
import type { AnyPgDatabase } from "../pg-database.js";
import type { PgPrimaryKey } from "../primary-key/primary-key.js";
import type { PgTrigger } from "../trigger/trigger.js";
import type { PgUnique } from "../unique/unique.js";

export type ColumnName = string;

export type ColumnRecord = Record<ColumnName, TableColumn>;

export type TableSchema<T, PK extends string> = {
	columns: T extends ColumnRecord ? T : never;
	indexes?: keyof T extends string ? PgIndex<keyof T>[] : [];
	triggers?: Record<string, PgTrigger>;
	constraints?: {
		primaryKey?: keyof T extends string
			? PK[] extends Array<keyof T>
				? PgPrimaryKey<keyof T, PK>
				: PgPrimaryKey<keyof T, PK>
			: never;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		foreignKeys?: keyof T extends string ? PgForeignKey<keyof T, any>[] : [];
		unique?: keyof T extends string ? PgUnique<keyof T>[] : [];
		checks?: PgCheck[];
	};
};

export function table<T extends ColumnRecord, PK extends string>(
	tableSchema: TableSchema<T, PK>,
) {
	return new PgTable<T, PK>(tableSchema);
}

export class PgTable<T extends ColumnRecord, PK extends string> {
	declare infer: Simplify<InferColumnTypes<T, PK>>;
	/**
	 * @hidden
	 */
	protected database?: AnyPgDatabase;

	/**
	 * @hidden
	 */
	constructor(
		/**
		 * @hidden
		 */
		protected schema: TableSchema<T, PK>,
	) {
		const columns = this.schema.columns;
		const primaryKey = this.schema.constraints?.primaryKey;
		if (primaryKey !== undefined) {
			const primaryKeyDef = Object.fromEntries(Object.entries(primaryKey)) as {
				columns: string[];
			};
			for (const key of primaryKeyDef.columns) {
				const pkColumn = columns[key];
				if (pkColumn !== undefined) {
					Object.defineProperty(pkColumn, "_primaryKey", {
						value: true,
						writable: false,
					});
				}
			}
		}
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgTable = PgTable<any, any>;

type InferTableSchema<T extends AnyPgTable> =
	T extends PgTable<infer C, infer PK> ? TableSchema<C, PK> : never;

export function tableInfo<T extends AnyPgTable>(table: T) {
	const info = Object.fromEntries(Object.entries(table)) as unknown as {
		schema: InferTableSchema<T>;
		database?: AnyPgDatabase;
		introspect(): TableIntrospection;
	};
	info.introspect = () => {
		return introspectTable(table);
	};
	return info;
}

export type TableColumn =
	| PgBigInt
	| PgBigSerial
	| PgBoolean
	| PgBytea
	| PgCharacter
	| PgDate
	| PgDoublePrecision
	| PgSmallint
	| PgInteger
	| PgJson
	| PgJsonB
	| PgNumeric
	| PgReal
	| PgSerial
	| PgText
	| PgTime
	| PgTimeWithTimeZone
	| PgTimestamp
	| PgTimestampWithTimeZone
	| PgUuid
	| PgCharacterVarying
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	| PgEnum<any>;
