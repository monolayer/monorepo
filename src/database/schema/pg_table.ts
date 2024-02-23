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

type TableSchema<T, PK> = {
	columns: T extends ColumnRecord ? T : never;
	primaryKey?: PK;
	foreignKeys?: PgForeignKey<keyof T | Array<keyof T>>[];
	uniqueConstraints?: PgUnique<keyof T | Array<keyof T>>[];
	indexes?: PgIndex<keyof T | Array<keyof T>>[];
	triggers?: Record<string, PgTrigger>;
};

export function pgTable<
	T extends ColumnRecord,
	PK extends Array<keyof T> | undefined = undefined,
>(schema: TableSchema<T, PK>) {
	return new PgTable(schema);
}

export class PgTable<
	T extends ColumnRecord,
	PK extends Array<keyof T> | undefined = undefined,
> {
	declare infer: Simplify<
		InferColumTypes<T, PK extends Array<keyof T> ? PK[number] : never>
	>;

	declare inferSelect: Selectable<typeof this.infer>;
	declare inferInsert: Simplify<Insertable<typeof this.infer>>;
	declare inferUpdate: Simplify<Updateable<typeof this.infer>>;

	constructor(public schema: TableSchema<T, PK>) {
		this.schema.indexes = this.schema.indexes || [];
		this.schema.columns = this.schema.columns || {};
		this.schema.primaryKey = this.schema.primaryKey;
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

type InferColumTypes<T extends ColumnRecord, K extends PropertyKey> = Simplify<{
	[P in keyof T]: P extends K
		? Simplify<PrimaryKeyColumn<T[P]["_columnType"], T[P]>>
		: Simplify<NonPrimaryKeyColumn<T[P]["_columnType"], T[P]>>;
}>;

type PrimaryKeyColumn<T, C extends PgColumnTypes> = T extends ColumnType<
	infer S,
	infer I,
	infer U
>
	? ColumnType<
			Exclude<Exclude<S, undefined>, null>,
			undefined extends I
				? null extends I
					? Exclude<Exclude<I, undefined>, null>
					: I | undefined
				: C["_generatedAlways"] extends true
				  ? never
				  : I,
			undefined extends I
				? null extends I
					? Exclude<U, null>
					: Exclude<U, null>
				: C["_generatedAlways"] extends true
				  ? never
				  : Exclude<U, null>
	  >
	: never;

type NonPrimaryKeyColumn<T, C extends PgColumnTypes> = T extends ColumnType<
	infer S,
	infer I,
	infer U
>
	? C["_hasDefault"] extends true
		? ColumnType<S, I | undefined, U>
		: ColumnType<S, I, U>
	: never;
