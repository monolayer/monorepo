import type {
	ColumnType,
	GeneratedAlways,
	InsertType,
	SelectType,
	Simplify,
} from "kysely";
import { z } from "zod";
import {
	PgColumn,
	type AnyPGColumn,
	type SerialColumn,
} from "./table/column/column.js";
import { type PgBytea } from "./table/column/data-types/bytea.js";
import { type PgTimestampWithTimeZone } from "./table/column/data-types/timestamp-with-time-zone.js";
import { type PgTimestamp } from "./table/column/data-types/timestamp.js";
import {
	GeneratedColumn,
	OptionalColumnType,
	WithDefaultColumn,
	type GeneratedAlwaysColumn,
	type GeneratedColumnType,
	type JsonValue,
	type NonNullableColumn,
} from "./table/column/types.js";
import { ColumnRecord } from "./table/table-column.js";

export type InferColumnTypes<
	T extends ColumnRecord,
	PK extends string,
> = Simplify<PrimaryKeyColumns<T, PK> & NonPrimaryKeyColumns<T, PK>>;

type PrimaryKeyColumns<
	T extends ColumnRecord,
	M extends string,
> = string extends M
	? // eslint-disable-next-line @typescript-eslint/ban-types
		{}
	: Pick<
			{
				[P in keyof T]: T[P] extends AnyPGColumn
					? InferColumType<T[P], true>
					: T[P] extends SerialColumn<infer S, infer U>
						? GeneratedColumnType<S, U, U>
						: never;
			},
			M
		>;

type NonPrimaryKeyColumns<
	T extends ColumnRecord,
	M extends string,
> = string extends M
	? {
			[P in keyof T]: T[P] extends AnyPGColumn
				? InferColumType<T[P], false>
				: T[P] extends SerialColumn<infer S, infer U>
					? GeneratedColumnType<S, U, U>
					: never;
		}
	: Omit<
			{
				[P in keyof T]: T[P] extends AnyPGColumn
					? InferColumType<T[P], false>
					: T[P] extends SerialColumn<infer S, infer U>
						? GeneratedColumnType<S, U, U>
						: never;
			},
			M
		>;

type InferColumType<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends PgColumn<any, any, any>,
	PK extends boolean,
> =
	T extends PgColumn<infer S, infer I, infer U>
		? T extends NonNullableColumn
			? T extends WithDefaultColumn
				? PK extends true
					? OptionalColumnType<
							Exclude<S, null>,
							Exclude<I, null> | undefined,
							Exclude<U, null>
						>
					: OptionalColumnType<S, I, U>
				: T extends GeneratedAlwaysColumn
					? Simplify<GeneratedAlways<S>>
					: T extends GeneratedColumn
						? PK extends true
							? OptionalColumnType<
									Exclude<S, null>,
									Exclude<I, null> | undefined,
									Exclude<U, null>
								>
							: OptionalColumnType<S, I, U>
						: PK extends true
							? Simplify<
									ColumnType<
										Exclude<S, null>,
										Exclude<I, null>,
										Exclude<U, null>
									>
								>
							: Simplify<ColumnType<S, I, U>>
			: T extends WithDefaultColumn
				? PK extends true
					? Simplify<
							ColumnType<
								Exclude<S, null>,
								Exclude<I, null> | undefined,
								Exclude<U, null>
							>
						>
					: Simplify<
							ColumnType<Exclude<S, null>, I | null | undefined, U | null>
						>
				: T extends GeneratedAlwaysColumn
					? Simplify<GeneratedAlways<S>>
					: PK extends true
						? Simplify<
								ColumnType<NonNullable<S>, Exclude<I, null>, Exclude<U, null>>
							>
						: Simplify<ColumnType<S | null, I | null | undefined, U | null>>
		: never;

export type ZodSchemaObject<
	T extends ColumnRecord,
	PK extends string,
> = z.ZodObject<
	PrimaryKeyColumnsZodSchemaObject<T, PK> & NonPrimaryZodSchemaObject<T, PK>,
	"strip",
	z.ZodTypeAny
