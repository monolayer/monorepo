import type { ColumnDataType } from "kysely";

interface Nullable {
	isNullable: true;
}
interface NonNullable {
	isNullable: false;
}

export type ColumnBase<T, N extends string, S, I> = {
	_typeName: N;
	_selectType: S;
	_insertType: I;
	nullable: () => T & Nullable;
	nonNullable: () => T & NonNullable;
	default: (value: I) => T;
	renameFrom: (value: string) => T;
	primaryKey: () => T;
};

export type ColumnBaseWithoutDefault<T, N extends string, S, I> = Omit<
	ColumnBase<T, N, S, I>,
	"default"
>;

export type ColumnMeta<T> = {
	dataType: ColumnDataType;
	isNullable: boolean;
	default: T | null;
	characterMaximumLength: number | null;
	numericPrecision: number | null;
	numericScale: number | null;
	datetimePrecision: number | null;
	min: number | bigint | null;
	max: number | bigint | null;
	renameFrom: string | null;
	primaryKey: true | null;
};

export type ColumnConstructor<T> = {
	new (): T;
	(): T;
};

export function addNullableConstraint<T extends PgColumn>(obj: T) {
	Object.defineProperty(obj, "nullable", {
		writable: false,
		value: () => {
			const meta = columnMeta(obj);
			if (meta !== undefined) meta.isNullable = true;
			return obj;
		},
	});

	Object.defineProperty(obj, "nonNullable", {
		writable: false,
		value: () => {
			const meta = columnMeta(obj);
			if (meta !== undefined) meta.isNullable = false;
			return obj;
		},
	});
}

export function addDefaultContraint<T>(obj: PgColumnWithDefault) {
	Object.defineProperty(obj, "default", {
		writable: false,
		value: (value: T) => {
			const meta = columnMeta<T>(obj);
			if (meta !== undefined) meta.default = value;
			return obj;
		},
	});
}

export function addRenameFrom<T extends PgColumn>(obj: T) {
	Object.defineProperty(obj, "renameFrom", {
		writable: false,
		value: (name: string) => {
			const meta = columnMeta<T>(obj);
			if (meta !== undefined) meta.renameFrom = name;
			return obj;
		},
	});
}

export function addPrimaryKey<T extends PgColumn>(obj: T) {
	Object.defineProperty(obj, "primaryKey", {
		writable: false,
		value: () => {
			const meta = columnMeta<T>(obj);
			if (meta !== undefined) meta.primaryKey = true;
			return obj;
		},
	});
}

export function columnMeta<T>(obj: object) {
	return (
		obj as unknown as {
			_meta: ColumnMeta<T>;
		}
	)._meta;
}

export function defineMetaInfo(obj: object, value: object) {
	Object.defineProperty(obj, "_meta", {
		value: value,
		writable: false,
	});
}

export function initColumnCommon<T extends PgColumnWithDefault>(
	obj: T,
	options: Pick<ColumnMeta<T>, "dataType"> &
		Omit<Partial<ColumnMeta<T>>, "dataType">,
) {
	defineColumnCommon(obj);
	addDefaultContraint<Parameters<T["default"]>[0]>(obj);
	defineMetaInfo(obj, {
		dataType: options.dataType,
		isNullable: options.isNullable ?? true,
		default: options.default ?? null,
		characterMaximumLength: options.characterMaximumLength ?? null,
		numericPrecision: options.numericPrecision ?? null,
		numericScale: options.numericScale ?? null,
		datetimePrecision: options.datetimePrecision ?? null,
		min: options.min ?? null,
		max: options.max ?? null,
		renameFrom: options.renameFrom ?? null,
		primaryKey: options.primaryKey ?? null,
	});
}

export function initColumnCommonWithoutDefault<
	T extends PgColumnWithoutDefault,
>(
	obj: T,
	options: Pick<ColumnMeta<T>, "dataType"> &
		Omit<Partial<ColumnMeta<T>>, "dataType">,
) {
	defineColumnCommon(obj);
	defineMetaInfo(obj, {
		dataType: options.dataType,
		isNullable: options.isNullable ?? true,
		default: null,
		characterMaximumLength: options.characterMaximumLength ?? null,
		numericPrecision: options.numericPrecision ?? null,
		numericScale: options.numericScale ?? null,
		datetimePrecision: options.datetimePrecision ?? null,
		min: options.min ?? null,
		max: options.max ?? null,
		renameFrom: options.renameFrom ?? null,
		primaryKey: options.primaryKey ?? null,
	});
}

