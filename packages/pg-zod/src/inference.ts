import type { ColumnRecord } from "@monorepo/pg/schema/column.js";
import type {
	PgColumn,
	SerialColumn,
} from "@monorepo/pg/schema/column/column.js";
import type { PgBytea } from "@monorepo/pg/schema/column/data-types/bytea.js";
import type {
	GeneratedAlwaysColumn,
	GeneratedColumn,
	NonNullableColumn,
	WithDefaultColumn,
} from "@monorepo/pg/schema/column/types.js";
import type { z } from "zod";

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
		? T extends GeneratedAlwaysColumn
			? InferZodType<T, PK>
			: z.ZodOptional<InferZodType<T, PK>>
		: InferZodType<T, PK>
	: T extends
				| WithDefaultColumn
				| SerialColumn<unknown, unknown>
				| GeneratedColumn
		? T extends GeneratedAlwaysColumn
			? InferZodType<T, PK>
			: z.ZodOptional<InferZodType<T, PK>>
		: T extends NonNullableColumn & WithDefaultColumn
			? z.ZodOptional<InferZodType<T, PK>>
			: T extends NonNullableColumn
				? InferZodType<T, PK>
				: z.ZodOptional<InferZodType<T, PK>>;

type InferSelectType<T extends PgColumn<unknown, unknown, unknown>> =
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends PgColumn<infer S, any, any>
		? T extends PgBytea
			? string | Buffer
			: S
		: never;

type InferInsertType<T extends PgColumn<unknown, unknown, unknown>> =
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends PgColumn<any, infer I, any>
		? T extends PgBytea
			? string | Buffer
			: I
		: never;

type InferSelect<
	T extends
		| PgColumn<unknown, unknown, unknown>
		| SerialColumn<unknown, unknown>,
	PK extends boolean,
> =
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends PgColumn<any, any, any>
		? T extends NonNullableColumn
			? T extends WithDefaultColumn
				? InferSelectType<T>
				: T extends GeneratedAlwaysColumn
					? InferSelectType<T>
					: T extends GeneratedColumn
						? InferSelectType<T>
						: InferSelectType<T>
			: T extends WithDefaultColumn
				? PK extends true
					? InferSelectType<T>
					: InferSelectType<T> | null
				: T extends GeneratedAlwaysColumn
					? never
					: PK extends true
						? InferSelectType<T>
						: InferSelectType<T> | null
		: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			T extends SerialColumn<infer S, any>
			? S
			: never;

type InferZodType<
	T extends
		| PgColumn<unknown, unknown, unknown>
		| SerialColumn<unknown, unknown>,
	PK extends boolean,
> = z.ZodType<InferSelect<T, PK>, z.ZodTypeDef, InferInsert<T, PK>>;

type InferInsert<
	T extends
		| PgColumn<unknown, unknown, unknown>
		| SerialColumn<unknown, unknown>,
	PK extends boolean,
> =
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends PgColumn<any, infer I, any>
		? T extends NonNullableColumn
			? T extends WithDefaultColumn
				? InferInsertType<T>
				: T extends GeneratedAlwaysColumn
					? never
					: T extends GeneratedColumn
						? I
						: InferInsertType<T>
			: T extends WithDefaultColumn
				? PK extends true
					? InferInsertType<T>
					: InferInsertType<T> | null
				: T extends GeneratedAlwaysColumn
					? never
					: PK extends true
						? InferInsertType<T>
						: InferInsertType<T> | null
		: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			T extends SerialColumn<any, infer U>
			? U
			: never;
