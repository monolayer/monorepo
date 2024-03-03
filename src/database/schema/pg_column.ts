import {
	type ColumnType,
	type Expression,
	type InsertType,
	type SelectType,
} from "kysely";
import type { GeneratedAlways, Simplify } from "kysely";
import type { ShallowRecord } from "node_modules/kysely/dist/esm/util/type-utils.js";
import { ZodIssueCode, z } from "zod";
import {
	baseSchema,
	bigintSchema,
	dateSchema,
	decimalSchema,
	finishSchema,
	jsonSchema,
	stringSchema,
	variablePrecisionSchema,
	wholeNumberSchema,
} from "./zod.js";

export type ColumnInfo = {
	columnName: string | null;
	tableName: string | null;
	dataType: string;
	defaultValue: unknown | Expression<unknown> | null;
	isNullable: boolean;
	originalIsNullable?: boolean | null;
	numericPrecision: number | null;
	numericScale: number | null;
	characterMaximumLength: number | null;
	datetimePrecision: number | null;
	renameFrom: string | null;
	identity: ColumnIdentity.Always | ColumnIdentity.ByDefault | null;
	enum: boolean;
};

export enum ColumnIdentity {
	Always = "ALWAYS",
	ByDefault = "BY DEFAULT",
}

export enum ColumnUnique {
	NullsDistinct = "NullsDistinct",
	NullsNotDistinct = "NullsNotDistinct",
}

export enum DefaultValueDataTypes {
	bigint = "bigint",
	bigserial = "bigserial",
	bit = "bit",
	"bit varying" = "bit varying",
	boolean = "boolean",
	box = "box",
	bytea = "bytea",
	character = "character(1)",
	"character varying" = "character varying",
	cidr = "cidr",
	circle = "circle",
	date = "date",
	"double precision" = "double precision",
	inet = "inet",
	integer = "integer",
	interval = "interval",
	json = "json",
	jsonb = "jsonb",
	line = "line",
	lseg = "lseg",
	macaddr = "macaddr",
	macaddr8 = "macaddr8",
	money = "money",
	numeric = "numeric",
	path = "path",
	pg_lsn = "pg_lsn",
	pg_snapshot = "pg_snapshot",
	point = "point",
	polygon = "polygon",
	real = "real",
	smallint = "smallint",
	smallserial = "smallserial",
	serial = "serial",
	text = "text",
	"time without time zone" = "time without time zone",
	"time with time zone" = "time with time zone",
	"timestamp without time zone" = "timestamp without time zone",
	"timestamp with time zone" = "timestamp with time zone",
	tsquery = "tsquery",
	tsvector = "tsvector",
	txid_snapshot = "txid_snapshot",
	uuid = "uuid",
	xml = "xml",
}

export class PgColumnBase<S, I, U> {
	protected declare readonly infer: ColumnType<S, I, U>;
	protected info: Omit<ColumnInfo, "columnName" | "tableName">;

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	static info(column: PgColumnBase<any, any, any>) {
		return column.info;
	}

	constructor(dataType: string) {
		this.info = {
			dataType: dataType,
			isNullable: true,
			defaultValue: null,
			characterMaximumLength: null,
			numericPrecision: null,
			numericScale: null,
			datetimePrecision: null,
			renameFrom: null,
			identity: null,
			enum: false,
		};
	}

	renameFrom(name: string) {
		this.info.renameFrom = name;
		return this;
	}
}

export class PgColumn<S, I, U = I> extends PgColumnBase<S, I, U> {
	protected _isPrimaryKey: boolean;

	protected readonly _native_data_type: DefaultValueDataTypes;

	constructor(dataType: string, postgresDataType: DefaultValueDataTypes) {
		super(dataType);
		this._native_data_type = postgresDataType;
		this._isPrimaryKey = false;
	}

	notNull() {
		this.info.isNullable = false;
		return this as this & NonNullableColumn;
	}

	primaryKey() {
		this._isPrimaryKey = true;
		return this as this & NonNullableColumn;
	}

