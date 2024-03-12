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
	/**
	 * @hidden
	 */
	protected declare readonly infer: ColumnType<S, I, U>;
	/**
	 * @hidden
	 */
	protected info: Omit<ColumnInfo, "columnName" | "tableName">;

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

export abstract class PgColumn<S, I, U = I> extends PgColumnBase<S, I, U> {
	/**
	 * @hidden
	 */
	protected _primaryKey: boolean;

	/**
	 * @hidden
	 */
	protected readonly _native_data_type: string;

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

	/**
	 * Assigns a default default data value for the column.
	 *
	 * **Note:** When adding or changing a default value on an existing column, the new value be applied to inserted or updated rows. Default values in rows already in the table will not change.

	 * Generated Kysely database schema type definition:
	 *  - *Selection*: non nullable.
	 *  - *Insertion*: optional.
	 *  - *Update*: optional.
	 *
	 * @example
	 *
	 *
	 * For the following table schema:
	 *
	 * ```ts
	 * const books = pgTable({
	 *   columns: {
	 *     description: pgText().default("TBD"),
	 *     created_at: pgTimestampTz().default(sql`now()`),
	 *   }
	 * })
	 * ```
	 *
	 * The generated up migration will be:
	 *
	 * ```ts
	 * await kysely.schema
	 *   .createTable("books")
	 *   .addColumn("description", "text", (col) => col.defaultTo(sql`'TBD'::text`))
	 *   .addColumn("created_at", "timestamptz", (col) => col.defaultTo(sql`now()`),
	 * )
	 * ```
	 *
	 * and the Kysely database schema type definition for the `books` table will be:
	 *
	 * ```ts
	 * type books = {
	 *   description: {
	 *     readonly __select__: string;
	 *     readonly __insert__: string | null;
	 *     readonly __update__: string | null;
	 *   },
	 *   created_at: {
	 *     readonly __select__: Date;
	 *     readonly __insert__: Date | string | null;
	 *     readonly __update__: Date | string | null;
	 *   }
	 * }
	 *
	 * ```

	 * @see PostgreSQL Docs:
	 * {@link https://www.postgresql.org/docs/16/sql-createtable.html#SQL-CREATETABLE-PARMS-DEFAULT | Create Table Default }
	 * and
	 * {@link https://www.postgresql.org/docs/16/sql-altertable.html#SQL-ALTERTABLE-DESC-SET-DROP-DEFAULT | Set/Drop Default }
	 */
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
	/**
	 * @hidden
	 */
	protected readonly _native_data_type: DefaultValueDataTypes;
	/**
	 * @hidden
	 */
	protected _primaryKey: boolean;

	/**
	 * @hidden
	 */
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
	/**
	 * @hidden
	 */
	constructor() {
		super("bigserial", DefaultValueDataTypes.bigserial);
	}
}

export function serial() {
	return new PgSerial();
}

export class PgSerial extends PgGeneratedColumn<number, number | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("serial", DefaultValueDataTypes.serial);
	}
}

export abstract class IdentifiableColumn<S, I, U = I> extends PgColumn<
	S,
	I,
	U
