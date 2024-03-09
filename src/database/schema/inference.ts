import type {
	ColumnType,
	GeneratedAlways,
	InsertType,
	SelectType,
	Simplify,
} from "kysely";
import { z } from "zod";
import {
	GeneratedColumn,
	OptionalColumnType,
	PgColumn,
	PgTimestamp,
	PgTimestampTz,
	WithDefaultColumn,
	type AnyPGColumn,
	type GeneratedAlwaysColumn,
	type GeneratedColumnType,
	type NonNullableColumn,
	type PgGeneratedColumn,
} from "./pg_column.js";
import { ColumnRecord } from "./pg_table.js";

export type InferColumnTypes<
	T extends ColumnRecord,
	PK extends string,
> = Simplify<PrimaryKeyColumns<T, PK> & NonPrimaryKeyColumns<T, PK>>;

export type PrimaryKeyColumns<
	T extends ColumnRecord,
	M extends string,
> = string extends M
	? // eslint-disable-next-line @typescript-eslint/ban-types
		{}
	: Pick<
			{
				[P in keyof T]: T[P] extends AnyPGColumn
					? InferPrimaryKeyColumType<T[P]>
					: T[P] extends PgGeneratedColumn<infer S, infer U>
						? GeneratedColumnType<S, U, U>
						: never;
			},
			M
		>;

export type NonPrimaryKeyColumns<
	T extends ColumnRecord,
	M extends string,
> = string extends M
	? {
			[P in keyof T]: T[P] extends AnyPGColumn
				? InferColumType<T[P]>
				: T[P] extends PgGeneratedColumn<infer S, infer U>
					? GeneratedColumnType<S, U, U>
					: never;
		}
	: Omit<
			{
				[P in keyof T]: T[P] extends AnyPGColumn
					? InferColumType<T[P]>
					: T[P] extends PgGeneratedColumn<infer S, infer U>
						? GeneratedColumnType<S, U, U>
						: never;
			},
			M
		>;

export type ZodSchemaObject<T extends ColumnRecord> = z.ZodObject<
	{
		[K in keyof T]: ReturnType<T[K]["zodSchema"]>;
	},
	"strip",
	z.ZodTypeAny
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InferColumType<T extends PgColumn<any, any, any>> =
	T extends PgColumn<infer S, infer I, infer U>
		? T extends NonNullableColumn
			? T extends WithDefaultColumn
				? OptionalColumnType<S, I, U>
				: T extends GeneratedAlwaysColumn
					? Simplify<GeneratedAlways<S>>
					: T extends GeneratedColumn
						? OptionalColumnType<S, I, U>
						: Simplify<ColumnType<S, I, U>>
			: T extends WithDefaultColumn
				? Simplify<ColumnType<NonNullable<S>, I | null | undefined, U | null>>
				: T extends GeneratedAlwaysColumn
					? Simplify<GeneratedAlways<S>>
					: Simplify<ColumnType<S | null, I | null | undefined, U | null>>
		: never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InferPrimaryKeyColumType<T extends PgColumn<any, any, any>> =
	T extends PgColumn<infer S, infer I, infer U>
		? T extends NonNullableColumn
			? T extends WithDefaultColumn
				? OptionalColumnType<
						NonNullable<S>,
						NonNullable<I> | undefined,
						NonNullable<U>
					>
				: T extends GeneratedAlwaysColumn
					? Simplify<GeneratedAlways<S>>
					: T extends GeneratedColumn
						? OptionalColumnType<
								NonNullable<S>,
								NonNullable<I> | undefined,
								NonNullable<U>
							>
						: Simplify<
								ColumnType<NonNullable<S>, NonNullable<I>, NonNullable<U>>
							>
			: T extends WithDefaultColumn
				? Simplify<
						ColumnType<
							NonNullable<S>,
							NonNullable<I> | undefined,
							NonNullable<U>
						>
					>
				: T extends GeneratedAlwaysColumn
					? Simplify<GeneratedAlways<S>>
					: Simplify<ColumnType<NonNullable<S>, NonNullable<I>, NonNullable<U>>>
		: never;

export type ZodType<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends PgColumn<any, any, any> | PgTimestamp | PgTimestampTz,
> = z.ZodType<
	T extends NonNullableColumn
		? SelectType<InferColumType<T>>
		: T extends GeneratedAlwaysColumn
			? never
			: SelectType<InferColumType<T>> | null | undefined,
	z.ZodTypeDef,
	InsertType<InferColumType<T>>
>;