	defaultTo(value: I | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = value;
		} else {
			let val: unknown = value;
			if (val instanceof Date) val = val.toISOString();
			if (typeof val === "string" && this instanceof PgDate)
				val = val.split("T")[0];
			this.info.defaultValue = `'${val}'::${this._native_data_type}`;
		}
		return this as this & WithDefaultColumn;
	}
}

export class PgGeneratedColumn<T, U> extends PgColumnBase<T, U, U> {
	declare readonly _generatedByDefault: "yes";
	protected readonly _native_data_type: DefaultValueDataTypes;
	protected _isPrimaryKey: boolean;

	constructor(
		dataType: "serial" | "bigserial",
		postgresDataType: DefaultValueDataTypes,
	) {
		super(dataType);
		this.info.isNullable = false;
		this._native_data_type = postgresDataType;
		this._isPrimaryKey = false;
	}

	primaryKey() {
		this._isPrimaryKey = true;
		return this as this & NonNullableColumn;
	}
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type ZodTypeGenerated<T extends PgGeneratedColumn<any, any>> =
	T extends PgGeneratedColumn<infer S, infer I>
		? z.ZodType<
				SelectType<GeneratedColumnType<S, I, I>>,
				z.ZodTypeDef,
				Exclude<InsertType<GeneratedColumnType<S, I, I>>, undefined>
		  >
		: never;

export function bigserial() {
	return new PgBigSerial();
}

export class PgBigSerial extends PgGeneratedColumn<
	string,
	number | bigint | string
> {
	constructor() {
		super("bigserial", DefaultValueDataTypes.bigserial);
	}

	zodSchema(): ZodTypeGenerated<typeof this> {
		return bigintSchema(!this._isPrimaryKey && this.info.isNullable === true)
			.pipe(z.bigint().min(1n).max(9223372036854775807n))
			.transform((val) => val.toString()) as unknown as ZodTypeGenerated<
			typeof this
		>;
	}
}

export function serial() {
	return new PgSerial();
}

export class PgSerial extends PgGeneratedColumn<number, number | string> {
	constructor() {
		super("serial", DefaultValueDataTypes.serial);
	}

	zodSchema(): ZodTypeGenerated<typeof this> {
		return wholeNumberSchema(
			1,
			2147483647,
			!this._isPrimaryKey && this.info.isNullable === true,
		) as unknown as ZodTypeGenerated<typeof this>;
	}
}

export class IdentifiableColumn<S, I, U = I> extends PgColumn<S, I, U> {
	generatedByDefaultAsIdentity() {
		this.info.identity = ColumnIdentity.ByDefault;
		this.info.isNullable = false;
		return this as this & GeneratedColumn;
	}

	generatedAlwaysAsIdentity() {
		this.info.identity = ColumnIdentity.Always;
		this.info.isNullable = false;
		return this as this & GeneratedAlwaysColumn;
	}
}

export function boolean() {
	return new PgBoolean();
}

export type Boolish =
	| "true"
	| "false"
	| "yes"
	| "no"
	| 1
	| 0
	| "1"
	| "0"
	| "on"
	| "off";

export class PgBoolean extends PgColumn<boolean, boolean | Boolish> {
	constructor() {
		super("boolean", DefaultValueDataTypes.boolean);
	}

	defaultTo(value: boolean | Boolish | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = value;
		} else {
			this.info.defaultValue = `${value}`;
		}
		return this as this & WithDefaultColumn;
	}