> {
	/**
	 * Assigns a default default data value for the column.
	 *
	 * **Note:** When adding or changing a default value on an existing column, the new value be applied to inserted or updated rows. Default values in rows already in the table will not change.

	 * Generated Kysely database schema type definition:
	 *  - *Selection*: non nullable.
	 *  - *Insertion*: optional.
	 *  - *Update*: optional.
	 *
	 * @example
	 *
	 *
	 * For the following table schema:
	 *
	 * ```ts
	 * const books = pgTable({
	 *   columns: {
	 *     description: pgText().default("TBD"),
	 *     created_at: pgTimestampTz().default(sql`now()`),
	 *   }
	 * })
	 * ```
	 *
	 * The generated up migration will be:
	 *
	 * ```ts
	 * await kysely.schema
	 *   .createTable("books")
	 *   .addColumn("description", "text", (col) => col.defaultTo(sql`'TBD'::text`))
	 *   .addColumn("created_at", "timestamptz", (col) => col.defaultTo(sql`now()`),
	 * )
	 * ```
	 *
	 * and the Kysely database schema type definition for the `books` table will be:
	 *
	 * ```ts
	 * type books = {
	 *   description: {
	 *     readonly __select__: string;
	 *     readonly __insert__: string | null;
	 *     readonly __update__: string | null;
	 *   },
	 *   created_at: {
	 *     readonly __select__: Date;
	 *     readonly __insert__: Date | string | null;
	 *     readonly __update__: Date | string | null;
	 *   }
	 * }
	 *
	 * ```
	 * @see PostgreSQL Docs:
	 * {@link https://www.postgresql.org/docs/16/sql-createtable.html#SQL-CREATETABLE-PARMS-DEFAULT | Create Table Default }
	 * and
	 * {@link https://www.postgresql.org/docs/16/sql-altertable.html#SQL-ALTERTABLE-DESC-SET-DROP-DEFAULT | Set/Drop Default }
	 */
	generatedByDefaultAsIdentity() {
		this.info.identity = ColumnIdentity.ByDefault;
		this.info.isNullable = false;
		return this as this & GeneratedColumn;
	}

	/**
	 * Assigns a default default data value for the column.
	 *
	 * **Note:** When adding or changing a default value on an existing column, the new value be applied to inserted or updated rows. Default values in rows already in the table will not change.

	 * Generated Kysely database schema type definition:
	 *  - *Selection*: non nullable.
	 *  - *Insertion*: optional.
	 *  - *Update*: optional.
	 *
	 * @example
	 *
	 *
	 * For the following table schema:
	 *
	 * ```ts
	 * const books = pgTable({
	 *   columns: {
	 *     description: pgText().default("TBD"),
	 *     created_at: pgTimestampTz().default(sql`now()`),
	 *   }
	 * })
	 * ```
	 *
	 * The generated up migration will be:
	 *
	 * ```ts
	 * await kysely.schema
	 *   .createTable("books")
	 *   .addColumn("description", "text", (col) => col.defaultTo(sql`'TBD'::text`))
	 *   .addColumn("created_at", "timestamptz", (col) => col.defaultTo(sql`now()`),
	 * )
	 * ```
	 *
	 * and the Kysely database schema type definition for the `books` table will be:
	 *
	 * ```ts
	 * type books = {
	 *   description: {
	 *     readonly __select__: string;
	 *     readonly __insert__: string | null;
	 *     readonly __update__: string | null;
	 *   },
	 *   created_at: {
	 *     readonly __select__: Date;
	 *     readonly __insert__: Date | string | null;
	 *     readonly __update__: Date | string | null;
	 *   }
	 * }
	 *
	 * ```
	 * @see PostgreSQL Docs:
	 * {@link https://www.postgresql.org/docs/16/sql-createtable.html#SQL-CREATETABLE-PARMS-DEFAULT | Create Table Default }
	 * and
	 * {@link https://www.postgresql.org/docs/16/sql-altertable.html#SQL-ALTERTABLE-DESC-SET-DROP-DEFAULT | Set/Drop Default }
	 */
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
	/**
	 * @hidden
	 */
	constructor() {
		super("boolean", DefaultValueDataTypes.boolean);
	}

	/**
	 * Assigns a default default data value for the column.
	 *
	 * **Note:** When adding or changing a default value on an existing column, the new value be applied to inserted or updated rows. Default values in rows already in the table will not change.

	 * Generated Kysely database schema type definition:
	 *  - *Selection*: non nullable.
	 *  - *Insertion*: optional.
	 *  - *Update*: optional.
	 *
	 * @example
	 *
	 *
	 * For the following table schema:
	 *
	 * ```ts
	 * const books = pgTable({
	 *   columns: {
	 *     description: pgText().default("TBD"),
	 *     created_at: pgTimestampTz().default(sql`now()`),
	 *   }
	 * })
	 * ```
	 *
	 * The generated up migration will be:
	 *
	 * ```ts
	 * await kysely.schema
	 *   .createTable("books")
	 *   .addColumn("description", "text", (col) => col.defaultTo(sql`'TBD'::text`))
	 *   .addColumn("created_at", "timestamptz", (col) => col.defaultTo(sql`now()`),
	 * )
	 * ```
	 *
	 * and the Kysely database schema type definition for the `books` table will be:
	 *
	 * ```ts
	 * type books = {
	 *   description: {
	 *     readonly __select__: string;
	 *     readonly __insert__: string | null;
	 *     readonly __update__: string | null;
	 *   },
	 *   created_at: {
	 *     readonly __select__: Date;
	 *     readonly __insert__: Date | string | null;
	 *     readonly __update__: Date | string | null;
	 *   }
	 * }
	 *
	 * ```
	 *
	 * @see PostgreSQL Docs:
	 * {@link https://www.postgresql.org/docs/16/sql-createtable.html#SQL-CREATETABLE-PARMS-DEFAULT | Create Table Default }
	 * and
	 * {@link https://www.postgresql.org/docs/16/sql-altertable.html#SQL-ALTERTABLE-DESC-SET-DROP-DEFAULT | Set/Drop Default }
	 */
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
	/**
	 * @hidden
	 */
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
	/**
	 * @hidden
	 */
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
	/**
	 * @hidden
	 */
	constructor() {
		super("bytea", DefaultValueDataTypes.bytea);
	}

	/**
	 * Assigns a default default data value for the column.
	 *
	 * **Note:** When adding or changing a default value on an existing column, the new value be applied to inserted or updated rows. Default values in rows already in the table will not change.

	 * Generated Kysely database schema type definition:
	 *  - *Selection*: non nullable.
	 *  - *Insertion*: optional.
	 *  - *Update*: optional.
	 *
	 * @example
	 *
	 *
	 * For the following table schema:
	 *
	 * ```ts
	 * const books = pgTable({
	 *   columns: {
	 *     description: pgText().default("TBD"),
	 *     created_at: pgTimestampTz().default(sql`now()`),
	 *   }
	 * })
	 * ```
	 *
	 * The generated up migration will be:
	 *
	 * ```ts
	 * await kysely.schema
	 *   .createTable("books")
	 *   .addColumn("description", "text", (col) => col.defaultTo(sql`'TBD'::text`))
	 *   .addColumn("created_at", "timestamptz", (col) => col.defaultTo(sql`now()`),
	 * )
	 * ```
	 *
	 * and the Kysely database schema type definition for the `books` table will be:
	 *
	 * ```ts
	 * type books = {
	 *   description: {
	 *     readonly __select__: string;
	 *     readonly __insert__: string | null;
	 *     readonly __update__: string | null;
	 *   },
	 *   created_at: {
	 *     readonly __select__: Date;
	 *     readonly __insert__: Date | string | null;
	 *     readonly __update__: Date | string | null;
	 *   }
	 * }
	 *
	 * ```
	 * @see PostgreSQL Docs:
	 * {@link https://www.postgresql.org/docs/16/sql-createtable.html#SQL-CREATETABLE-PARMS-DEFAULT | Create Table Default }
	 * and
	 * {@link https://www.postgresql.org/docs/16/sql-altertable.html#SQL-ALTERTABLE-DESC-SET-DROP-DEFAULT | Set/Drop Default }
	 */
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
	/**
	 * @hidden
	 */
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
	/**
	 * @hidden
	 */
	constructor() {
		super("double precision", DefaultValueDataTypes["double precision"]);
	}
}

