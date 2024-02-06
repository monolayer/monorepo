import {
	type ColumnDataType,
	type ColumnType,
	type Expression,
	type OnModifyForeignAction,
	isExpression,
} from "kysely";
import { ForeIgnKeyConstraintInfo } from "../introspection/types.js";
import { pgTable } from "./pg_table.js";

export type ColumnInfo = {
	columnName: string | null;
	tableName: string | null;
	dataType: string | null;
	defaultValue: unknown | Expression<unknown> | null;
	isNullable: boolean | null;
	numericPrecision: number | null;
	numericScale: number | null;
	characterMaximumLength: number | null;
	datetimePrecision: number | null;
	renameFrom: string | null;
	primaryKey: true | null;
	foreignKeyConstraint: ForeIgnKeyConstraintInfo | null;
	identity: ColumnIdentity.Always | ColumnIdentity.ByDefault | null;
	unique: ColumnUnique.NullsDistinct | ColumnUnique.NullsNotDistinct | null;
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

export type UniqueConstraintInfo = {
	enabled: boolean;
	name: string | null;
	nullsNotDistinct: boolean;
};

interface QueryDataType {
	/** @internal */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	readonly _columnType: ColumnType<any, any, any>;
}

interface NativelDataType {
	/** @internal */
	readonly _native_data_type: DefaultValueDataTypes;
}

export class PgColumnBase<S, I, U> {
	protected info: Omit<ColumnInfo, "columnName" | "tableName">;

	constructor(dataType: ColumnDataType) {
		this.info = {
			dataType: dataType,
			isNullable: null,
			defaultValue: null,
			characterMaximumLength: null,
			numericPrecision: null,
			numericScale: null,
			datetimePrecision: null,
			renameFrom: null,
			primaryKey: null,
			foreignKeyConstraint: null,
			identity: null,
			unique: null,
		};
	}

	renameFrom(name: string) {
		this.info.renameFrom = name;
		return this;
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	references<R extends pgTable<string, any>>(
		table: R,
		column: keyof R["columns"],
		options?: {
			onDelete?: OnModifyForeignAction;
			onUpdate?: OnModifyForeignAction;
		},
	): this {
		this.info.foreignKeyConstraint = {
			table: table.name,
			column: column.toString(),
			options: `${
				options?.onDelete !== undefined ? options.onDelete : "no action"
			};${options?.onUpdate !== undefined ? options.onUpdate : "no action"}`,
		};
		return this;
	}

	unique() {
		this.info.unique = ColumnUnique.NullsDistinct;
		return this;
	}

	nullsNotDistinct() {
		if (this.info.unique !== null) {
			this.info.unique = ColumnUnique.NullsNotDistinct;
		}
		return this;
	}
}

export class PgColumn<S, I, U = I>
	extends PgColumnBase<S, I, U>
	implements QueryDataType, NativelDataType
{
	declare readonly _columnType: ColumnType<
		S | null,
		I | undefined | null,
		U | undefined | null
	>;

	declare readonly _native_data_type: DefaultValueDataTypes;

	constructor(
		dataType: ColumnDataType,
		postgresDataType: DefaultValueDataTypes,
	) {
		super(dataType);
		this.info.isNullable = true;
		this._native_data_type = postgresDataType;
	}

	primaryKey() {
		this.info.primaryKey = true;
		return this as this & {
			_columnType: ColumnType<S, I, U | undefined>;
		};
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
			if (this.info.dataType !== null) {
				let val: unknown = value;
				if (val instanceof Date) val = val.toISOString();
				if (typeof val === "string" && this instanceof PgDate)
					val = val.split("T")[0];
				this.info.defaultValue = `'${val}'::${this._native_data_type}`;
			}
		}
		return this;
	}

	generatedByDefaultAsIdentity() {
		this.info.identity = ColumnIdentity.ByDefault;
		return this as this & {
			_columnType: ColumnType<S, I, U>;
		};
	}

	generatedAlwaysAsIdentity() {
		this.info.identity = ColumnIdentity.Always;
		return this as this & {
			_columnType: ColumnType<S, never, U>;
		};
	}
}

export class PgGeneratedColumn<T, U>
	extends PgColumnBase<NonNullable<T>, U, U>
	implements QueryDataType, NativelDataType
{
	declare readonly _columnType: ColumnType<T, U | undefined, U>;

	declare readonly _native_data_type: DefaultValueDataTypes;

	constructor(
		dataType: "serial" | "bigserial",
		postgresDataType: DefaultValueDataTypes,
	) {
		super(dataType);
		this.info.isNullable = false;
		this._native_data_type = postgresDataType;
	}

	primaryKey() {
		this.info.primaryKey = true;
		return this as this & {
			_columnType: ColumnType<T, U | undefined, U | undefined>;
		};
	}
}

export function pgBoolean() {
	return new PgBoolean();
}

export class PgBoolean extends PgColumn<boolean, boolean> {
	constructor() {
		super("boolean", DefaultValueDataTypes.boolean);
	}
}

export function pgText() {
	return new PgText();
}

export class PgText extends PgColumn<string, string> {
	constructor() {
		super("text", DefaultValueDataTypes.text);
	}
}

export function pgBigInt() {
	return new PgBigInt();
}

export class PgBigInt extends PgColumn<string, number | bigint | string> {
	constructor() {
		super("bigint", DefaultValueDataTypes.bigint);
	}
}

export function pgBigSerial() {
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

export function pgBytea() {
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
}

export function pgDate() {
	return new PgDate();
}

export class PgDate extends PgColumn<Date, Date | string> {
	constructor() {
		super("date", DefaultValueDataTypes.date);
	}
}

export function pgDoublePrecision() {
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

export function pgFloat4() {
	return new PgFloat4();
}

export class PgFloat4 extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("float4", DefaultValueDataTypes.real);
	}
}

export function pgFloat8() {
	return new PgFloat8();
}

export class PgFloat8 extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("float8", DefaultValueDataTypes["double precision"]);
	}
}

