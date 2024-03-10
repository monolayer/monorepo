import type { Simplify } from "kysely";
import { InferColumnTypes } from "./inference.js";
import { introspectTable, type IntrospectedTable } from "./introspect_table.js";
import { PgColumnTypes } from "./pg_column.js";
import type { AnyPgDatabase } from "./pg_database.js";
import type { PgForeignKey } from "./pg_foreign_key.js";
import { type PgIndex } from "./pg_index.js";
import type { PgTrigger } from "./pg_trigger.js";
import type { PgUnique } from "./pg_unique.js";

export type ColumnRecord = Record<string, PgColumnTypes>;

export type TableSchema<T, PK extends string> = {
	columns: T extends ColumnRecord ? T : never;
	primaryKey?: keyof T extends string
		? PK[] extends Array<keyof T>
			? PK[]
			: Array<keyof T>
		: never;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	foreignKeys?: keyof T extends string ? PgForeignKey<keyof T, any>[] : [];
	uniqueConstraints?: keyof T extends string ? PgUnique<keyof T>[] : [];
	indexes?: keyof T extends string ? PgIndex<keyof T>[] : [];
	triggers?: Record<string, PgTrigger>;
};

export function pgTable<T extends ColumnRecord, PK extends string>(
	tableSchema: TableSchema<T, PK>,
) {
	return new PgTable<T, PK>(tableSchema);
}

export class PgTable<T extends ColumnRecord, PK extends string> {
	declare infer: Simplify<InferColumnTypes<T, PK>>;
	protected database?: AnyPgDatabase;

	constructor(protected schema: TableSchema<T, PK>) {
		const columns = this.schema.columns;
		const primaryKey = this.schema.primaryKey;
		if (primaryKey !== undefined && primaryKey.length !== 0) {
			for (const key of primaryKey) {
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
		introspect(): IntrospectedTable;
	};
	info.introspect = () => {
		return introspectTable(table);
	};
	return info;
}
