/* eslint-disable max-lines */
import type { Simplify } from "kysely";
import { type ColumnType, type Expression } from "kysely";
import type { ShallowRecord } from "node_modules/kysely/dist/esm/util/type-utils.js";

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

export abstract class PgColumn<S, I, U = I> extends PgColumnBase<S, I, U> {
	protected _primaryKey: boolean;

	protected readonly _native_data_type: DefaultValueDataTypes;

	constructor(dataType: string, postgresDataType: DefaultValueDataTypes) {
		super(dataType);
		this._native_data_type = postgresDataType;
		this._primaryKey = false;
	}

	notNull() {
		this.info.isNullable = false;
		return this as this & NonNullableColumn;
	}

	default(value: I | Expression<unknown>) {
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

export abstract class PgGeneratedColumn<T, U> extends PgColumnBase<T, U, U> {
	protected readonly _native_data_type: DefaultValueDataTypes;
	protected _primaryKey: boolean;

	constructor(
		dataType: "serial" | "bigserial",
		postgresDataType: DefaultValueDataTypes,
	) {
		super(dataType);
		this.info.isNullable = false;
		this._native_data_type = postgresDataType;
		this._primaryKey = false;
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

export function serial() {
	return new PgSerial();
}

export class PgSerial extends PgGeneratedColumn<number, number | string> {
	constructor() {
		super("serial", DefaultValueDataTypes.serial);
	}
}

export abstract class IdentifiableColumn<S, I, U = I> extends PgColumn<
	S,
	I,
	U
> {
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

	default(value: boolean | Boolish | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = value;
		} else {
			this.info.defaultValue = `${value}`;
		}
		return this as this & WithDefaultColumn;
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

export class PgBigInt extends IdentifiableColumn<
	string,
	number | bigint | string
> {
	constructor() {
		super("bigint", DefaultValueDataTypes.bigint);
	}
}

export function bytea() {
	return new PgBytea();
}

export type NestedRecord = {
	[k: string]: string | number | boolean | NestedRecord;
};

export class PgBytea extends PgColumn<Buffer, Buffer | string> {
	constructor() {
		super("bytea", DefaultValueDataTypes.bytea);
	}

	default(value: Buffer | string | Expression<unknown>) {
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

export class PgInt2 extends IdentifiableColumn<number, number | string> {
	constructor() {
		super("smallint", DefaultValueDataTypes.smallint);
	}
}

export function int4() {
	return new PgInt4();
}

export class PgInt4 extends IdentifiableColumn<number, number | string> {
	constructor() {
		super("integer", DefaultValueDataTypes.integer);
	}

	default(value: number | string | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = value;
		} else {
			this.info.defaultValue = `${value}`;
		}
		return this as this & WithDefaultColumn;
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
}

export function integer() {
	return new PgInteger();
}

export class PgInteger extends IdentifiableColumn<number, number | string> {
	constructor() {
		super("integer", DefaultValueDataTypes.integer);
	}

	default(value: number | string | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = value;
		} else {
			this.info.defaultValue = `${value}`;
		}
		return this as this & WithDefaultColumn;
	}
}

export function json() {
	return new PgJson();
}

export type JsonArray = JsonValue[];

export type JsonObject = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[K in string]?: any;
};

export type JsonPrimitive = boolean | number | string;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export class PgJson extends PgColumn<
	JsonValue,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	string | number | boolean | Record<string, any>
> {
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

export function uuid() {
	return new PgUuid();
}

export class PgUuid extends PgColumn<string, string> {
	constructor() {
		super("uuid", DefaultValueDataTypes.uuid);
	}

	default(value: string | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = value;
		} else {
			this.info.defaultValue = `'${value.toLowerCase()}'::uuid`;
		}
		return this as this & WithDefaultColumn;
	}
}

export abstract class PgColumnWithMaximumLength<T, U> extends PgColumn<T, U> {
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

export abstract class PgTimeColumn<T, U> extends PgColumn<T, U> {
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

export function time(precision?: DateTimePrecision) {
	return new PgTime(precision);
}

export class PgTime extends PgTimeColumn<string, string> {
	constructor(precision?: DateTimePrecision) {
		super("time", precision);
	}
}

export abstract class PgTimestampColumn<T, U> extends PgColumn<T, U> {
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
	return new PgTimeTz(precision);
}

export class PgTimeTz extends PgTimeColumn<string, string> {
	constructor(precision?: DateTimePrecision) {
		super("timetz", precision);
	}
}

export function timestamp(precision?: DateTimePrecision) {
	return new PgTimestamp("timestamp", precision);
}

export class PgTimestamp extends PgTimestampColumn<Date, Date | string> {}

export function timestamptz(precision?: DateTimePrecision) {
	return new PgTimestampTz("timestamptz", precision);
}

export class PgTimestampTz extends PgTimestampColumn<Date, Date | string> {}

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

	default(value: string) {
		this.info.defaultValue = `'${value}'::${this.info.dataType}`;
		return this as this & WithDefaultColumn;
	}
}

export type TableColumn =
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export type OptionalColumnType<S, I, U> = Simplify<
	ColumnType<S, I | undefined, U>
>;
export type GeneratedColumnType<S, I, U> = OptionalColumnType<S, I, U>;

export type WithDefaultColumn = {
	_hasDefault: true;
};

export type NonNullableColumn = { _nullable: false };

export type GeneratedColumn = {
	_generatedByDefault: true;
	_nullable: false;
};

export type GeneratedAlwaysColumn = {
	_generatedAlways: true;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPGColumn = PgColumn<any, any>;
