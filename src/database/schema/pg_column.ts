import {
	type ColumnDataType,
	type ColumnType,
	type Expression,
	isExpression,
} from "kysely";

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

interface QueryDataType {
	/** @internal */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	readonly _columnType: ColumnType<any, any, any>;
	readonly _generatedAlways: boolean;
	readonly _hasDefault: boolean;
}

interface NativeDataType {
	/** @internal */
	readonly _native_data_type: DefaultValueDataTypes;
}

export class PgColumnBase<S, I, U> {
	protected info: Omit<ColumnInfo, "columnName" | "tableName">;

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
	declare readonly _columnType: ColumnType<
		S | null,
		I | undefined | null,
		U | null
	>;

	declare readonly _generatedAlways: boolean;
	declare readonly _hasDefault: boolean;

	declare readonly _native_data_type: DefaultValueDataTypes;

	constructor(
		dataType: ColumnDataType | "smallint",
		postgresDataType: DefaultValueDataTypes,
	) {
		super(dataType);
		this._native_data_type = postgresDataType;
		this._generatedAlways = false;
		this._hasDefault = false;
	}

	notNull() {
		this.info.isNullable = false;
		return this as this & {
			_columnType: ColumnType<S, I, U>;
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
		};
	}

	generatedAlwaysAsIdentity() {
		this.info.identity = ColumnIdentity.Always;
		this.info.isNullable = false;
		return this as this & {
			_columnType: ColumnType<S, never, never>;
			_generatedAlways: true;
		};
	}
}

export class PgGeneratedColumn<T, U>
	extends PgColumnBase<NonNullable<T>, U, U>
	implements QueryDataType, NativeDataType
{
	declare readonly _columnType: ColumnType<T, U | undefined, U>;
	declare readonly _generatedAlways: false;
	declare readonly _hasDefault: boolean;
	declare readonly _native_data_type: DefaultValueDataTypes;

	constructor(
		dataType: "serial" | "bigserial",
		postgresDataType: DefaultValueDataTypes,
	) {
		super(dataType);
		this.info.isNullable = false;
		this._native_data_type = postgresDataType;
		this._generatedAlways = false;
		this._hasDefault = true;
	}
}

export function boolean() {
	return new PgBoolean();
}

export class PgBoolean extends PgColumn<boolean, boolean> {
	constructor() {
		super("boolean", DefaultValueDataTypes.boolean);
	}

	defaultTo(value: boolean | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = value;
		} else {
			this.info.defaultValue = `${value}`;
		}
		return this as this & {
			_columnType: ColumnType<
				boolean,
				boolean | undefined | null,
				boolean | null
			>;
			_hasDefault: true;
		};
	}
}

export function text() {
	return new PgText();
}

export class PgText extends PgColumn<string, string> {
	constructor() {
		super("text", DefaultValueDataTypes.text);
	}
}

export function bigint() {
	return new PgBigInt();
}

export class PgBigInt extends PgColumn<string, number | bigint | string> {
	constructor() {
		super("bigint", DefaultValueDataTypes.bigint);
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
}

export function bytea() {
	return new PgBytea();
}

export type NestedRecord = {
	[k: string]: string | number | boolean | NestedRecord;
};

export class PgBytea extends PgColumn<
	Buffer,
	Buffer | string | boolean | number | NestedRecord
> {
	constructor() {
		super("bytea", DefaultValueDataTypes.bytea);
	}

	defaultTo(
		value:
			| Buffer
			| string
			| boolean
			| number
			| NestedRecord
			| Expression<unknown>,
	) {
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
				Buffer | string | boolean | number | NestedRecord | undefined | null,
				Buffer | string | boolean | number | NestedRecord | null
			>;
			_hasDefault: true;
		};
	}
}

export function date() {
	return new PgDate();
}

export class PgDate extends PgColumn<Date, Date | string> {
	constructor() {
		super("date", DefaultValueDataTypes.date);
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
}

export function float4() {
	return new PgFloat4();
}

export class PgFloat4 extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("real", DefaultValueDataTypes.real);
	}
}

export function float8() {
	return new PgFloat8();
}

export class PgFloat8 extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("double precision", DefaultValueDataTypes["double precision"]);
	}
}

export function int2() {
	return new PgInt2();
}

export class PgInt2 extends PgColumn<number, number | string> {
	constructor() {
		super("smallint", DefaultValueDataTypes.smallint);
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
}

export function int8() {
	return new PgInt8();
}

export class PgInt8 extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("bigint", DefaultValueDataTypes.bigint);
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
}

export function json() {
	return new PgJson();
}

type JsonArray = JsonValue[];

type JsonObject = {
	[K in string]?: JsonValue;
};

type JsonPrimitive = boolean | number | string | null;

type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export class PgJson extends PgColumn<JsonValue, string> {
	constructor() {
		super("json", DefaultValueDataTypes.json);
	}
}

export function jsonb() {
	return new PgJsonB();
}

export class PgJsonB extends PgColumn<JsonValue, string> {
	constructor() {
		super("jsonb", DefaultValueDataTypes.jsonb);
	}
}

export function real() {
	return new PgReal();
}

export class PgReal extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("real", DefaultValueDataTypes.real);
	}
}

export function serial() {
	return new PgSerial();
}

export class PgSerial extends PgGeneratedColumn<number, number | string> {
	constructor() {
		super("serial", DefaultValueDataTypes.serial);
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

export class PgVarChar extends PgColumnWithMaximumLength<string, string> {}

export function char(maximumLength?: number) {
	return new PgChar("char", maximumLength ? maximumLength : 1);
}

export class PgChar extends PgColumnWithMaximumLength<string, string> {}

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

export function time(precision?: DateTimePrecision) {
	return new PgTime("time", precision);
}

export class PgTime extends PgColumnWithPrecision<string, string> {}

export function timetz(precision?: DateTimePrecision) {
	return new PgTimeTz("timetz", precision);
}

export class PgTimeTz extends PgColumnWithPrecision<string, string> {}

export function timestamp(precision?: DateTimePrecision) {
	return new PgTimestamp("timestamp", precision);
}

export class PgTimestamp extends PgColumnWithPrecision<Date, Date | string> {}

export function timestamptz(precision?: DateTimePrecision) {
	return new PgTimestampTz("timestamptz", precision);
}

export class PgTimestampTz extends PgColumnWithPrecision<Date, Date | string> {}

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
	declare readonly _hasDefault: boolean;

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
		this._hasDefault = false;
	}

	notNull() {
		this.info.isNullable = false;
		return this as this & {
			_columnType: ColumnType<string, string, string>;
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
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	| PgEnum<string, any, any, any, any>;
