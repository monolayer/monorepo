import type { Insertable, Selectable, Updateable } from "kysely";
import { type Simplify } from "type-fest";
import { PgColumnTypes } from "./pg_column.js";
import { pgIndex } from "./pg_index.js";

type ColumnRecord = Record<string, PgColumnTypes>;

export type TableSchema = {
	columns: ColumnRecord;
	indexes?: pgIndex[];
};

export type pgTable<T extends string, C extends TableSchema> = {
	name: T;
	columns: C["columns"];
	indexes: C["indexes"];
	inferSelect: Selectable<{
		[K in keyof C["columns"]]: C["columns"][K]["_columnType"];
	}>;
	inferInsert: Simplify<
		Insertable<{
			[K in keyof C["columns"]]: C["columns"][K]["_columnType"];
		}>
	>;
	inferUpdate: Simplify<
		Updateable<{
			[K in keyof C["columns"]]: C["columns"][K]["_columnType"];
		}>
	>;
};

export function pgTable<T extends string, C extends TableSchema>(
	name: T,
	schema: C,
) {
	const table = <pgTable<T, C>>{
		name: name,
		columns: schema.columns,
		indexes: schema.indexes,
	};
	return table;
}
