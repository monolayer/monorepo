import type { Simplify } from "kysely";
import { z } from "zod";
import { IntrospectedTable, introspectTable } from "./introspect_table.js";
import {
	PgColumnTypes,
	type GeneratedColumnType,
	type InferColumType,
	type PgColumn,
	type PgGeneratedColumn,
} from "./pg_column.js";
import type { AnyPgDatabase } from "./pg_database.js";
import type { PgForeignKey } from "./pg_foreign_key.js";
import { type PgIndex } from "./pg_index.js";
import type { PgTrigger } from "./pg_trigger.js";
import type { PgUnique } from "./pg_unique.js";

export type ColumnRecord = Record<string, PgColumnTypes>;

type TableSchema<T> = {
	columns: T extends ColumnRecord ? T : never;
	foreignKeys?: PgForeignKey<Array<keyof T>>[];
	uniqueConstraints?: keyof T extends string ? PgUnique<keyof T>[] : [];
	indexes?: keyof T extends string ? PgIndex<keyof T>[] : [];
	triggers?: Record<string, PgTrigger>;
};

export function pgTable<T extends ColumnRecord>(tableSchema: TableSchema<T>) {
	const table: PgTable<T> = {
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
		infer: "infer" as unknown as Simplify<
			InferColumTypes<typeof tableSchema.columns>
		>,
	};
	return table;
}

export type PgTable<T extends ColumnRecord> = {
	infer: Simplify<InferColumTypes<T>>;
	database?: AnyPgDatabase;
	zodSchema: () => ZodSchemaObject<T>;
	introspect: () => IntrospectedTable;
	schema: TableSchema<T>;
};

type ZodSchemaObject<T extends ColumnRecord> = z.ZodObject<
	{
		[K in keyof T]: ReturnType<T[K]["zodSchema"]>;
	},
	"strip",
	z.ZodTypeAny
>;

export type InferColumTypes<T extends ColumnRecord> = Simplify<{
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[P in keyof T]: T[P] extends PgColumn<any, any>
		? InferColumType<T[P]>
		: T[P] extends PgGeneratedColumn<infer S, infer U>
			? GeneratedColumnType<S, U, U>
			: never;
}>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPgTable = PgTable<any>;