	zodSchema(): ZodType<typeof this> {
		const testBoolish = (val: unknown): val is Boolish => {
			switch (val) {
				case "true":
				case "false":
				case "yes":
				case "no":
				case 1:
				case 0:
				case "1":
				case "0":
				case "on":
				case "off":
				case true:
				case false:
				case null:
					return true;
				default:
					return false;
			}
		};

		const toBooleanOrNull = (val: boolean | Boolish | null): boolean | null => {
			switch (val) {
				case true:
				case "true":
				case 1:
				case "1":
				case "yes":
				case "on":
					return true;
				case false:
				case "false":
				case 0:
				case "0":
				case "no":
				case "off":
					return false;
				case null:
					return null;
			}
		};

		const nullable = !this._isPrimaryKey && this.info.isNullable;

		const base = z
			.any()
			.superRefine((data, ctx) => {
				if (!testBoolish(data)) {
					if (data === undefined) {
						ctx.addIssue({
							code: ZodIssueCode.invalid_type,
							expected: "boolean",
							received: "undefined",
						});
					} else {
						ctx.addIssue({
							code: ZodIssueCode.custom,
							message: "Invalid boolean",
						});
					}
					return z.NEVER;
				}
			})
			.transform(toBooleanOrNull)
			.superRefine((val, ctx) => {
				if (!nullable && val === null) {
					ctx.addIssue({
						code: ZodIssueCode.invalid_type,
						expected: "boolean",
						received: "null",
					});
					return z.NEVER;
				}
			});
		if (nullable) {
			return base.optional().superRefine((val, ctx) => {
				console.log(ctx.path, "VAL", val);
			}) as unknown as ZodType<typeof this>;
		}
		return base as unknown as ZodType<typeof this>;
	}
}

export function text() {
	return new PgText();
}

export class PgText extends PgColumn<string, string> {
	constructor() {
		super("text", DefaultValueDataTypes.text);
	}

	zodSchema(): ZodType<typeof this> {
		const base = z.string();
		return finishSchema(
			!this._isPrimaryKey && this.info.isNullable,
			base,
		) as unknown as ZodType<typeof this>;
	}
}

export function bigint() {
	return new PgBigInt();
}

export class PgBigInt extends IdentifiableColumn<
	string,
	number | bigint | string
> {
	constructor() {
		super("bigint", DefaultValueDataTypes.bigint);
	}

	zodSchema(): ZodType<typeof this> {
		if (this.info.identity === ColumnIdentity.Always) {
			return z.never() as unknown as ZodType<typeof this>;
		}
		const base = bigintSchema(
			!this._isPrimaryKey && this.info.isNullable === true,
		)
			.pipe(z.bigint().min(-9223372036854775808n).max(9223372036854775807n))
			.transform((val) => val.toString());

		return finishSchema(
			!this._isPrimaryKey && this.info.isNullable,
			base,
		) as unknown as ZodType<typeof this>;
	}
}

export function bytea() {
	return new PgBytea();
}

export type NestedRecord = {
	[k: string]: string | number | boolean | NestedRecord;
};

type ByteaZodType<T extends PgBytea> = z.ZodType<
	T extends NonNullableColumn
		? SelectType<InferColumType<T>> | string
		: T extends GeneratedAlwaysColumn
		  ? never
		  : SelectType<InferColumType<T>> | string | undefined,
	z.ZodTypeDef,
	InsertType<InferColumType<T>>
>;

export class PgBytea extends PgColumn<Buffer, Buffer | string> {
	constructor() {
		super("bytea", DefaultValueDataTypes.bytea);
	}

	defaultTo(value: Buffer | string | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = value;
		} else {
			const valueType = typeof value;
			switch (valueType) {
				case "string":
				case "boolean":
				case "number": {
					const hexVal = Buffer.from(String(value)).toString("hex");
					this.info.defaultValue = `'\\x${hexVal}'::${this._native_data_type}`;
					break;
				}
				case "object": {
					if (value instanceof Buffer) {
						const hexVal = value.toString("hex");
						this.info.defaultValue = `'\\x${hexVal}'::${this._native_data_type}`;
					} else {
						const hexVal = Buffer.from(JSON.stringify(value)).toString("hex");
						this.info.defaultValue = `'\\x${hexVal}'::${this._native_data_type}`;
					}
					break;
				}
			}
		}
		return this as this & WithDefaultColumn;
	}

	zodSchema(): ByteaZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = baseSchema(
			isNullable,
			"Expected Buffer or string",
		).superRefine((val, ctx) => {
			if (
				typeof val !== "string" &&
				val?.constructor.name !== "Buffer" &&
				val !== null
			) {
				ctx.addIssue({
					code: ZodIssueCode.custom,
					message: `Expected Buffer or string, received ${typeof val}`,
				});
				return z.NEVER;
			}
		});

		return finishSchema(isNullable, base) as unknown as ByteaZodType<
			typeof this
		>;
	}
}