function defineColumnCommon<T extends PgColumn>(obj: T) {
	addNullableConstraint(obj);
	addRenameFrom(obj);
	addPrimaryKey(obj);
}
type Boolish = "true" | "false" | "1" | "0" | 1 | 0;

export interface pgBoolean
	extends ColumnBase<pgBoolean, "boolean", boolean, boolean | Boolish> {}

export function pgBoolean() {
	const booleanConstructor = function (this: pgBoolean) {
		initColumnCommon<pgBoolean>(this, {
			dataType: "boolean",
		});
		return this;
	} as ColumnConstructor<pgBoolean>;
	return new booleanConstructor();
}

export interface pgText extends ColumnBase<pgText, "text", string, string> {}
export function pgText() {
	const textConstructor = function (this: pgText) {
		initColumnCommon<pgText>(this, {
			dataType: "text",
		});
		return this;
	} as ColumnConstructor<pgText>;
	return new textConstructor();
}

export interface pgVarchar
	extends ColumnBase<pgVarchar, "varchar", string, string> {
	maximumLength: (value: number) => pgVarchar;
}

export function pgVarchar(characterMaximumLength?: number) {
	const textConstructor = function (this: pgVarchar) {
		initColumnCommon<pgVarchar>(this, {
			dataType:
				characterMaximumLength === undefined
					? "varchar"
					: `varchar(${characterMaximumLength})`,
			characterMaximumLength: characterMaximumLength,
		});
		return this;
	} as ColumnConstructor<pgVarchar>;
	return new textConstructor();
}

export interface pgChar extends ColumnBase<pgChar, "char", string, string> {
	maximumLength: (value: number) => pgChar;
}

export function pgChar(characterMaximumLength?: number) {
	const textConstructor = function (this: pgChar) {
		initColumnCommon<pgChar>(this, {
			dataType:
				characterMaximumLength === undefined
					? "char(1)"
					: `char(${characterMaximumLength})`,
			characterMaximumLength:
				characterMaximumLength === undefined ? 1 : characterMaximumLength,
		});
		return this;
	} as ColumnConstructor<pgChar>;
	return new textConstructor();
}

export type CharacterType = pgChar | pgText | pgVarchar;

export interface pgNumeric
	extends ColumnBase<pgNumeric, "numeric", string, string | number | bigint> {}

export function pgNumeric(precision?: number, scale = 0) {
	const numericConstructor = function (this: pgNumeric) {
		initColumnCommon<pgNumeric>(this, {
			dataType:
				precision === undefined ? "numeric" : `numeric(${precision}, ${scale})`,
			numericPrecision: precision,
			numericScale: scale,
		});
		return this;
	} as ColumnConstructor<pgNumeric>;
	return new numericConstructor();
}

export interface pgBigInt
	extends ColumnBase<pgBigInt, "pgBigInt", string, string | number | bigint> {}

export function pgBigInt() {
	const numericConstructor = function (this: pgBigInt) {
		initColumnCommon<pgBigInt>(this, {
			dataType: "bigint",

			min: -9223372036854775808n,
			max: 9223372036854775808n,
		});
		return this;
	} as ColumnConstructor<pgBigInt>;
	return new numericConstructor();
}

export interface pgBigSerial
	extends ColumnBase<
		pgBigSerial,
		"pgBigSerial",
		string,
		string | number | bigint
	> {}

export function pgBigSerial() {
	const numericConstructor = function (this: pgBigSerial) {
		initColumnCommonWithoutDefault<pgBigSerial>(this, {
			dataType: "bigserial",
			min: 1,
			max: 9223372036854775808n,
		});
		return this;
	} as ColumnConstructor<pgBigSerial>;
	return new numericConstructor();
}

export type NestedRecord = {
	[k: string]: string | number | boolean | NestedRecord;
};

export interface pgBytea
	extends ColumnBase<
		pgBytea,
		"pgBytea",
		Buffer,
		Buffer | string | boolean | number | NestedRecord
	> {}

