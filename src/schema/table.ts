import type { Simplify } from "kysely";
import type { PgCheck } from "./check.js";
import { TableColumn } from "./column.js";
import type { PgForeignKey } from "./foreign-key.js";
import { type PgIndex } from "./index.js";
import { InferColumnTypes } from "./inference.js";
import {
	introspectTable,
	type TableIntrospection,
} from "./introspect-table.js";
import type { AnyPgDatabase } from "./pg-database.js";
import type { PgPrimaryKey } from "./primary-key.js";
import type { PgTrigger } from "./trigger.js";
import type { PgUnique } from "./unique.js";

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