>;

type PrimaryKeyColumnsZodSchemaObject<
	T extends ColumnRecord,
	PK extends string,
> = string extends PK
	? // eslint-disable-next-line @typescript-eslint/ban-types
		{}
	: Pick<
			{
				[K in keyof T]: ZodType<T[K], true>;
			},
			PK
		>;

type NonPrimaryZodSchemaObject<
	T extends ColumnRecord,
	PK extends string,
> = string extends PK
	? {
			[K in keyof T]: ZodType<T[K], false>;
		}
	: Omit<
			{
				[K in keyof T]: ZodType<T[K], false>;
			},
			PK
		>;

export type ZodType<
	T extends
		| PgColumn<unknown, unknown, unknown>
		| SerialColumn<unknown, unknown>,
	PK extends boolean,
> = true extends PK
	? T extends WithDefaultColumn
		? OptionalNonNullableZodType<DefaultZodType<T>>
		: T extends SerialColumn<unknown, unknown>
			? OptionalNonNullableZodType<DefaultZodType<T>>
			: T extends GeneratedColumn
				? OptionalNonNullableZodType<DefaultZodType<T>>
				: NonNullableZodType<DefaultZodType<T>>
	: DefaultZodType<T>;

type DefaultZodType<
	T extends
		| PgColumn<unknown, unknown, unknown>
		| SerialColumn<unknown, unknown>,
> =
	T extends PgColumn<infer U, unknown, unknown>
		? T extends PgTimestamp | PgTimestampWithTimeZone
			? DateZodType<T>
			: T extends PgBytea
				? ByteaZodType<T>
				: JsonValue extends U
					? JsonZodType<T>
					: PgColumnZodType<T>
		: T extends SerialColumn<infer S, infer I>
			? z.ZodType<S | undefined, z.ZodTypeDef, I | undefined>
			: z.ZodType<never, z.ZodTypeDef, never>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NonNullableZodType<T extends z.ZodType<any, any, any>> =
	T extends z.ZodType<infer Output, infer Def, infer Input>
		? z.ZodType<NonNullable<Output>, Def, NonNullable<Input>>
		: never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OptionalNonNullableZodType<T extends z.ZodType<any, any, any>> =
	T extends z.ZodType<infer Output, infer Def, infer Input>
		? z.ZodType<
				Exclude<Output, null> | undefined,
				Def,
				Exclude<Input, null> | undefined
			>
		: never;

type PgColumnZodType<T extends AnyPGColumn> = z.ZodType<
	T extends NonNullableColumn
		? SelectType<InferColumType<T, false>>
		: T extends GeneratedAlwaysColumn
			? never
			: SelectType<InferColumType<T, false>> | null | undefined,
	z.ZodTypeDef,
	T extends WithDefaultColumn
		? InsertType<InferColumType<T, false>>
		: InsertType<InferColumType<T, false>>
>;

type ByteaZodType<T extends AnyPGColumn> = z.ZodType<
	T extends NonNullableColumn
		? SelectType<InferColumType<T, false>> | string
		: T extends GeneratedAlwaysColumn
			? never
			: SelectType<InferColumType<T, false>> | string | undefined,
	z.ZodTypeDef,
	InsertType<InferColumType<T, false>>
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZodJson = JsonValue;

type JsonZodType<T extends AnyPGColumn> = z.ZodType<
	T extends NonNullableColumn
		? ZodJson
		: T extends GeneratedAlwaysColumn
			? never
			: ZodJson | null | undefined,
	z.ZodTypeDef,
	T extends NonNullableColumn ? ZodJson : ZodJson | null | undefined
>;
// T extends PgTimestamp | PgTimestampTz
type DateZodType<T extends AnyPGColumn> = z.ZodType<
	T extends NonNullableColumn
		? Date
		: T extends GeneratedAlwaysColumn
			? never
			: Date | null | undefined,
	z.ZodTypeDef,
	T extends NonNullableColumn ? Date | string : Date | string | null | undefined
>;
