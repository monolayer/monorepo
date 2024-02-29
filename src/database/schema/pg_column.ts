import { type ColumnDataType, type ColumnType, type Expression } from "kysely";
import type { ShallowRecord } from "node_modules/kysely/dist/esm/util/type-utils.js";
import { z } from "zod";
import {
	bigintSchema,
	columnSchemaFromNullAndUndefined,
	decimalSchema,
	jsonSchema,
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

type ZodType<T extends PgColumnTypes> = z.ZodType<
	T extends { nullable: false }
		? NonNullable<T["_columnType"]["__select__"]>
		: // biome-ignore lint/suspicious/noExplicitAny: <explanation>
		  T extends PgGeneratedColumn<any, any>
		  ? T["_columnType"]["__select__"]
		  : T["_columnType"]["__select__"] | null,
	z.ZodTypeDef,
	T["_generatedByDefault"] extends true
		? NonOptional<T["_columnType"]["__insert__"]>
		: T["_columnType"]["__insert__"]
>;

interface QueryDataType {
	/** @internal */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	readonly _columnType: ColumnType<any, any, any>;
	readonly _generatedAlways: boolean;
	readonly _generatedByDefault: boolean;
	readonly _hasDefault: boolean;
	_isPrimaryKey: boolean;
}

interface NativeDataType {
	/** @internal */
	readonly _native_data_type: DefaultValueDataTypes;
}

export class PgColumnBase<S, I, U> {
	protected info: Omit<ColumnInfo, "columnName" | "tableName">;

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	static info(column: PgColumnBase<any, any, any>) {
		return column.info;
	}

	constructor(dataType: ColumnDataType | "smallint") {
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

export class PgColumn<S, I, U = I>
	extends PgColumnBase<S, I, U>
	implements QueryDataType, NativeDataType
{
	declare readonly _columnType: ColumnType<S | null, I | null, U | null>;

	declare readonly _generatedAlways: boolean;
	declare readonly _generatedByDefault: boolean;

	declare readonly _hasDefault: boolean;
	declare _isPrimaryKey: boolean;

	declare readonly _zodType: typeof this._columnType.__select__;

	declare readonly _native_data_type: DefaultValueDataTypes;

	constructor(
		dataType: ColumnDataType | "smallint",
		postgresDataType: DefaultValueDataTypes,
	) {
		super(dataType);
		this._native_data_type = postgresDataType;
		this._generatedAlways = false;
		this._generatedByDefault = false;
		this._hasDefault = false;
		this._isPrimaryKey = false;
	}

	notNull() {
		this.info.isNullable = false;
		return this as this & {
			_columnType: ColumnType<S, I, U>;
			nullable: false;
		};
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
		return this as this & {
			_columnType: ColumnType<S, I | undefined | null, U | null>;
			_hasDefault: true;
		};
	}

	generatedByDefaultAsIdentity() {
		this.info.identity = ColumnIdentity.ByDefault;
		this.info.isNullable = false;
		return this as this & {
			_columnType: ColumnType<S, I | undefined, U>;
			_generatedAlways: false;
			_generatedByDefault: true;
		};
	}

	generatedAlwaysAsIdentity() {
		this.info.identity = ColumnIdentity.Always;
		this.info.isNullable = false;
		return this as this & {
			_columnType: ColumnType<S, never, never>;
			_generatedAlways: true;
			_generatedByDefault: false;
		};
	}

	schemaWithoptions<T extends z.ZodTypeAny>(base: T) {
		if (!this._isPrimaryKey && this.info.isNullable) {
			return base.nullable();
		}
		return base;
	}
}

export class PgGeneratedColumn<T, U>
	extends PgColumnBase<NonNullable<T>, U, U>
	implements QueryDataType, NativeDataType
{
	declare readonly _columnType: ColumnType<T, U | undefined, U>;
	declare readonly _generatedAlways: false;
	declare readonly _generatedByDefault: true;
	declare readonly _hasDefault: boolean;
	declare readonly _native_data_type: DefaultValueDataTypes;
	declare _isPrimaryKey: boolean;

	constructor(
		dataType: "serial" | "bigserial",
		postgresDataType: DefaultValueDataTypes,
	) {
		super(dataType);
		this.info.isNullable = false;
		this._native_data_type = postgresDataType;
		this._generatedAlways = false;
		this._generatedByDefault = true;
		this._hasDefault = true;
		this._isPrimaryKey = false;
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

export class PgBoolean<
	S extends boolean,
	I extends boolean | Boolish,
> extends PgColumn<S, I> {
	constructor() {
		super("boolean", DefaultValueDataTypes.boolean);
	}

	defaultTo(value: I | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = value;
		} else {
			this.info.defaultValue = `${value}`;
		}
		return this as this & {
			_columnType: ColumnType<boolean, I | null, I | null>;
			_hasDefault: true;
		};
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
			.custom<boolean | Boolish | null>((val) => {
				if (val === undefined) return false;
				if (val === null) return true;
				if (typeof val === "boolean") return true;
				return testBoolish(val);
			})
			.transform(toBooleanOrNull);

		return base.refine((val) => {
			if (nullable && val === null) return true;
			if (!nullable && val === null) return false;
			return true;
		}) as unknown as ZodType<typeof this>;
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
		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
	}
}

export function bigint() {
	return new PgBigInt();
}

export class PgBigInt extends PgColumn<string, number | bigint | string> {
	constructor() {
		super("bigint", DefaultValueDataTypes.bigint);
	}

	zodSchema(): ZodType<typeof this> {
		const base = bigintSchema()
			.pipe(z.bigint().min(-9223372036854775808n).max(9223372036854775807n))
			.transform((val) => val.toString());

		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
	}
}

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

	zodSchema(): ZodType<typeof this> {
		return bigintSchema()
			.pipe(z.bigint().min(1n).max(9223372036854775807n))
			.transform((val) => val.toString()) as unknown as ZodType<typeof this>;
	}
}

export function bytea() {
	return new PgBytea();
}

export type NestedRecord = {
	[k: string]: string | number | boolean | NestedRecord;
};

type ByteaZodType<T extends PgBytea> = z.ZodType<
	T extends { nullable: false } ? Buffer | string : Buffer | string | null,
	z.ZodTypeDef,
	Buffer | string | null
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
		return this as this & {
			_columnType: ColumnType<
				Buffer,
				Buffer | string | null,
				Buffer | string | null
			>;
			_hasDefault: true;
		};
	}

	zodSchema(): ByteaZodType<typeof this> {
		const nullable = !this._isPrimaryKey && this.info.isNullable === true;
		const base = z.custom<string | Buffer | null>((val) => {
			if (!nullable && val === null) return false;
			if (val === undefined) return false;
			if (
				typeof val === "string" ||
				val?.constructor.name === "Buffer" ||
				val === null
			) {
				return true;
			}
			return false;
		});
		return base as ByteaZodType<typeof this>;
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
		const base = z.date().or(z.string().pipe(z.coerce.date()));
		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
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
		const base = variablePrecisionSchema(-1e308, 1e308);
		return this.schemaWithoptions(base).transform((val) =>
			val === null ? val : val.toString(),
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
		const base = variablePrecisionSchema(-1e37, 1e37);
		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
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
		const base = variablePrecisionSchema(-1e308, 1e308);
		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
	}
}

export function int2() {
	return new PgInt2();
}

export class PgInt2 extends PgColumn<number, number | string> {
	constructor() {
		super("smallint", DefaultValueDataTypes.smallint);
	}

	zodSchema(): ZodType<typeof this> {
		const base = wholeNumberSchema(-32768, 32767);
		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
	}
}

export function int4() {
	return new PgInt4();
}

export class PgInt4 extends PgColumn<number, number | string> {
	constructor() {
		super("integer", DefaultValueDataTypes.integer);
	}

	defaultTo(value: number | string | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = value;
		} else {
			this.info.defaultValue = `${value}`;
		}
		return this as this & {
			_columnType: ColumnType<
				number,
				number | string | undefined | null,
				number | string | null
			>;
			_hasDefault: true;
		};
	}

	zodSchema(): ZodType<typeof this> {
		const base = wholeNumberSchema(-2147483648, 2147483647);
		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
	}
}

export function int8() {
	return new PgInt8();
}

export class PgInt8 extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("bigint", DefaultValueDataTypes.bigint);
	}

	zodSchema(): ZodType<typeof this> {
		const base = bigintSchema().pipe(
			z.coerce.bigint().min(-9223372036854775808n).max(9223372036854775807n),
		);
		return this.schemaWithoptions(base).transform((val) =>
			val !== null ? Number(val) : val,
		) as unknown as ZodType<typeof this>;
	}
}

