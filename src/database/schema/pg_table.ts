import type {
	ColumnType,
	Insertable,
	Selectable,
	Simplify,
	Updateable,
} from "kysely";
import { PgColumnTypes } from "./pg_column.js";
import type { PgForeignKey } from "./pg_foreign_key.js";
import { type PgIndex } from "./pg_index.js";
import type { PgTrigger } from "./pg_trigger.js";
import type { PgUnique } from "./pg_unique.js";

export type ColumnRecord = Record<string, PgColumnTypes>;

type TableSchema<T> = {
	columns: T extends ColumnRecord ? T : never;
	foreignKeys?: PgForeignKey<keyof T | Array<keyof T>>[];
	uniqueConstraints?: PgUnique<keyof T | Array<keyof T>>[];
	indexes?: keyof T extends string ? PgIndex<keyof T>[] : [];
	triggers?: Record<string, PgTrigger>;
};

export function pgTable<T extends ColumnRecord>(schema: TableSchema<T>) {
	return new PgTable(schema);
}

export class PgTable<T extends ColumnRecord> {
	declare infer: Simplify<InferColumTypes<T>>;

	declare inferSelect: Selectable<typeof this.infer>;
	declare inferInsert: Simplify<Insertable<typeof this.infer>>;
	declare inferUpdate: Simplify<Updateable<typeof this.infer>>;

	constructor(public schema: TableSchema<T>) {
		this.schema.indexes = this.schema.indexes || [];
		this.schema.columns = this.schema.columns || {};
		this.schema.foreignKeys = this.schema.foreignKeys;
		this.schema.uniqueConstraints = this.schema.uniqueConstraints || [];
		this.schema.triggers = this.schema.triggers || {};
	}

	get columns() {
		return this.schema.columns;
	}

	get indexes() {
		return this.schema.indexes;
	}

	get triggers() {
		return this.schema.triggers;
	}
}

type InferColumTypes<T extends ColumnRecord> = Simplify<{
	[P in keyof T]: Simplify<NonPrimaryKeyColumn<T[P]["_columnType"], T[P]>>;
}>;

type NonPrimaryKeyColumn<T, C extends PgColumnTypes> = T extends ColumnType<
	infer S,
	infer I,
	infer U
>
	? C["_hasDefault"] extends true
		? ColumnType<S, I | undefined, U>
		: C["_generatedAlways"] extends true
		  ? ColumnType<S, I, U>
		  : C["_generatedByDefault"] extends true
			  ? ColumnType<S, I | undefined, U>
			  : ColumnType<S, I, U>
	: never;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type AnyPgTable = PgTable<any>;