export function float4() {
	return new PgFloat4();
}

export class PgFloat4 extends PgColumn<number, number | bigint | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("real", DefaultValueDataTypes.real);
	}
}

export function float8() {
	return new PgFloat8();
}

export class PgFloat8 extends PgColumn<number, number | bigint | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("double precision", DefaultValueDataTypes["double precision"]);
	}
}

export function int2() {
	return new PgInt2();
}

export class PgInt2 extends IdentifiableColumn<number, number | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("smallint", DefaultValueDataTypes.smallint);
	}
}

export function int4() {
	return new PgInt4();
}

export class PgInt4 extends IdentifiableColumn<number, number | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("integer", DefaultValueDataTypes.integer);
	}

	/**
	 * Assigns a default default data value for the column.
	 *
	 * **Note:** When adding or changing a default value on an existing column, the new value be applied to inserted or updated rows. Default values in rows already in the table will not change.

	 * Generated Kysely database schema type definition:
	 *  - *Selection*: non nullable.
	 *  - *Insertion*: optional.
	 *  - *Update*: optional.
	 *
	 * @example
	 *
	 *
	 * For the following table schema:
	 *
	 * ```ts
	 * const books = pgTable({
	 *   columns: {
	 *     description: pgText().default("TBD"),
	 *     created_at: pgTimestampTz().default(sql`now()`),
	 *   }
	 * })
	 * ```
	 *
	 * The generated up migration will be:
	 *
	 * ```ts
	 * await kysely.schema
	 *   .createTable("books")
	 *   .addColumn("description", "text", (col) => col.defaultTo(sql`'TBD'::text`))
	 *   .addColumn("created_at", "timestamptz", (col) => col.defaultTo(sql`now()`),
	 * )
	 * ```
	 *
	 * and the Kysely database schema type definition for the `books` table will be:
	 *
	 * ```ts
	 * type books = {
	 *   description: {
	 *     readonly __select__: string;
	 *     readonly __insert__: string | null;
	 *     readonly __update__: string | null;
	 *   },
	 *   created_at: {
	 *     readonly __select__: Date;
	 *     readonly __insert__: Date | string | null;
	 *     readonly __update__: Date | string | null;
	 *   }
	 * }
	 *
	 * ```
	 *
	 * @see PostgreSQL Docs:
	 * {@link https://www.postgresql.org/docs/16/sql-createtable.html#SQL-CREATETABLE-PARMS-DEFAULT | Create Table Default }
	 * and
	 * {@link https://www.postgresql.org/docs/16/sql-altertable.html#SQL-ALTERTABLE-DESC-SET-DROP-DEFAULT | Set/Drop Default }
	 */
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
	/**
	 * @hidden
	 */
	constructor() {
		super("bigint", DefaultValueDataTypes.bigint);
	}
}