export function pgInt2() {
	return new PgInt2();
}

export class PgInt2 extends PgColumn<number, number | string> {
	constructor() {
		super("int2", DefaultValueDataTypes.smallint);
	}
}

export function pgInt4() {
	return new PgInt4();
}

export class PgInt4 extends PgColumn<number, number | string> {
	constructor() {
		super("int4", DefaultValueDataTypes.integer);
	}
}

export function pgInt8() {
	return new PgInt8();
}

export class PgInt8 extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("int8", DefaultValueDataTypes.bigint);
	}
}

export function pgInteger() {
	return new PgInteger();
}

export class PgInteger extends PgColumn<number, number | string> {
	constructor() {
		super("integer", DefaultValueDataTypes.integer);
	}
}

export function pgJson() {
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

export function pgJsonB() {
	return new PgJsonB();
}

export class PgJsonB extends PgColumn<JsonValue, string> {
	constructor() {
		super("jsonb", DefaultValueDataTypes.jsonb);
	}
}

export function pgReal() {
	return new PgReal();
}

export class PgReal extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("real", DefaultValueDataTypes.real);
	}
}

export function pgSerial() {
	return new PgSerial();
}

export class PgSerial extends PgGeneratedColumn<number, number | string> {
	constructor() {
		super("serial", DefaultValueDataTypes.serial);
	}
}

export function pgUuid() {
	return new PgUuid();
}

export class PgUuid extends PgColumn<string, string> {
	constructor() {
		super("uuid", DefaultValueDataTypes.uuid);
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

export function pgVarChar(maximumLength?: number) {
	return new PgVarChar("varchar", maximumLength);
}

export class PgVarChar extends PgColumnWithMaximumLength<string, string> {}

export function pgChar(maximumLength?: number) {
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

export function pgTime(precision?: DateTimePrecision) {
	return new PgTime("time", precision);
}

export class PgTime extends PgColumnWithPrecision<string, string> {}

export function pgTimeTz(precision?: DateTimePrecision) {
	return new PgTimeTz("timetz", precision);
}

export class PgTimeTz extends PgColumnWithPrecision<string, string> {}

export function pgTimestamp(precision?: DateTimePrecision) {
	return new PgTimestamp("timestamp", precision);
}

export class PgTimestamp extends PgColumnWithPrecision<Date, Date | string> {}

export function pgTimestampTz(precision?: DateTimePrecision) {
	return new PgTimestampTz("timestamptz", precision);
}

export class PgTimestampTz extends PgColumnWithPrecision<Date, Date | string> {}

export function pgNumeric(precision?: number, scale = 0) {
	return new PgNumeric(precision, scale);
}

export class PgNumeric extends PgColumn<string, number | bigint | string> {
	constructor(precision?: number, scale?: number) {
		if (precision !== undefined) {
			super(
				`numeric(${precision}, ${scale !== undefined ? scale : 0})`,
				DefaultValueDataTypes.numeric,
			);
			this.info.numericPrecision = precision;
			this.info.numericScale = scale !== undefined ? scale : 0;
		} else {
			super("numeric", DefaultValueDataTypes.numeric);
		}
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
	| PgVarChar;