export function integer() {
	return new PgInteger();
}

export class PgInteger extends PgColumn<number, number | string> {
	constructor() {
		super("integer", DefaultValueDataTypes.integer);
	}

	defaultTo(value: number | string | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = value;
		} else {
			this.info.defaultValue = `${value}`;
		}
		return this as this & {
			_columnType: ColumnType<
				number,
				number | string | undefined | null,
				number | string | null
			>;
			_hasDefault: true;
		};
	}

	zodSchema(): ZodType<typeof this> {
		const base = wholeNumberSchema(-2147483648, 2147483647);
		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
	}
}

export function json() {
	return new PgJson();
}

export type JsonArray = JsonValue[];

export type JsonObject = {
	[K in string]?: JsonValue;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

type JsonZodType<T extends PgJson | PgJsonB> = z.ZodType<
	T extends { nullable: false }
		? // biome-ignore lint/suspicious/noExplicitAny: <explanation>
		  string | number | boolean | Record<string, any>
		: // biome-ignore lint/suspicious/noExplicitAny: <explanation>
		  string | number | boolean | Record<string, any> | null,
	z.ZodTypeDef,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	string | number | boolean | Record<string, any> | null
>;

export class PgJson extends PgColumn<JsonValue, string> {
	constructor() {
		super("json", DefaultValueDataTypes.json);
	}

	zodSchema(): JsonZodType<typeof this> {
		const base = jsonSchema();
		return this.schemaWithoptions(base) as unknown as JsonZodType<typeof this>;
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
		const base = jsonSchema();
		return this.schemaWithoptions(base) as unknown as JsonZodType<typeof this>;
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
		const base = variablePrecisionSchema(-1e37, 1e37);
		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
	}
}

export function serial() {
	return new PgSerial();
}

export class PgSerial extends PgGeneratedColumn<number, number | string> {
	constructor() {
		super("serial", DefaultValueDataTypes.serial);
	}

	zodSchema() {
		return z
			.number()
			.or(z.string())
			.pipe(z.coerce.number().min(1).max(2147483648));
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
		return this as this & {
			_columnType: ColumnType<string, string | undefined | null, string | null>;
			_hasDefault: true;
		};
	}

	zodSchema(): ZodType<typeof this> {
		const base = z.string().uuid();
		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
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
		if (this.info.characterMaximumLength !== null) {
			return this.schemaWithoptions(
				z.string().max(this.info.characterMaximumLength),
			) as unknown as ZodType<typeof this>;
		}
		return this.schemaWithoptions(z.string()) as unknown as ZodType<
			typeof this
		>;
	}
}

export function char(maximumLength?: number) {
	return new PgChar("char", maximumLength ? maximumLength : 1);
}

export class PgChar extends PgColumnWithMaximumLength<string, string> {
	zodSchema(): ZodType<typeof this> {
		if (this.info.characterMaximumLength !== null) {
			return this.schemaWithoptions(
				z.string().max(this.info.characterMaximumLength),
			) as unknown as ZodType<typeof this>;
		}
		return this.schemaWithoptions(z.string()) as unknown as ZodType<
			typeof this
		>;
	}
}

type DateTimePrecision = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type PgColumnWithPrecisionDataType =
	| "time"
	| "timetz"
	| "timestamp"
	| "timestamptz";

export class PgColumnWithPrecision<T, U> extends PgColumn<T, U> {
	constructor(
		dataType: PgColumnWithPrecisionDataType,
		precision?: DateTimePrecision,
	) {
		const postgresDataType =
			dataType === "time"
				? DefaultValueDataTypes["time without time zone"]
				: dataType === "timetz"
				  ? DefaultValueDataTypes["time with time zone"]
				  : dataType === "timestamp"
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

const TIME_REGEX =
	/^((?:\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:[+-]\d{1,2}(?::?\d{2})?)?)|(\d{6}(?:[+-]\d{2}(?::?\d{2}){0,2})?))$/;

export function time(precision?: DateTimePrecision) {
	return new PgTime("time", precision);
}

export class PgTime extends PgColumnWithPrecision<string, string> {
	zodSchema(): ZodType<typeof this> {
		const base = z.string().regex(TIME_REGEX);
		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
	}
}

export function timetz(precision?: DateTimePrecision) {
	return new PgTimeTz("timetz", precision);
}

export class PgTimeTz extends PgColumnWithPrecision<string, string> {
	zodSchema(): ZodType<typeof this> {
		const base = z.string().regex(TIME_REGEX);
		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
	}
}

export function timestamp(precision?: DateTimePrecision) {
	return new PgTimestamp("timestamp", precision);
}

export class PgTimestamp extends PgColumnWithPrecision<Date, Date | string> {
	zodSchema(): ZodType<typeof this> {
		const base = z.date().or(z.string().pipe(z.coerce.date()));
		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
	}
}

export function timestamptz(precision?: DateTimePrecision) {
	return new PgTimestampTz("timestamptz", precision);
}

export class PgTimestampTz extends PgColumnWithPrecision<Date, Date | string> {
	zodSchema(): ZodType<typeof this> {
		const base = z.date().or(z.string().pipe(z.coerce.date()));
		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
	}
}

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
		const base = decimalSchema(
			this.info.numericPrecision,
			this.info.numericScale,
		);
		return this.schemaWithoptions(base) as unknown as ZodType<typeof this>;
	}
}