export function integer() {
	return new PgInteger();
}

export class PgInteger extends IdentifiableColumn<number, number | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("integer", DefaultValueDataTypes.integer);
	}

	/**
	 * Assigns a default default data value for the column.
	 *
	 * **Note:** When adding or changing a default value on an existing column, the new value be applied to inserted or updated rows. Default values in rows already in the table will not change.

	 * Generated Kysely database schema type definition:
	 *  - *Selection*: non nullable.
	 *  - *Insertion*: optional.
	 *  - *Update*: optional.
	 *
	 * @example
	 *
	 *
	 * For the following table schema:
	 *
	 * ```ts
	 * const books = pgTable({
	 *   columns: {
	 *     description: pgText().default("TBD"),
	 *     created_at: pgTimestampTz().default(sql`now()`),
	 *   }
	 * })
	 * ```
	 *
	 * The generated up migration will be:
	 *
	 * ```ts
	 * await kysely.schema
	 *   .createTable("books")
	 *   .addColumn("description", "text", (col) => col.defaultTo(sql`'TBD'::text`))
	 *   .addColumn("created_at", "timestamptz", (col) => col.defaultTo(sql`now()`),
	 * )
	 * ```
	 *
	 * and the Kysely database schema type definition for the `books` table will be:
	 *
	 * ```ts
	 * type books = {
	 *   description: {
	 *     readonly __select__: string;
	 *     readonly __insert__: string | null;
	 *     readonly __update__: string | null;
	 *   },
	 *   created_at: {
	 *     readonly __select__: Date;
	 *     readonly __insert__: Date | string | null;
	 *     readonly __update__: Date | string | null;
	 *   }
	 * }
	 *
	 * ```
	 *
	 * @see PostgreSQL Docs:
	 * {@link https://www.postgresql.org/docs/16/sql-createtable.html#SQL-CREATETABLE-PARMS-DEFAULT | Create Table Default }
	 * and
	 * {@link https://www.postgresql.org/docs/16/sql-altertable.html#SQL-ALTERTABLE-DESC-SET-DROP-DEFAULT | Set/Drop Default }
	 */
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
	/**
	 * @hidden
	 */
	constructor() {
		super("json", DefaultValueDataTypes.json);
	}
}