export function pgBytea() {
	const numericConstructor = function (this: pgBytea) {
		initColumnCommon<pgBytea>(this, {
			dataType: "bytea",
		});
		return this;
	} as ColumnConstructor<pgBytea>;
	return new numericConstructor();
}

export interface pgDate
	extends ColumnBase<pgDate, "pgDate", Date, string | Date> {}

export function pgDate() {
	const numericConstructor = function (this: pgDate) {
		initColumnCommon<pgDate>(this, {
			dataType: "date",
		});
		return this;
	} as ColumnConstructor<pgDate>;
	return new numericConstructor();
}

export interface pgDoublePrecision
	extends ColumnBase<
		pgDoublePrecision,
		"pgDoublePrecision",
		string,
		string | number | bigint
	> {}

export function pgDoublePrecision() {
	const numericConstructor = function (this: pgDoublePrecision) {
		initColumnCommon<pgDoublePrecision>(this, {
			dataType: "double precision",
			min: -1e308,
			max: 1e308,
		});
		return this;
	} as ColumnConstructor<pgDoublePrecision>;
	return new numericConstructor();
}

export interface pgFloat4
	extends ColumnBase<pgFloat4, "pgFloat4", number, string | number | bigint> {}

export function pgFloat4() {
	const numericConstructor = function (this: pgFloat4) {
		initColumnCommon<pgFloat4>(this, {
			dataType: "float4",
			min: -1e37,
			max: 1e37,
		});
		return this;
	} as ColumnConstructor<pgFloat4>;
	return new numericConstructor();
}

export interface pgFloat8
	extends ColumnBase<pgFloat8, "pgFloat8", number, string | number | bigint> {}

export function pgFloat8() {
	const numericConstructor = function (this: pgFloat8) {
		initColumnCommon<pgFloat8>(this, {
			dataType: "float8",
			min: -1e308,
			max: 1e308,
		});
		return this;
	} as ColumnConstructor<pgFloat8>;
	return new numericConstructor();
}

export interface pgInt2
	extends ColumnBase<pgInt2, "pgInt2", number, string | number> {}

export function pgInt2() {
	const numericConstructor = function (this: pgInt2) {
		initColumnCommon<pgInt2>(this, {
			dataType: "int2",
			min: -32768,
			max: 32768,
		});
		return this;
	} as ColumnConstructor<pgInt2>;
	return new numericConstructor();
}

export interface pgInt4
	extends ColumnBase<pgInt4, "pgInt4", number, string | number> {}

export function pgInt4() {
	const numericConstructor = function (this: pgInt4) {
		initColumnCommon<pgInt4>(this, {
			dataType: "int4",
			min: -2147483648,
			max: 2147483648,
		});
		return this;
	} as ColumnConstructor<pgInt4>;
	return new numericConstructor();
}

export interface pgInt8
	extends ColumnBase<pgInt8, "pgInt8", number, string | number | bigint> {}

export function pgInt8() {
	const numericConstructor = function (this: pgInt8) {
		initColumnCommon<pgInt8>(this, {
			dataType: "int8",
			min: -9223372036854775808n,
			max: 9223372036854775808n,
		});
		return this;
	} as ColumnConstructor<pgInt8>;
	return new numericConstructor();
}

export interface pgInteger
	extends ColumnBase<pgInteger, "pgInteger", number, string | number> {}

export function pgInteger() {
	const numericConstructor = function (this: pgInteger) {
		initColumnCommon<pgInteger>(this, {
			dataType: "int4",
			min: -2147483648,
			max: 2147483648,
		});
		return this;
	} as ColumnConstructor<pgInteger>;
	return new numericConstructor();
}

type JsonArray = JsonValue[];

type JsonObject = {
	[K in string]?: JsonValue;
};

type JsonPrimitive = boolean | number | string | null;

type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export interface pgJson
	extends ColumnBase<pgJson, "pgJson", JsonValue, string> {}

export function pgJson() {
	const numericConstructor = function (this: pgJson) {
		initColumnCommon<pgJson>(this, {
			dataType: "json",
		});
		return this;
	} as ColumnConstructor<pgJson>;
	return new numericConstructor();
}

export interface pgJsonB
	extends ColumnBase<pgJsonB, "pgJsonB", JsonValue, string> {}