export function date() {
	return new PgDate();
}

export class PgDate extends PgColumn<Date, Date | string> {
	constructor() {
		super("date", DefaultValueDataTypes.date);
	}

	zodSchema(): ZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = baseSchema(
			isNullable,
			"Expected Date or String that can coerce to Date",
		).pipe(z.coerce.date());
		return finishSchema(isNullable, base) as unknown as ZodType<typeof this>;
	}
}

export function doublePrecision() {
	return new PgDoublePrecision();
}

export class PgDoublePrecision extends PgColumn<
	string,
	number | bigint | string
> {
	constructor() {
		super("double precision", DefaultValueDataTypes["double precision"]);
	}

	zodSchema(): ZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = variablePrecisionSchema(-1e308, 1e308, isNullable);
		return finishSchema(isNullable, base).transform((val) =>
			val === null || val === undefined ? val : val.toString(),
		) as unknown as ZodType<typeof this>;
	}
}

export function float4() {
	return new PgFloat4();
}

export class PgFloat4 extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("real", DefaultValueDataTypes.real);
	}

	zodSchema(): ZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = variablePrecisionSchema(-1e37, 1e37, isNullable);
		return finishSchema(isNullable, base) as unknown as ZodType<typeof this>;
	}
}

export function float8() {
	return new PgFloat8();
}

export class PgFloat8 extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("double precision", DefaultValueDataTypes["double precision"]);
	}

	zodSchema(): ZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = variablePrecisionSchema(-1e308, 1e308, isNullable);
		return finishSchema(isNullable, base) as unknown as ZodType<typeof this>;
	}
}

export function int2() {
	return new PgInt2();
}

export class PgInt2 extends IdentifiableColumn<number, number | string> {
	constructor() {
		super("smallint", DefaultValueDataTypes.smallint);
	}

	zodSchema(): ZodType<typeof this> {
		if (this.info.identity === ColumnIdentity.Always) {
			return z.never() as unknown as ZodType<typeof this>;
		}
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;

		const base = wholeNumberSchema(-32768, 32767, isNullable);
		return finishSchema(isNullable, base) as unknown as ZodType<typeof this>;
	}
}

export function int4() {
	return new PgInt4();
}

export class PgInt4 extends IdentifiableColumn<number, number | string> {
	constructor() {
		super("integer", DefaultValueDataTypes.integer);
	}

	defaultTo(value: number | string | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = value;
		} else {
			this.info.defaultValue = `${value}`;
		}
		return this as this & WithDefaultColumn;
	}

	zodSchema(): ZodType<typeof this> {
		if (this.info.identity === ColumnIdentity.Always) {
			return z.never() as unknown as ZodType<typeof this>;
		}
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = wholeNumberSchema(
			-2147483648,
			2147483647,
			!this._isPrimaryKey && this.info.isNullable === true,
		);
		return finishSchema(isNullable, base) as unknown as ZodType<typeof this>;
	}
}

export function int8() {
	return new PgInt8();
}

export class PgInt8 extends IdentifiableColumn<
	number,
	number | bigint | string
> {
	constructor() {
		super("bigint", DefaultValueDataTypes.bigint);
	}

	zodSchema(): ZodType<typeof this> {
		if (this.info.identity === ColumnIdentity.Always) {
			return z.never() as unknown as ZodType<typeof this>;
		}
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = bigintSchema(
			!this._isPrimaryKey && this.info.isNullable === true,
		).pipe(
			z.coerce.bigint().min(-9223372036854775808n).max(9223372036854775807n),
		);
		return finishSchema(isNullable, base).transform((val) =>
			val !== null ? Number(val) : val,
		) as unknown as ZodType<typeof this>;
	}
}