export function jsonb() {
	return new PgJsonB();
}

export class PgJsonB extends PgColumn<JsonValue, string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("jsonb", DefaultValueDataTypes.jsonb);
	}
}

export function real() {
	return new PgReal();
}

export class PgReal extends PgColumn<number, number | bigint | string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("real", DefaultValueDataTypes.real);
	}
}

export function uuid() {
	return new PgUuid();
}

export class PgUuid extends PgColumn<string, string> {
	/**
	 * @hidden
	 */
	constructor() {
		super("uuid", DefaultValueDataTypes.uuid);
	}

	/**
	 * Assigns a default default data value for the column.
	 *
	 * **Note:** When adding or changing a default value on an existing column, the new value be applied to inserted or updated rows. Default values in rows already in the table will not change.

	 * Generated Kysely database schema type definition:
	 *  - *Selection*: non nullable.
	 *  - *Insertion*: optional.
	 *  - *Update*: optional.
	 *
	 * @example
	 *
	 *
	 * For the following table schema:
	 *
	 * ```ts
	 * const books = pgTable({
	 *   columns: {
	 *     description: pgText().default("TBD"),
	 *     created_at: pgTimestampTz().default(sql`now()`),
	 *   }
	 * })
	 * ```
	 *
	 * The generated up migration will be:
	 *
	 * ```ts
	 * await kysely.schema
	 *   .createTable("books")
	 *   .addColumn("description", "text", (col) => col.defaultTo(sql`'TBD'::text`))
	 *   .addColumn("created_at", "timestamptz", (col) => col.defaultTo(sql`now()`),
	 * )
	 * ```
	 *
	 * and the Kysely database schema type definition for the `books` table will be:
	 *
	 * ```ts
	 * type books = {
	 *   description: {
	 *     readonly __select__: string;
	 *     readonly __insert__: string | null;
	 *     readonly __update__: string | null;
	 *   },
	 *   created_at: {
	 *     readonly __select__: Date;
	 *     readonly __insert__: Date | string | null;
	 *     readonly __update__: Date | string | null;
	 *   }
	 * }
	 *
	 * ```
	 * @see PostgreSQL Docs:
	 * {@link https://www.postgresql.org/docs/16/sql-createtable.html#SQL-CREATETABLE-PARMS-DEFAULT | Create Table Default }
	 * and
	 * {@link https://www.postgresql.org/docs/16/sql-altertable.html#SQL-ALTERTABLE-DESC-SET-DROP-DEFAULT | Set/Drop Default }
	 */
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
	/**
	 * @hidden
	 */
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

/**
 * Column that stores variable-length string up an optional characters of n length.
 *
 * Without a `maximumLength` specified, the column accepts strings of any length.
 *
 * @param maximumLength - Optional Maximum character length of strings in the column. Must be greater than zero and cannot exceed 10,485,760.
 * @remarks
 * *PostgreSQL native data type*: `character varying(n)`.
 *
 * The longest possible character string that can be stored is about 1 GB.
 * @example
 *
 * Kinetic schema for a database with a `users` table with `name` and `description` columns:
 *
 * ```ts
 * const users = pgTable({
 *   columns: {
 *     name: pgVarchar(255),
 *     description: pgVarchar(),
 *   }
 * });
 *
 * const database = pgDatabase({
 *   tables: {
 *     users,
 *   },
 * });
 * ```
 *
 * The generated Kysely database schema type definition (`typeof database.kyselyDatabase`) will be:
 * ```ts
 * type DB = {
 *   users: {
 *     name: {
 *       readonly __select__: string | null;
 *       readonly __insert__: string | null | undefined;
 *       readonly __update__: string | null;
 *     },
 *     description: {
 *       readonly __select__: string | null;
 *       readonly __insert__: string | null | undefined;
 *       readonly __update__: string | null;
 *     }
 *   }
 * }
 * ```
 *
 * The generated migration with `npx kinetic generate` will be:
 * ```ts
 * export async function up(db: Kysely<any>): Promise<void> {
 *   await kysely.schema
 *     .createTable("users")
 *     .addColumn("name", "varchar(255)")
 *     .addColumn("description", "varchar")
 *     .execute();
 * }
 *
 * export async function down(db: Kysely<any>): Promise<void> {
 *   await kysely.schema
 *     .dropTable("users")
 *     .execute();
 * }
 * ```
 * @see
 * {@link pgDatabase}
 *
 * {@link pgTable}
 *
 * PostgreSQL Docs: {@link https://www.postgresql.org/docs/current/datatype-character.html#DATATYPE-CHARACTER | character varying(n)}
 *
 * @group Columns
 */
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
	/**
	 * @hidden
	 */
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
	/**
	 * @hidden
	 */
	constructor(precision?: DateTimePrecision) {
		super("time", precision);
	}
}

