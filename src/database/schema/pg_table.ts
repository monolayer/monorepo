import type { Insertable, Selectable, Simplify, Updateable } from "kysely";
import { z } from "zod";
import {
	type GeneratedColumnType,
	type InferColumType,
	type NonNullableColumn,
	type PgColumn,
	PgColumnTypes,
	type PgGeneratedColumn,
} from "./pg_column.js";
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

	zodSchema() {
		const cols = this.schema.columns as ColumnRecord;
		const schema = Object.entries(cols).reduce(
			(acc, [key, value]) => {
				return acc.extend({
					[key]: value.zodSchema(),
				}) as ZodSchemaObject<T>;
			},
			z.object({}) as ZodSchemaObject<T>,
		);
		return z.object(schema.shape);
	}
}

type ZodSchemaObject<T extends ColumnRecord> = z.ZodObject<
	{
		[K in keyof T]: T[K] extends NonNullableColumn
			? ReturnType<T[K]["zodSchema"]>
			: z.ZodOptional<ReturnType<T[K]["zodSchema"]>>;
	},
	"strip",
	z.ZodTypeAny,
	{
		[K in keyof T]: ReturnType<T[K]["zodSchema"]>["_output"];
	},
	{
		[K in keyof T]: ReturnType<T[K]["zodSchema"]>["_input"];
	}
>;

export type InferColumTypes<T extends ColumnRecord> = Simplify<{
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	[P in keyof T]: T[P] extends PgColumn<any, any>
		? InferColumType<T[P]>
		: T[P] extends PgGeneratedColumn<infer S, infer U>
		  ? GeneratedColumnType<S, U, U>
		  : never;
}>;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type AnyPgTable = PgTable<any>;