export function integer() {
	return new PgInteger();
}

export class PgInteger extends IdentifiableColumn<number, number | string> {
	constructor() {
		super("integer", DefaultValueDataTypes.integer);
	}

	defaultTo(value: number | string | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = value;
		} else {
			this.info.defaultValue = `${value}`;
		}
		return this as this & WithDefaultColumn;
	}

	zodSchema(): ZodType<typeof this> {
		if (this.info.identity === ColumnIdentity.Always) {
			return z.never() as unknown as ZodType<typeof this>;
		}
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;

		const base = wholeNumberSchema(
			-2147483648,
			2147483647,
			!this._isPrimaryKey && this.info.isNullable === true,
		);
		return finishSchema(isNullable, base) as unknown as ZodType<typeof this>;
	}
}

export function json() {
	return new PgJson();
}

export type JsonArray = JsonValue[];

export type JsonObject = {
	[K in string]?: JsonValue;
};

export type JsonPrimitive = boolean | number | string;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type ZodJson = string | number | boolean | Record<string, any>;

type JsonZodType<T extends PgJson | PgJsonB> = z.ZodType<
	T extends NonNullableColumn
		? ZodJson
		: T extends GeneratedAlwaysColumn
		  ? never
		  : ZodJson | null | undefined,
	z.ZodTypeDef,
	T extends NonNullableColumn ? ZodJson : ZodJson | null | undefined
>;

export class PgJson extends PgColumn<
	JsonValue,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	string | number | boolean | Record<string, any>
> {
	constructor() {
		super("json", DefaultValueDataTypes.json);
	}

	zodSchema(): JsonZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = jsonSchema(isNullable);
		return finishSchema(isNullable, base) as unknown as JsonZodType<
			typeof this
		>;
	}
}

export function jsonb() {
	return new PgJsonB();
}

export class PgJsonB extends PgColumn<JsonValue, string> {
	constructor() {
		super("jsonb", DefaultValueDataTypes.jsonb);
	}

	zodSchema(): JsonZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = jsonSchema(isNullable);
		return finishSchema(isNullable, base) as unknown as JsonZodType<
			typeof this
		>;
	}
}

export function real() {
	return new PgReal();
}

export class PgReal extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("real", DefaultValueDataTypes.real);
	}

	zodSchema(): ZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = variablePrecisionSchema(
			-1e37,
			1e37,
			!this._isPrimaryKey && this.info.isNullable === true,
		);
		return finishSchema(isNullable, base) as unknown as ZodType<typeof this>;
	}
}

export function uuid() {
	return new PgUuid();
}

export class PgUuid extends PgColumn<string, string> {
	constructor() {
		super("uuid", DefaultValueDataTypes.uuid);
	}

	defaultTo(value: string | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = value;
		} else {
			this.info.defaultValue = `'${value.toLowerCase()}'::uuid`;
		}
		return this as this & WithDefaultColumn;
	}

	zodSchema(): ZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = baseSchema(
			!this._isPrimaryKey && this.info.isNullable === true,
			"Expected uuid",
		).pipe(z.string().uuid());
		return finishSchema(isNullable, base) as unknown as ZodType<typeof this>;
	}
}

export class PgColumnWithMaximumLength<T, U> extends PgColumn<T, U> {
	constructor(dataType: "varchar" | "char", maximumLength?: number) {
		const postgresDataType =
			dataType === "varchar"
				? DefaultValueDataTypes["character varying"]
				: DefaultValueDataTypes.character;
		if (maximumLength !== undefined) {
			super(`${dataType}(${maximumLength})`, postgresDataType);
			this.info.characterMaximumLength = maximumLength;
		} else {
			super(dataType, postgresDataType);
		}
	}
}

export function varchar(maximumLength?: number) {
	return new PgVarChar("varchar", maximumLength);
}