export abstract class PgTimestampColumn<T, U> extends PgColumn<T, U> {
	/**
	 * @hidden
	 */
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
	/**
	 * @hidden
	 */
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
	/**
	 * @hidden
	 */
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

export function pgEnum<N extends string>(name: string, values: N[]) {
	return new PgEnum(name, values);
}

export class PgEnum<N extends string> extends PgColumn<N, N> {
	protected readonly values: N[];

	/**
	 * @hidden
	 */
	constructor(name: string, values: N[]) {
		super(name, DefaultValueDataTypes.numeric);
		this.values = values;
		this.info.enum = true;
	}

	/**
	 * Assigns a default default data value for the column.
	 *
	 * **Note:** When adding or changing a default value on an existing column, the new value be applied to inserted or updated rows. Default values in rows already in the table will not change.

	 * Generated Kysely database schema type definition:
	 *  - *Selection*: non nullable.
	 *  - *Insertion*: optional.
	 *  - *Update*: optional.
	 *
	 * @example
	 *
	 *
	 * For the following table schema:
	 *
	 * ```ts
	 * const books = pgTable({
	 *   columns: {
	 *     description: pgText().default("TBD"),
	 *     created_at: pgTimestampTz().default(sql`now()`),
	 *   }
	 * })
	 * ```
	 *
	 * The generated up migration will be:
	 *
	 * ```ts
	 * await kysely.schema
	 *   .createTable("books")
	 *   .addColumn("description", "text", (col) => col.defaultTo(sql`'TBD'::text`))
	 *   .addColumn("created_at", "timestamptz", (col) => col.defaultTo(sql`now()`),
	 * )
	 * ```
	 *
	 * and the Kysely database schema type definition for the `books` table will be:
	 *
	 * ```ts
	 * type books = {
	 *   description: {
	 *     readonly __select__: string;
	 *     readonly __insert__: string | null;
	 *     readonly __update__: string | null;
	 *   },
	 *   created_at: {
	 *     readonly __select__: Date;
	 *     readonly __insert__: Date | string | null;
	 *     readonly __update__: Date | string | null;
	 *   }
	 * }
	 *
	 * ```
	 *
	 * @see PostgreSQL Docs:
	 * {@link https://www.postgresql.org/docs/16/sql-createtable.html#SQL-CREATETABLE-PARMS-DEFAULT | Create Table Default }
	 * and
	 * {@link https://www.postgresql.org/docs/16/sql-altertable.html#SQL-ALTERTABLE-DESC-SET-DROP-DEFAULT | Set/Drop Default }
	 */
	default(value: N) {
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	| PgEnum<any>;

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
