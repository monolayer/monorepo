/* eslint-disable max-lines */
import { type ColumnType, type Expression } from "kysely";
import { compileDefaultExpression } from "~/introspection/helpers.js";
import { hashValue } from "~/utils.js";
import {
	type ColumnInfo,
	type GeneratedAlwaysColumn,
	type GeneratedColumn,
	type NonNullableColumn,
	type WithDefaultColumn,
} from "./types.js";

export abstract class PgColumnBase<Select, Insert, Update> {
	/**
	 * @hidden
	 */
	protected declare readonly infer: ColumnType<Select, Insert, Update>;
	/**
	 * @hidden
	 */
	protected info: Omit<ColumnInfo, "columnName" | "tableName">;

	/**
	 * @hidden
	 */
	protected declare _primaryKey: boolean;

	/**
	 * @hidden
	 */
	protected declare _native_data_type: string;

	/**
	 * @hidden
	 */
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

export abstract class PgColumn<
	Select,
	Insert,
	Update = Insert,
> extends PgColumnBase<Select, Insert, Update> {
	/**
	 * @hidden
	 */
	constructor(dataType: string, postgresDataType: string) {
		super(dataType);
		this._native_data_type = postgresDataType;
		this._primaryKey = false;
	}

	/**
	 * Adds a not null constraint to the column.
	 * @public
	 * The column is not allowed to contain null values.
	 *
	 * @see PostgreSQL Docs: {@link https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-NOT-NULL | Not-Null Constraints }
	 */
	notNull() {
		this.info.isNullable = false;
		return this as this & NonNullableColumn;
	}

	default(value: Insert | Expression<unknown>) {
		if (isExpression(value)) {
			this.info.defaultValue = valueWithHash(compileDefaultExpression(value));
		} else {
			this.info.defaultValue = this.transformDefault(value);
		}
		return this as this & WithDefaultColumn;
	}

	/**
	 * @hidden
	 */
	protected transformDefault(value: Insert) {
		return valueWithHash(`'${value}'::${this._native_data_type}`);
	}
}

export abstract class SerialColumn<Select, Insert> extends PgColumnBase<
	Select,
	Insert,
	Insert
> {
	/**
	 * @hidden
	 */
	protected declare _serialColumn: true;

	/**
	 * @hidden
	 */
	constructor(dataType: "serial" | "bigserial", postgresDataType: string) {
		super(dataType);
		this.info.isNullable = false;
		this._native_data_type = postgresDataType;
		this._primaryKey = false;
	}
}

export abstract class StringColumn<
	Select extends string = string,
	Insert extends string = string,
> extends PgColumn<Select, Insert> {
	/**
	 * @hidden
	 */
	constructor(dataType: string) {
		super(dataType, dataType);
	}
}

export abstract class IdentifiableColumn<Select, Insert> extends PgColumn<
	Select,
	Insert
> {
	generatedByDefaultAsIdentity() {
		this.info.identity = "BY DEFAULT";
		this.info.isNullable = false;
		return this as this & GeneratedColumn;
	}

	generatedAlwaysAsIdentity() {
		this.info.identity = "ALWAYS";
		this.info.isNullable = false;
		return this as this & GeneratedAlwaysColumn;
	}
}
export abstract class MaxLengthColumn<T, U> extends PgColumn<T, U> {
	/**
	 * @hidden
	 */
	constructor(dataType: string, maximumLength?: number) {
		if (maximumLength !== undefined) {
			super(`${dataType}(${maximumLength})`, dataType);
			this.info.characterMaximumLength = maximumLength;
		} else {
			super(dataType, dataType);
		}
	}
}

// From Kysely. To avoid bundling Kysely in client code.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isExpression(obj: unknown): obj is Expression<any> {
	return (
		isObject(obj) &&
		"expressionType" in obj &&
		typeof obj.toOperationNode === "function"
	);
}

type DrainOuterGeneric<T> = [T] extends [unknown] ? T : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShallowRecord<K extends keyof any, T> = DrainOuterGeneric<{
	[P in K]: T;
}>;

function isObject(obj: unknown): obj is ShallowRecord<string, unknown> {
	return typeof obj === "object" && obj !== null;
}

export function valueWithHash(value: string): `${string}:${string}` {
	return `${hashValue(value)}:${value}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPGColumn = PgColumn<any, any>;
