import type {
	ColumnType,
	GeneratedAlways,
	InsertType,
	SelectType,
	Simplify,
} from "kysely";
import type z from "zod";
import type { ColumnRecord } from "~/schema/column.js";
import type { PgColumn, SerialColumn } from "~/schema/column/column.js";
import type { PgBytea } from "~/schema/column/data-types/bytea.js";
import type {
	GeneratedAlwaysColumn,
	GeneratedColumn,
	GeneratedColumnType,
	NonNullableColumn,
	OptionalColumnType,
	OptionalNullableColumnType,
	WithDefaultColumn,
} from "~/schema/column/types.js";

export type InferColumnTypes<
	T extends ColumnRecord,
	PK extends string,
> = Simplify<PrimaryKeyColumns<T, PK> & NonPrimaryKeyColumns<T, PK>>;

type PrimaryKeyColumns<
	T extends ColumnRecord,
	PK extends string,
> = string extends PK
	? // eslint-disable-next-line @typescript-eslint/no-empty-object-type
		{}
	: Pick<
			{
				[P in keyof T]: Simplify<InferColumType<T[P], true>>;
			},
			PK
		>;

type NonPrimaryKeyColumns<
	T extends ColumnRecord,
	PK extends string,
> = string extends PK
	? {
			[P in keyof T]: Simplify<InferColumType<T[P], false>>;
		}
	: Omit<
			{
				[P in keyof T]: Simplify<InferColumType<T[P], false>>;
			},
			PK
		>;

type InferColumType<
	T extends
		| PgColumn<unknown, unknown, unknown>
		| SerialColumn<unknown, unknown>,
	PK extends boolean,
> =
	T extends PgColumn<infer S, infer I, infer U>
		? T extends NonNullableColumn
			? T extends WithDefaultColumn
				? OptionalColumnType<S, I, U>
				: T extends GeneratedAlwaysColumn
					? GeneratedAlways<S>
					: T extends GeneratedColumn
						? OptionalColumnType<S, I, U>
						: ColumnType<S, I, U>
			: T extends WithDefaultColumn
				? PK extends true
					? OptionalColumnType<S, I, U>
					: OptionalNullableColumnType<S, I, U>
				: T extends GeneratedAlwaysColumn
					? GeneratedAlways<S>
					: PK extends true
						? ColumnType<S, I, U>
						: OptionalNullableColumnType<S, I, U>
		: T extends SerialColumn<infer S, infer U>
			? GeneratedColumnType<S, U, U>
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
	? // eslint-disable-next-line @typescript-eslint/no-empty-object-type
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
	? T extends
			| WithDefaultColumn
			| SerialColumn<unknown, unknown>
			| GeneratedColumn
		? InferZodType<T, PK, true>
		: InferZodType<T, PK, false>
	: T extends NonNullableColumn & WithDefaultColumn
		? InferZodType<T, PK, true>
		: T extends NonNullableColumn
			? InferZodType<T, PK, false>
			: InferZodType<T, PK, true>;

type InferZodType<
	T extends
		| PgColumn<unknown, unknown, unknown>
		| SerialColumn<unknown, unknown>,
	PK extends boolean,
	Optional extends boolean = false,
> = z.ZodType<
	T extends SerialColumn<unknown, unknown>
		? SelectType<InferColumType<T, PK>> | undefined
		: T extends GeneratedAlwaysColumn
			? never
			: T extends PgBytea
				?
						| SelectType<InferColumType<T, PK>>
						| string
						| (Optional extends true ? undefined : never)
				:
						| SelectType<InferColumType<T, PK>>
						| (Optional extends true ? undefined : never),
	z.ZodTypeDef,
	InsertType<InferColumType<T, PK>>
>;
