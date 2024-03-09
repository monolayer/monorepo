import type { Simplify } from "kysely";
import { InferColumnTypes } from "./inference.js";
import { IntrospectedTable, introspectTable } from "./introspect_table.js";
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
	foreignKeys?: PgForeignKey<Array<keyof T>, any>[];
	uniqueConstraints?: keyof T extends string ? PgUnique<keyof T>[] : [];
	indexes?: keyof T extends string ? PgIndex<keyof T>[] : [];
	triggers?: Record<string, PgTrigger>;
};

export function pgTable<T extends ColumnRecord, PK extends string>(
	tableSchema: TableSchema<T, PK>,
) {
	const columns = tableSchema.columns;
	const primaryKey = tableSchema.primaryKey;
	if (primaryKey !== undefined && primaryKey.length !== 0) {
		for (const key of primaryKey) {
			const pkColumn = columns[key];
			if (pkColumn !== undefined) {
				pkColumn._primaryKey = true;
			}
		}
	}
	const table: PgTable<T, PK> = {
		schema: tableSchema,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		introspect: () => introspectTable(table as PgTable<any, any>),
		infer: "infer" as unknown as Simplify<InferColumnTypes<T, PK>>,
	};
	const columNames = Object.keys(tableSchema.columns);
	for (const columnName of columNames) {
		const column = columns[columnName];
		if (column !== undefined) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			column.table = table as PgTable<any, any>;
		}
	}
	return table as PgTable<T, PK>;
}

export type PgTable<T extends ColumnRecord, PK extends string> = {
	infer: Simplify<InferColumnTypes<T, PK>>;
	database?: AnyPgDatabase;
	introspect: () => IntrospectedTable;
	schema: TableSchema<T, PK>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgTable = PgTable<any, any>;
