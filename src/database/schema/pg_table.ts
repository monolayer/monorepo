import type { Simplify } from "kysely";
import { z } from "zod";
import { InferColumnTypes, ZodSchemaObject } from "./inference.js";
import { IntrospectedTable, introspectTable } from "./introspect_table.js";
import { PgColumnTypes } from "./pg_column.js";
import type { AnyPgDatabase } from "./pg_database.js";
import type { PgForeignKey } from "./pg_foreign_key.js";
import { type PgIndex } from "./pg_index.js";
import type { PgTrigger } from "./pg_trigger.js";
import type { PgUnique } from "./pg_unique.js";

export type ColumnRecord = Record<string, PgColumnTypes>;

type TableSchema<T, PK extends string> = {
	columns: T extends ColumnRecord ? T : never;
	primaryKey?: keyof T extends string
		? PK[] extends Array<keyof T>
			? PK[]
			: Array<keyof T>
		: never;
	foreignKeys?: PgForeignKey<Array<keyof T>>[];
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
				pkColumn._isPrimaryKey = true;
			}
		}
	}
	const table: PgTable<T, PK> = {
		schema: tableSchema,
		zodSchema: () => {
			const cols = tableSchema.columns as ColumnRecord;
			const schema = Object.entries(cols).reduce((acc, [key, value]) => {
				return acc.extend({
					[key]: value.zodSchema(),
				});
			}, z.object({}));
			return z.object(schema.shape) as ZodSchemaObject<T>;
		},
		introspect: () => introspectTable(table),
		inferPK: "infer" as unknown as PK extends keyof T
			? Exclude<PK, undefined>
			: never,
		infer: "infer" as unknown as Simplify<InferColumnTypes<T, PK>>,
	};
	return table as PgTable<T, PK>;
}

export type PgTable<T extends ColumnRecord, PK extends string> = {
	infer: Simplify<InferColumnTypes<T, PK>>;
	database?: AnyPgDatabase;
	zodSchema: () => ZodSchemaObject<T>;
	introspect: () => IntrospectedTable;
	schema: TableSchema<T, PK>;
	inferPK: PK extends keyof T ? Exclude<PK, undefined> : never;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgTable = PgTable<any, any>;
