import type { Insertable, Selectable, Updateable } from "kysely";
import { type Simplify } from "type-fest";
import { PgColumnTypes } from "./pg_column.js";
import type { PgForeignKeyConstraint } from "./pg_foreign_key.js";
import { pgIndex } from "./pg_index.js";
import type { PgPrimaryKeyConstraint } from "./pg_primary_key.js";
import type { PgUniqueConstraint } from "./pg_unique.js";

export type ColumnRecord = Record<string, PgColumnTypes>;
export type Constraints = (PgUniqueConstraint | PgForeignKeyConstraint)[];

export type TableSchema = {
	columns: ColumnRecord;
	indexes: pgIndex[];
	constraints: Constraints;
	primaryKey?: PgPrimaryKeyConstraint;
};

export type OptionalTableSchema = {
	columns: ColumnRecord;
	indexes?: pgIndex[];
	constraints?: Constraints;
	primaryKey?: PgPrimaryKeyConstraint;
};

export type pgTable<T extends string, C extends OptionalTableSchema> = {
	name: T;
	columns: C["columns"];
	indexes: C["indexes"];
	constraints: C["constraints"];
	primaryKey: C["primaryKey"];
	infer: {
		[K in keyof C["columns"]]: C["columns"][K]["_columnType"];
	};
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

export function pgTable<T extends string, C extends OptionalTableSchema>(
	name: T,
	schema: C,
) {
	const table = <
		pgTable<
			T,
			{
				columns: C["columns"];
				indexes: C["indexes"] extends pgIndex[] ? C["indexes"] : [];
				constraints: C["constraints"] extends Constraints
					? C["constraints"]
					: [];
				primaryKey: C["primaryKey"] extends PgPrimaryKeyConstraint
					? C["primaryKey"]
					: undefined;
			}
		>
	>{
		name: name,
		columns: schema.columns,
		indexes: schema.indexes ? schema.indexes : [],
		constraints: schema.constraints ? schema.constraints : [],
		primaryKey: schema.primaryKey,
	};
	return table;
}