export class PgVarChar extends PgColumnWithMaximumLength<string, string> {
	zodSchema(): ZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		if (this.info.characterMaximumLength !== null) {
			return finishSchema(
				isNullable,
				z.string().max(this.info.characterMaximumLength),
			) as unknown as ZodType<typeof this>;
		}
		return finishSchema(isNullable, z.string()) as unknown as ZodType<
			typeof this
		>;
	}
}

export function char(maximumLength?: number) {
	return new PgChar("char", maximumLength ? maximumLength : 1);
}

export class PgChar extends PgColumnWithMaximumLength<string, string> {
	zodSchema(): ZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		if (this.info.characterMaximumLength !== null) {
			return finishSchema(
				isNullable,
				z.string().max(this.info.characterMaximumLength),
			) as unknown as ZodType<typeof this>;
		}
		return finishSchema(isNullable, z.string()) as unknown as ZodType<
			typeof this
		>;
	}
}

type DateTimePrecision = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export class PgTimeColumn<T, U> extends PgColumn<T, U> {
	constructor(dataType: "time" | "timetz", precision?: DateTimePrecision) {
		const postgresDataType =
			dataType === "time"
				? DefaultValueDataTypes["time without time zone"]
				: DefaultValueDataTypes["time with time zone"];
		if (precision !== undefined) {
			super(`${dataType}(${precision})`, postgresDataType);
			this.info.datetimePrecision = precision;
		} else {
			super(dataType, postgresDataType);
		}
	}
}

const TIME_REGEX =
	/^((?:\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:[+-]\d{1,2}(?::?\d{2})?)?)|(\d{6}(?:[+-]\d{2}(?::?\d{2}){0,2})?))$/;

export function time(precision?: DateTimePrecision) {
	return new PgTime("time", precision);
}

export class PgTime extends PgTimeColumn<string, string> {
	zodSchema(): ZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = stringSchema(
			"Expected string with time format",
			isNullable,
		).pipe(z.string().regex(TIME_REGEX, "Invalid time"));
		return finishSchema(isNullable, base) as unknown as ZodType<typeof this>;
	}
}

export class PgTimestampColumn<T, U> extends PgColumn<T, U> {
	constructor(
		dataType: "timestamp" | "timestamptz",
		precision?: DateTimePrecision,
	) {
		const postgresDataType =
			dataType === "timestamp"
				? DefaultValueDataTypes["timestamp without time zone"]
				: DefaultValueDataTypes["timestamp with time zone"];
		if (precision !== undefined) {
			super(`${dataType}(${precision})`, postgresDataType);
			this.info.datetimePrecision = precision;
		} else {
			super(dataType, postgresDataType);
		}
	}
}

export function timetz(precision?: DateTimePrecision) {
	return new PgTimeTz("timetz", precision);
}

export class PgTimeTz extends PgTimeColumn<string, string> {
	zodSchema(): ZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = stringSchema(
			"Expected string with time format",
			isNullable,
		).pipe(z.string().regex(TIME_REGEX, "Invalid time with time zone"));
		return finishSchema(isNullable, base) as unknown as ZodType<typeof this>;
	}
}

export function timestamp(precision?: DateTimePrecision) {
	return new PgTimestamp("timestamp", precision);
}

export class PgTimestamp extends PgTimestampColumn<Date, Date | string> {
	zodSchema(): DateZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = dateSchema(
			"Expected date or string with date format",
			isNullable,
		).pipe(z.coerce.date());
		return finishSchema(isNullable, base) as unknown as DateZodType<
			typeof this
		>;
	}
}

export function timestamptz(precision?: DateTimePrecision) {
	return new PgTimestampTz("timestamptz", precision);
}

export class PgTimestampTz extends PgTimestampColumn<Date, Date | string> {
	zodSchema(): DateZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = dateSchema(
			"Expected date or string with date format",
			isNullable,
		).pipe(z.coerce.date());

		return finishSchema(isNullable, base) as unknown as DateZodType<
			typeof this
		>;
	}
}