export function pgEnum<N extends string, T extends string[]>(
	name: N,
	values: [...T],
): PgEnum<N, T[number]> {
	return new PgEnum(name, values as unknown as T[number]);
}

export class PgEnum<
	N,
	T,
	S = string | null,
	I = string | null | undefined,
	U = string | null,
> {
	declare readonly _columnType: ColumnType<S, I, U>;
	declare readonly _generatedAlways: boolean;
	declare readonly _generatedByDefault: boolean;
	declare readonly _hasDefault: boolean;
	declare _isPrimaryKey: boolean;

	readonly values: T;
	readonly name: N;
	readonly info: Omit<ColumnInfo, "columnName" | "tableName">;

	constructor(name: N, values: T) {
		this.values = values;
		this.name = name;
		this.info = {
			dataType: name as string,
			isNullable: true,
			defaultValue: null,
			characterMaximumLength: null,
			numericPrecision: null,
			numericScale: null,
			datetimePrecision: null,
			renameFrom: null,
			identity: null,
			enum: true,
		};
		this._generatedAlways = false;
		this._generatedByDefault = false;
		this._hasDefault = false;
		this._isPrimaryKey = false;
	}

	notNull() {
		this.info.isNullable = false;
		return this as this & {
			_columnType: ColumnType<string, string, string>;
			nullable: false;
		};
	}

	defaultTo(value: string) {
		this.info.defaultValue = `'${value}'::${this.info.dataType}`;
		return this as this & {
			_columnType: ColumnType<string, string | undefined, string>;
			_hasDefault: true;
		};
	}

	renameFrom(name: string) {
		this.info.renameFrom = name;
		return this;
	}

	zodSchema(): EnumZodyType<typeof this> {
		const enumValues = this.values as unknown as [string, ...string[]];
		const base = z.null().or(z.enum(enumValues));
		const schema: z.ZodType<string | null, z.ZodTypeDef, string | null> =
			columnSchemaFromNullAndUndefined(
				this._isPrimaryKey,
				this.info.isNullable,
				base,
			);
		return schema as unknown as EnumZodyType<typeof this>;
	}
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type EnumZodyType<T extends PgEnum<any, any, any, any, any>> = z.ZodType<
	T extends { nullable: false }
		? NonNullable<T["_columnType"]["__select__"]>
		: T["_columnType"]["__select__"],
	z.ZodTypeDef,
	NonOptional<T["_columnType"]["__insert__"]>
>;

type NonOptional<T> = Exclude<T, undefined>;

export type PgColumnTypes =
	| PgBigInt
	| PgBigSerial
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	| PgBoolean<any, any>
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
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	| PgEnum<string, any, any, any, any>;

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
