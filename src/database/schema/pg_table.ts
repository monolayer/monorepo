import type { Insertable, Selectable, Simplify, Updateable } from "kysely";
import { PgColumnTypes } from "./pg_column.js";
import type { PgForeignKey } from "./pg_foreign_key.js";
import { type PgIndex } from "./pg_index.js";
import type { PgTrigger } from "./pg_trigger.js";
import type { PgUnique } from "./pg_unique.js";

export type ColumnRecord = Record<string, PgColumnTypes>;

export function pgTable<
	N extends string,
	T extends ColumnRecord,
	PK extends keyof T,
>(
	name: N,
	schema: {
		columns: T extends ColumnRecord ? T : never;
		primaryKey?: PK[];
		foreignKeys?: PgForeignKey<keyof T | Array<keyof T>>[];
		uniqueConstraints?: PgUnique<keyof T | Array<keyof T>>[];
		indexes?: PgIndex<keyof T | Array<keyof T>>[];
		triggers?: Record<string, PgTrigger>;
	},
) {
	return new PgTable(name, schema);
}

export class PgTable<
	N extends string,
	T extends ColumnRecord,
	PK extends keyof T,
> {
	declare infer: {
		[K in keyof T]: T[K]["_columnType"];
	};
	declare inferSelect: Selectable<typeof this.infer>;
	declare inferInsert: Simplify<Insertable<typeof this.infer>>;
	declare inferUpdate: Simplify<Updateable<typeof this.infer>>;

	constructor(
		public name: N,
		public schema: {
			columns: T extends ColumnRecord ? T : never;
			primaryKey?: PK[];
			foreignKeys?: PgForeignKey<keyof T | Array<keyof T>>[];
			uniqueConstraints?: PgUnique<keyof T | Array<keyof T>>[];
			indexes?: PgIndex<keyof T | Array<keyof T>>[];
			triggers?: Record<string, PgTrigger>;
		},
	) {
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