type DateZodType<T extends PgDate | PgTimestamp | PgTimestampTz> = z.ZodType<
	T extends NonNullableColumn
		? Date
		: T extends GeneratedAlwaysColumn
		  ? never
		  : Date | null | undefined,
	z.ZodTypeDef,
	T extends NonNullableColumn ? Date | string : Date | string | null | undefined
>;

export function numeric(precision?: number, scale?: number) {
	return new PgNumeric(precision, scale);
}

export class PgNumeric extends PgColumn<string, number | bigint | string> {
	constructor(precision?: number, scale = 0) {
		if (precision !== undefined) {
			super(`numeric(${precision}, ${scale})`, DefaultValueDataTypes.numeric);
			this.info.numericPrecision = precision;
			this.info.numericScale = scale;
		} else {
			super("numeric", DefaultValueDataTypes.numeric);
		}
	}

	zodSchema(): ZodType<typeof this> {
		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = decimalSchema(
			this.info.numericPrecision,
			this.info.numericScale,
			isNullable,
			"Expected bigint, number or string that can be converted to a number",
		);
		return finishSchema(isNullable, base) as unknown as ZodType<typeof this>;
	}
}

export function pgEnum<N extends string, T extends string[]>(
	name: N,
	values: [...T],
) {
	return new PgEnum(name, values as unknown as string[]);
}

export class PgEnum extends PgColumn<string, string> {
	protected readonly values: string[];

	constructor(name: string, values: string[]) {
		super(name, DefaultValueDataTypes.numeric);
		this.values = values;
		this.info.enum = true;
	}

	defaultTo(value: string) {
		this.info.defaultValue = `'${value}'::${this.info.dataType}`;
		return this as this & WithDefaultColumn;
	}

	zodSchema(): ZodType<typeof this> {
		const enumValues = this.values as unknown as [string, ...string[]];
		const errorMessage = `Expected ${enumValues
			.map((v) => `'${v}'`)
			.join(" | ")}`;

		const isNullable = !this._isPrimaryKey && this.info.isNullable === true;

		const base = baseSchema(isNullable, errorMessage).pipe(z.enum(enumValues));
		return finishSchema(isNullable, base) as unknown as ZodType<typeof this>;
	}
}

export type PgColumnTypes =
	| PgBigInt
	| PgBigSerial
	| PgBoolean
	| PgBytea
	| PgChar
	| PgDate
	| PgDoublePrecision
	| PgFloat4
	| PgFloat8
	| PgInt2
	| PgInt4
	| PgInt8
	| PgInteger
	| PgJson
	| PgJsonB
	| PgNumeric
	| PgReal
	| PgSerial
	| PgText
	| PgTime
	| PgTimeTz
	| PgTimestamp
	| PgTimestampTz
	| PgUuid
	| PgVarChar
	| PgEnum;

// From Kysely. To avoid bundling Kysely in client code.
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function isExpression(obj: unknown): obj is Expression<any> {
	return (
		isObject(obj) &&
		"expressionType" in obj &&
		typeof obj.toOperationNode === "function"
	);
}

function isObject(obj: unknown): obj is ShallowRecord<string, unknown> {
	return typeof obj === "object" && obj !== null;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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

type OptionalColumnType<S, I, U> = Simplify<ColumnType<S, I | undefined, U>>;
export type GeneratedColumnType<S, I, U> = OptionalColumnType<S, I, U>;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type ZodType<T extends PgColumn<any, any, any> | PgTimestamp | PgTimestampTz> =
	z.ZodType<
		T extends NonNullableColumn
			? SelectType<InferColumType<T>>
			: T extends GeneratedAlwaysColumn
			  ? never
			  : SelectType<InferColumType<T>> | null | undefined,
		z.ZodTypeDef,
		InsertType<InferColumType<T>>
	>;

export type WithDefaultColumn = {
	_hasDefault: "yes";
};

export type NonNullableColumn = { nullable: "no" };

export type GeneratedColumn = {
	_generatedByDefault: "yes";
	nullable: "no";
};

export type GeneratedAlwaysColumn = {
	_generatedAlways: "yes";
};