export function pgJsonB() {
	const numericConstructor = function (this: pgJsonB) {
		initColumnCommon<pgJsonB>(this, {
			dataType: "jsonb",
		});
		return this;
	} as ColumnConstructor<pgJsonB>;
	return new numericConstructor();
}

export interface pgReal
	extends ColumnBase<pgReal, "pgReal", number, string | number | bigint> {}

export function pgReal() {
	const numericConstructor = function (this: pgReal) {
		initColumnCommon<pgReal>(this, {
			dataType: "real",
			min: -1e37,
			max: 1e37,
		});
		return this;
	} as ColumnConstructor<pgReal>;
	return new numericConstructor();
}

export interface pgSerial
	extends ColumnBaseWithoutDefault<
		pgSerial,
		"pgSerial",
		number,
		string | number
	> {}

export function pgSerial() {
	const numericConstructor = function (this: pgSerial) {
		initColumnCommonWithoutDefault<pgSerial>(this, {
			dataType: "serial",
			min: 1,
			max: 2147483648,
		});
		return this;
	} as ColumnConstructor<pgSerial>;
	return new numericConstructor();
}

type DateTimePrecision = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface pgTime extends ColumnBase<pgTime, "pgTime", string, string> {}

export function pgTime(precision?: DateTimePrecision) {
	const numericConstructor = function (this: pgTime) {
		initColumnCommon<pgTime>(this, {
			dataType: precision === undefined ? "time" : `time(${precision})`,
			datetimePrecision: precision,
		});
		return this;
	} as ColumnConstructor<pgTime>;
	return new numericConstructor();
}

export interface pgTimestamp
	extends ColumnBase<pgTimestamp, "pgTimestamp", Date, string | Date> {}

export function pgTimestamp(precision?: DateTimePrecision) {
	const numericConstructor = function (this: pgTimestamp) {
		initColumnCommon<pgTimestamp>(this, {
			dataType:
				precision === undefined ? "timestamp" : `timestamp(${precision})`,
			datetimePrecision: precision,
		});
		return this;
	} as ColumnConstructor<pgTimestamp>;
	return new numericConstructor();
}

export interface pgTimestampTz
	extends ColumnBase<pgTimestampTz, "pgTimestampTz", Date, string | Date> {}

export function pgTimestampTz(precision?: DateTimePrecision) {
	const numericConstructor = function (this: pgTimestampTz) {
		initColumnCommon<pgTimestampTz>(this, {
			dataType:
				precision === undefined ? "timestamptz" : `timestamptz(${precision})`,
			datetimePrecision: precision,
		});
		return this;
	} as ColumnConstructor<pgTimestampTz>;
	return new numericConstructor();
}

export interface pgTimeTz
	extends ColumnBase<pgTimeTz, "pgTimeZ", string, string> {}

export function pgTimeTz(precision?: DateTimePrecision) {
	const numericConstructor = function (this: pgTimeTz) {
		initColumnCommon<pgTimeTz>(this, {
			dataType: precision === undefined ? "timetz" : `timetz(${precision})`,
			datetimePrecision: precision,
		});
		return this;
	} as ColumnConstructor<pgTimeTz>;
	return new numericConstructor();
}

export interface pgUuid extends ColumnBase<pgUuid, "pgUuid", string, string> {}

export function pgUuid() {
	const numericConstructor = function (this: pgUuid) {
		initColumnCommon<pgUuid>(this, {
			dataType: "uuid",
		});
		return this;
	} as ColumnConstructor<pgUuid>;
	return new numericConstructor();
}

export type PgColumnWithDefault =
	| pgChar
	| pgVarchar
	| pgText
	| pgBoolean
	| pgNumeric
	| pgInt2
	| pgInt4
	| pgInteger
	| pgBigInt
	| pgInt8
	| pgUuid
	| pgDate
	| pgTime
	| pgTimeTz
	| pgTimestamp
	| pgTimestampTz
	| pgBytea
	| pgDoublePrecision
	| pgFloat8
	| pgFloat4
	| pgReal
	| pgJson
	| pgJsonB;

export type PgColumnWithoutDefault = pgSerial | pgBigSerial;

export type PgColumn = PgColumnWithDefault | PgColumnWithoutDefault;
