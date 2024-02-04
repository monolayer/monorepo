import type { ColumnDataType, ColumnType, Expression } from "kysely";
import { ForeIgnKeyConstraintInfo } from "../introspection/types.js";
import { pgTable } from "./table.js";

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
	): this {
		this.info.foreignKeyConstraint = {
			table: table.name,
			column: column.toString(),
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

export class PgColumn<T, I, U = I>
	extends PgColumnBase<T, I, U>
	implements QueryDataType
{
	declare readonly _columnType: ColumnType<
		T | null,
		I | undefined | null,
		U | undefined | null
	>;

	constructor(dataType: ColumnDataType) {
		super(dataType);
		this.info.isNullable = true;
	}

	primaryKey() {
		this.info.primaryKey = true;
		return this as this & {
			_columnType: ColumnType<T, I, U | undefined>;
		};
	}

	notNull() {
		this.info.isNullable = false;
		return this as this & {
			_columnType: ColumnType<T, I, U>;
		};
	}

	defaultTo(value: unknown | Expression<unknown>) {
		this.info.defaultValue = value;
		return this;
	}

	generatedByDefaultAsIdentity() {
		this.info.identity = ColumnIdentity.ByDefault;
		return this as this & {
			_columnType: ColumnType<T, I, U>;
		};
	}

	generatedAlwaysAsIdentity() {
		this.info.identity = ColumnIdentity.Always;
		return this as this & {
			_columnType: ColumnType<T, never, U>;
		};
	}
}

export class PgGeneratedColumn<T, U>
	extends PgColumnBase<NonNullable<T>, U, U>
	implements QueryDataType
{
	declare readonly _columnType: ColumnType<T, U | undefined, U>;

	constructor(dataType: "serial" | "bigserial") {
		super(dataType);
		this.info.isNullable = false;
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
		super("boolean");
	}
}

export function pgText() {
	return new PgText();
}

export class PgText extends PgColumn<string, string> {
	constructor() {
		super("text");
	}
}

export function pgBigInt() {
	return new PgBigInt();
}

export class PgBigInt extends PgColumn<string, number | bigint | string> {
	constructor() {
		super("bigint");
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
		super("bigserial");
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
		super("bytea");
	}
}

export function pgDate() {
	return new PgDate();
}

export class PgDate extends PgColumn<Date, Date | string> {
	constructor() {
		super("date");
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
		super("double precision");
	}
}

export function pgFloat4() {
	return new PgFloat4();
}

export class PgFloat4 extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("float4");
	}
}

export function pgFloat8() {
	return new PgFloat8();
}

export class PgFloat8 extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("float8");
	}
}

export function pgInt2() {
	return new PgInt2();
}

export class PgInt2 extends PgColumn<number, number | string> {
	constructor() {
		super("int2");
	}
}

export function pgInt4() {
	return new PgInt4();
}

export class PgInt4 extends PgColumn<number, number | string> {
	constructor() {
		super("int4");
	}
}

export function pgInt8() {
	return new PgInt8();
}

export class PgInt8 extends PgColumn<number, number | string> {
	constructor() {
		super("int8");
	}
}

export function pgInteger() {
	return new PgInteger();
}

export class PgInteger extends PgColumn<number, number | string> {
	constructor() {
		super("integer");
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
		super("json");
	}
}

export function pgJsonB() {
	return new PgJsonB();
}

export class PgJsonB extends PgColumn<JsonValue, string> {
	constructor() {
		super("jsonb");
	}
}

export function pgReal() {
	return new PgReal();
}

export class PgReal extends PgColumn<number, number | bigint | string> {
	constructor() {
		super("real");
	}
}

export function pgSerial() {
	return new PgSerial();
}

export class PgSerial extends PgGeneratedColumn<number, number | string> {
	constructor() {
		super("serial");
	}
}

export function pgUuid() {
	return new PgUuid();
}

export class PgUuid extends PgColumn<string, string> {
	constructor() {
		super("uuid");
	}
}

export class PgColumnWithMaximumLength<T, U> extends PgColumn<T, U> {
	constructor(dataType: "varchar" | "char", maximumLength?: number) {
		if (maximumLength !== undefined) {
			super(`${dataType}(${maximumLength})`);
			this.info.characterMaximumLength = maximumLength;
		} else {
			super(dataType);
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
		if (precision !== undefined) {
			super(`${dataType}(${precision})`);
			this.info.datetimePrecision = precision;
		} else {
			super(dataType);
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
			super(`numeric(${precision}, ${scale !== undefined ? scale : 0})`);
			this.info.numericPrecision = precision;
			this.info.numericScale = scale !== undefined ? scale : 0;
		} else {
			super("numeric");
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
