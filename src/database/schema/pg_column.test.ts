import { ColumnDataType, type Expression, sql } from "kysely";
import { Equal, Expect } from "type-testing";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { PgColumnBase } from "./PgColumnBase.js";
import {
	ColumnInfo,
	ColumnUnique,
	DefaultValueDataTypes,
	PgBigInt,
	PgBigSerial,
	PgBoolean,
	PgBytea,
	PgChar,
	PgColumn,
	PgColumnWithPrecision,
	PgDate,
	PgDoublePrecision,
	PgFloat4,
	PgFloat8,
	PgGeneratedColumn,
	PgInt2,
	PgInt4,
	PgInt8,
	PgInteger,
	PgJson,
	PgJsonB,
	PgNumeric,
	PgReal,
	PgSerial,
	PgText,
	PgTime,
	PgTimeTz,
	PgTimestamp,
	PgTimestampTz,
	PgUuid,
	PgVarChar,
	pgBigInt,
	pgBigSerial,
	pgBoolean,
	pgBytea,
	pgChar,
	pgDate,
	pgDoublePrecision,
	pgFloat4,
	pgFloat8,
	pgInt2,
	pgInt4,
	pgInt8,
	pgInteger,
	pgJson,
	pgJsonB,
	pgNumeric,
	pgReal,
	pgSerial,
	pgText,
	pgTime,
	pgTimeTz,
	pgTimestamp,
	pgTimestampTz,
	pgUuid,
	pgVarChar,
} from "./pg_column.js";
import { pgTable } from "./table.js";

type ColumnWithDefaultContext = {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	column: PgColumn<any, any>;
	columnInfo: ColumnInfo;
};

type ColumnContext = {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	column: PgColumnBase<any, any, any>;
	columnInfo: ColumnInfo;
};

type ColumnWithoutDefaultContext = {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	column: PgGeneratedColumn<any, any>;
	columnInfo: ColumnInfo;
};

describe("PgColumnBase", () => {
	test("constructor accepts only kysely column data types", () => {
		const expect: Expect<
			Equal<ColumnDataType, ConstructorParameters<typeof PgColumnBase>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	beforeEach((context: ColumnContext) => {
		context.column = new PgColumnBase("integer");
		context.columnInfo = Object.fromEntries(
			Object.entries(context.column),
		).info;
	});

	testColumnDefaults("integer");
	testColumnMethods();
});

describe("PgColumn", () => {
	beforeEach((context: ColumnWithDefaultContext) => {
		context.column = new PgColumn("integer", DefaultValueDataTypes.integer);
		context.columnInfo = Object.fromEntries(
			Object.entries(context.column),
		).info;
	});

	testBase();

	test("primaryKey() sets primaryKey to true", (context: ColumnContext) => {
		const column = pgInteger();
		column.primaryKey();
		const columnInfo = Object.fromEntries(Object.entries(column)).info;
		expect(columnInfo.primaryKey).toBe(true);
	});

	test("isNullable is true", (context: ColumnContext) => {
		expect(context.columnInfo.isNullable).toBe(true);
	});

	test("notNull() sets isNullable to false", (context: ColumnWithDefaultContext) => {
		context.column.notNull();
		expect(context.columnInfo.isNullable).toBe(false);
	});

	describe("defaultTo()", () => {
		test("defaultTo accepts insert column data types or an arbitrary SQL expression", () => {
			const integerColumn = pgInteger();
			const integerColumnExpect: Expect<
				Equal<
					string | number | Expression<unknown>,
					Parameters<typeof integerColumn.defaultTo>[0]
				>
			> = true;
			expectTypeOf(integerColumnExpect).toMatchTypeOf<boolean>();

			const textColumn = pgText();
			const textColumnExpect: Expect<
				Equal<
					string | Expression<unknown>,
					Parameters<typeof textColumn.defaultTo>[0]
				>
			> = true;
			expectTypeOf(textColumnExpect).toMatchTypeOf<boolean>();
		});

		test("defaultTo sets default value", (context: ColumnWithDefaultContext) => {
			const column = pgText();
			const info = Object.fromEntries(Object.entries(column)).info;

			const someSqlExpression = sql`now()`;
			column.defaultTo(someSqlExpression);
			expect(info.defaultValue).toBe(someSqlExpression);
		});
	});

	test("generatedAlwaysAsIdentity sets identity to ALWAYS", (context: ColumnWithDefaultContext) => {
		context.column.generatedAlwaysAsIdentity();
		expect(context.columnInfo.identity).toBe("ALWAYS");
	});

	test("generatedByDefaultAsIdentity sets identity to BY DEFAULT", (context: ColumnWithDefaultContext) => {
		context.column.generatedByDefaultAsIdentity();
		expect(context.columnInfo.identity).toBe("BY DEFAULT");
	});
});

describe("PgGeneratedColumn", () => {
	beforeEach((context: ColumnWithoutDefaultContext) => {
		context.column = new PgGeneratedColumn(
			"serial",
			DefaultValueDataTypes.serial,
		);
		context.columnInfo = Object.fromEntries(
			Object.entries(context.column),
		).info;
	});

	testBase("serial");

	test("primaryKey() sets primaryKey to true", (context: ColumnContext) => {
		const column = pgSerial();
		column.primaryKey();
		const columnInfo = Object.fromEntries(Object.entries(column)).info;
		expect(columnInfo.primaryKey).toBe(true);
	});

	test("does not have defaultTo", (context: ColumnWithoutDefaultContext) => {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		expect(typeof (context.column as any).defaultTo === "function").toBe(false);
	});

	test("does not have notNull", (context: ColumnWithoutDefaultContext) => {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		expect(typeof (context.column as any).notNull === "function").toBe(false);
	});

	test("does not have generatedAlwaysAsIdentity", (context: ColumnWithoutDefaultContext) => {
		expect(
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			typeof (context.column as any).generatedAlwaysAsIdentity === "function",
		).toBe(false);
	});

	test("does not have generatedByDefaultAsIdentity", (context: ColumnWithoutDefaultContext) => {
		expect(
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			typeof (context.column as any).generatedByDefaultAsIdentity ===
				"function",
		).toBe(false);
	});
});

function testBase(expectedDataType = "integer") {
	testColumnDefaults(expectedDataType);
	testColumnMethods();
}

describe("pgBoolean", () => {
	test("returns a PgBoolean instance", () => {
		const column = pgBoolean();
		expect(column).toBeInstanceOf(PgBoolean);
	});

	describe("PgBoolean", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgBoolean()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to boolean", () => {
			const info = Object.fromEntries(Object.entries(pgBoolean())).info;
			expect(info.dataType).toBe("boolean");
		});

		test("defaultTo with column data type", () => {
			const column = pgBoolean();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(true);
			expect(info.defaultValue).toBe("'true'::boolean");
		});
	});
});

describe("pgText", () => {
	test("returns a PgText instance", () => {
		const column = pgText();
		expect(column).toBeInstanceOf(PgText);
	});

	describe("PgText", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgText()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to text", () => {
			const info = Object.fromEntries(Object.entries(pgText())).info;
			expect(info.dataType).toBe("text");
		});

		test("defaultTo with column data type", () => {
			const column = pgText();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("foo");
			expect(info.defaultValue).toBe("'foo'::text");
		});
	});
});

describe("pgBigInt", () => {
	test("returns a PgBigInt instance", () => {
		const column = pgBigInt();
		expect(column).toBeInstanceOf(PgBigInt);
	});

	describe("PgBigInt", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgBigInt()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to bigint", () => {
			const info = Object.fromEntries(Object.entries(pgBigInt())).info;
			expect(info.dataType).toBe("bigint");
		});

		test("defaultTo with column data type", () => {
			const column = pgBigInt();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(12234433444444455n);
			expect(info.defaultValue).toBe("'12234433444444455'::bigint");

			column.defaultTo(12);
			expect(info.defaultValue).toBe("'12'::bigint");

			column.defaultTo("12");
			expect(info.defaultValue).toBe("'12'::bigint");
		});
	});
});

describe("pgBigSerial", () => {
	test("returns a PgBigSerial instance", () => {
		const column = pgBigSerial();
		expect(column).toBeInstanceOf(PgBigSerial);
	});

	describe("PgBigSerial", () => {
		test("inherits from PgColumnWithoutDefault", () => {
			expect(pgBigSerial()).toBeInstanceOf(PgGeneratedColumn);
		});

		test("dataType is set to bigserial", () => {
			const info = Object.fromEntries(Object.entries(pgBigSerial())).info;
			expect(info.dataType).toBe("bigserial");
		});
	});
});

describe("pgBytea", () => {
	test("returns a PgBytea instance", () => {
		const column = pgBytea();
		expect(column).toBeInstanceOf(PgBytea);
	});

	describe("PgBytea", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgBytea()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to bytea", () => {
			const info = Object.fromEntries(Object.entries(pgBytea())).info;
			expect(info.dataType).toBe("bytea");
		});

		test("defaultTo with column data type", () => {
			const column = pgBytea();
			const info = Object.fromEntries(Object.entries(column)).info;

			const buffer = Buffer.from("hello");
			column.defaultTo(buffer);
			expect(info.defaultValue).toBe("'hello'::bytea");

			column.defaultTo(12);
			expect(info.defaultValue).toBe("'12'::bytea");

			column.defaultTo("12");
			expect(info.defaultValue).toBe("'12'::bytea");

			column.defaultTo(true);
			expect(info.defaultValue).toBe("'true'::bytea");
		});
	});
});

describe("pgDate", () => {
	test("returns a PgDate instance", () => {
		const column = pgDate();
		expect(column).toBeInstanceOf(PgDate);
	});

	describe("PgDate", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgDate()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to date", () => {
			const info = Object.fromEntries(Object.entries(pgDate())).info;
			expect(info.dataType).toBe("date");
		});

		test("defaultTo with column data type", () => {
			const column = pgDate();
			const info = Object.fromEntries(Object.entries(column)).info;

			const date = new Date(1);
			column.defaultTo(date);
			expect(info.defaultValue).toBe("'1970-01-01'::date");

			column.defaultTo(new Date(1).toISOString());
			expect(info.defaultValue).toBe("'1970-01-01'::date");
		});
	});
});

describe("pgDoublePrecision", () => {
	test("returns a PgDoublePrecision instance", () => {
		const column = pgDoublePrecision();
		expect(column).toBeInstanceOf(PgDoublePrecision);
	});

	describe("PgDoublePrecision", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgDoublePrecision()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to double precision", () => {
			const info = Object.fromEntries(Object.entries(pgDoublePrecision())).info;
			expect(info.dataType).toBe("double precision");
		});

		test("defaultTo with column data type", () => {
			const column = pgDoublePrecision();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10);
			expect(info.defaultValue).toBe("'10'::double precision");

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::double precision");

			column.defaultTo(102n);
			expect(info.defaultValue).toBe("'102'::double precision");
		});
	});
});

describe("pgFloat4", () => {
	test("returns a PgFloat4 instance", () => {
		const column = pgFloat4();
		expect(column).toBeInstanceOf(PgFloat4);
	});

	describe("PgFloat4", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgFloat4()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to float4", () => {
			const info = Object.fromEntries(Object.entries(pgFloat4())).info;
			expect(info.dataType).toBe("float4");
		});

		test("defaultTo with column data type", () => {
			const column = pgFloat4();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10.4);
			expect(info.defaultValue).toBe("'10.4'::real");

			column.defaultTo("10.4");
			expect(info.defaultValue).toBe("'10.4'::real");

			column.defaultTo(102n);
			expect(info.defaultValue).toBe("'102'::real");
		});
	});
});

describe("pgFloat8", () => {
	test("returns a PgFloat8 instance", () => {
		const column = pgFloat8();
		expect(column).toBeInstanceOf(PgFloat8);
	});

	describe("PgFloat8", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgFloat8()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to float8", () => {
			const info = Object.fromEntries(Object.entries(pgFloat8())).info;
			expect(info.dataType).toBe("float8");
		});

		test("defaultTo with column data type", () => {
			const column = pgFloat8();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10.4);
			expect(info.defaultValue).toBe("'10.4'::double precision");

			column.defaultTo("10.4");
			expect(info.defaultValue).toBe("'10.4'::double precision");

			column.defaultTo(102n);
			expect(info.defaultValue).toBe("'102'::double precision");
		});
	});
});

describe("pgInt2", () => {
	test("returns a PgInt2 instance", () => {
		const column = pgInt2();
		expect(column).toBeInstanceOf(PgInt2);
	});

	describe("PgInt2", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgInt2()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to int2", () => {
			const info = Object.fromEntries(Object.entries(pgInt2())).info;
			expect(info.dataType).toBe("int2");
		});

		test("defaultTo with column data type", () => {
			const column = pgInt2();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10);
			expect(info.defaultValue).toBe("'10'::smallint");

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::smallint");
		});
	});
});

describe("pgInt4", () => {
	test("returns a PgInt4 instance", () => {
		const column = pgInt4();
		expect(column).toBeInstanceOf(PgInt4);
	});

	describe("PgInt4", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgInt4()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to int4", () => {
			const info = Object.fromEntries(Object.entries(pgInt4())).info;
			expect(info.dataType).toBe("int4");
		});

		test("defaultTo with column data type", () => {
			const column = pgInt4();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10);
			expect(info.defaultValue).toBe("'10'::integer");

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::integer");
		});
	});
});

describe("pgInt8", () => {
	test("returns a PgInt8 instance", () => {
		const column = pgInt8();
		expect(column).toBeInstanceOf(PgInt8);
	});

	describe("PgInt8", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgInt8()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to int8", () => {
			const info = Object.fromEntries(Object.entries(pgInt8())).info;
			expect(info.dataType).toBe("int8");
		});

		test("defaultTo with column data type", () => {
			const column = pgInt8();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10);
			expect(info.defaultValue).toBe("'10'::bigint");

			column.defaultTo(100n);
			expect(info.defaultValue).toBe("'100'::bigint");

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::bigint");
		});
	});
});

describe("pgInteger", () => {
	test("returns a PgInteger instance", () => {
		const column = pgInteger();
		expect(column).toBeInstanceOf(PgInteger);
	});

	describe("PgInteger", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgInteger()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to integer", () => {
			const info = Object.fromEntries(Object.entries(pgInteger())).info;
			expect(info.dataType).toBe("integer");
		});

		test("defaultTo with column data type", () => {
			const column = pgInteger();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10);
			expect(info.defaultValue).toBe("'10'::integer");

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::integer");
		});
	});
});

describe("pgJson", () => {
	test("returns a PgJson instance", () => {
		const column = pgJson();
		expect(column).toBeInstanceOf(PgJson);
	});

	describe("PgJson", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgJson()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to json", () => {
			const info = Object.fromEntries(Object.entries(pgJson())).info;
			expect(info.dataType).toBe("json");
		});

		test("defaultTo with column data type", () => {
			const column = pgJson();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::json");

			column.defaultTo('{ "foo": "bar" }');
			expect(info.defaultValue).toBe('\'{ "foo": "bar" }\'::json');
		});
	});
});

describe("pgJsonB", () => {
	test("returns a PgJsonB instance", () => {
		const column = pgJsonB();
		expect(column).toBeInstanceOf(PgJsonB);
	});

	describe("PgJsonB", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgJsonB()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to jsonb", () => {
			const info = Object.fromEntries(Object.entries(pgJsonB())).info;
			expect(info.dataType).toBe("jsonb");
		});

		test("defaultTo with column data type", () => {
			const column = pgJsonB();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::jsonb");

			column.defaultTo('{ "foo": "bar" }');
			expect(info.defaultValue).toBe('\'{ "foo": "bar" }\'::jsonb');
		});
	});
});

describe("pgReal", () => {
	test("returns a PgReal instance", () => {
		const column = pgReal();
		expect(column).toBeInstanceOf(PgReal);
	});

	describe("PgReal", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgReal()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to real", () => {
			const info = Object.fromEntries(Object.entries(pgReal())).info;
			expect(info.dataType).toBe("real");
		});

		test("defaultTo with column data type", () => {
			const column = pgReal();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::real");

			column.defaultTo(10);
			expect(info.defaultValue).toBe("'10'::real");

			column.defaultTo(100n);
			expect(info.defaultValue).toBe("'100'::real");
		});
	});
});

describe("pgSerial", () => {
	test("returns a PgSerial instance", () => {
		const column = pgSerial();
		expect(column).toBeInstanceOf(PgSerial);
	});

	describe("PgSerial", () => {
		test("inherits from PgColumnWithoutDefault", () => {
			expect(pgSerial()).toBeInstanceOf(PgGeneratedColumn);
		});

		test("dataType is set to serial", () => {
			const info = Object.fromEntries(Object.entries(pgSerial())).info;
			expect(info.dataType).toBe("serial");
		});

		test("isNullable is false", () => {
			const info = Object.fromEntries(Object.entries(pgSerial())).info;
			expect(info.isNullable).toBe(false);
		});
	});
});

describe("pgUuid", () => {
	test("returns a PgUuid instance", () => {
		const column = pgUuid();
		expect(column).toBeInstanceOf(PgUuid);
	});

	describe("PgUuid", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgUuid()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to uuid", () => {
			const info = Object.fromEntries(Object.entries(pgUuid())).info;
			expect(info.dataType).toBe("uuid");
		});

		test("defaultTo with column data type", () => {
			const column = pgUuid();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::uuid");
		});
	});
});

describe("pgVarChar", () => {
	test("returns a PgVarChar instance", () => {
		const column = pgVarChar();
		expect(column).toBeInstanceOf(PgVarChar);
	});

	describe("PgVarChar", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgVarChar()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to varchar", () => {
			const info = Object.fromEntries(Object.entries(pgVarChar())).info;
			expect(info.dataType).toBe("varchar");
		});

		test("defaultTo with column data type", () => {
			const column = pgVarChar();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::character varying");
		});
	});

	describe("with optional maximumLength", () => {
		test("characterMaximumLength is set to maximumLength", () => {
			const column = pgVarChar(255);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.characterMaximumLength).toBe(255);
		});

		test("data type has maximumLength", () => {
			const info = Object.fromEntries(Object.entries(pgVarChar(255))).info;
			expect(info.dataType).toBe("varchar(255)");
		});

		test("defaultTo with column data type", () => {
			const column = pgVarChar(100);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::character varying");
		});
	});
});

describe("pgChar", () => {
	test("returns a PgChar instance", () => {
		const column = pgChar();
		expect(column).toBeInstanceOf(PgChar);
	});

	describe("PgChar", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgChar()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to char(1)", () => {
			const info = Object.fromEntries(Object.entries(pgChar())).info;
			expect(info.dataType).toBe("char(1)");
		});

		test("characterMaximumLength is set to 1", () => {
			const column = pgChar();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.characterMaximumLength).toBe(1);
		});

		test("defaultTo with column data type", () => {
			const column = pgChar();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::character(1)");
		});
	});

	describe("with optional maximumLength", () => {
		test("characterMaximumLength is set to maximumLength", () => {
			const column = pgChar(255);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.characterMaximumLength).toBe(255);
		});

		test("data type has maximumLength", () => {
			const info = Object.fromEntries(Object.entries(pgChar(255))).info;
			expect(info.dataType).toBe("char(255)");
		});

		test("defaultTo with column data type", () => {
			const column = pgChar(200);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::character(1)");
		});
	});
});

describe("PgColumnWithPrecision", () => {
	test("inherits from PgColumnWithDefault", () => {
		const column = new PgColumnWithPrecision("time");
		expect(column).toBeInstanceOf(PgColumn);
	});

	test("optional precision accepts values from 0 to 6", () => {
		type range = 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;
		const expect: Expect<
			Equal<range, ConstructorParameters<typeof PgColumnWithPrecision>[1]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});
});

describe("pgTime", () => {
	test("returns a PgTime instance", () => {
		const column = pgTime();
		expect(column).toBeInstanceOf(PgTime);
	});

	describe("PgTime", () => {
		test("inherits from PgColumnWithPrecision", () => {
			expect(pgTime()).toBeInstanceOf(PgColumnWithPrecision);
		});

		test("dataType is set to time", () => {
			const info = Object.fromEntries(Object.entries(pgTime())).info;
			expect(info.dataType).toBe("time");
		});

		test("datetimePrecision is set to null", () => {
			const column = pgTime();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("defaultTo with column data type", () => {
			const column = pgTime();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("04:05 AM");
			expect(info.defaultValue).toBe("'04:05 AM'::time without time zone");
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = pgTime(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(Object.entries(pgTime(1))).info;
			expect(info.dataType).toBe("time(1)");
		});

		test("defaultTo with column data type", () => {
			const column = pgTime(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("04:05 AM");
			expect(info.defaultValue).toBe("'04:05 AM'::time without time zone");
		});
	});
});

describe("pgTimeTz", () => {
	test("returns a PgTimeTz instance", () => {
		const column = pgTimeTz();
		expect(column).toBeInstanceOf(PgTimeTz);
	});

	describe("PgTimeTz", () => {
		test("inherits from PgColumnWithPrecision", () => {
			expect(pgTimeTz()).toBeInstanceOf(PgColumnWithPrecision);
		});

		test("dataType is set to timetz", () => {
			const info = Object.fromEntries(Object.entries(pgTimeTz())).info;
			expect(info.dataType).toBe("timetz");
		});

		test("datetimePrecision is set to null", () => {
			const column = pgTimeTz();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("defaultTo with column data type", () => {
			const column = pgTimeTz();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("04:05:06-08:00");
			expect(info.defaultValue).toBe("'04:05:06-08:00'::time with time zone");
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = pgTimeTz(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(Object.entries(pgTimeTz(1))).info;
			expect(info.dataType).toBe("timetz(1)");
		});

		test("defaultTo with column data type", () => {
			const column = pgTimeTz(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("04:05:06-08:00");
			expect(info.defaultValue).toBe("'04:05:06-08:00'::time with time zone");
		});
	});
});

describe("pgTimestamp", () => {
	test("returns a PgTimestamp instance", () => {
		const column = pgTimestamp();
		expect(column).toBeInstanceOf(PgTimestamp);
	});

	describe("PgTimestamp", () => {
		test("inherits from PgColumnWithPrecision", () => {
			expect(pgTimestamp()).toBeInstanceOf(PgColumnWithPrecision);
		});

		test("dataType is set to timestamp", () => {
			const info = Object.fromEntries(Object.entries(pgTimestamp())).info;
			expect(info.dataType).toBe("timestamp");
		});

		test("datetimePrecision is set to null", () => {
			const column = pgTimestamp();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("defaultTo with column data type", () => {
			const column = pgTimestamp();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(new Date(1));
			expect(info.defaultValue).toBe(
				"'1970-01-01T00:00:00.001Z'::timestamp without time zone",
			);
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = pgTimestamp(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(Object.entries(pgTimestamp(1))).info;
			expect(info.dataType).toBe("timestamp(1)");
		});

		test("defaultTo with column data type", () => {
			const column = pgTimestamp(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(new Date(1));
			expect(info.defaultValue).toBe(
				"'1970-01-01T00:00:00.001Z'::timestamp without time zone",
			);
		});
	});
});

describe("pgTimestampTz", () => {
	test("returns a PgTimestampTz instance", () => {
		const column = pgTimestampTz();
		expect(column).toBeInstanceOf(PgTimestampTz);
	});

	describe("PgTimestampTz", () => {
		test("inherits from PgColumnWithPrecision", () => {
			expect(pgTimestampTz()).toBeInstanceOf(PgColumnWithPrecision);
		});

		test("dataType is set to timestamptz", () => {
			const info = Object.fromEntries(Object.entries(pgTimestampTz())).info;
			expect(info.dataType).toBe("timestamptz");
		});

		test("datetimePrecision is set to null", () => {
			const column = pgTimestampTz();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("defaultTo with column data type", () => {
			const column = pgTimestampTz();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(new Date(1));
			expect(info.defaultValue).toBe(
				"'1970-01-01T00:00:00.001Z'::timestamp with time zone",
			);
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = pgTimestampTz(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(Object.entries(pgTimestampTz(1))).info;
			expect(info.dataType).toBe("timestamptz(1)");
		});

		test("defaultTo with column data type", () => {
			const column = pgTimestampTz(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(new Date(1));
			expect(info.defaultValue).toBe(
				"'1970-01-01T00:00:00.001Z'::timestamp with time zone",
			);
		});
	});
});

describe("pgNumeric", () => {
	test("returns a PgNumeric instance", () => {
		const column = pgNumeric();
		expect(column).toBeInstanceOf(PgNumeric);
	});

	describe("PgNumeric", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgNumeric()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to numeric", () => {
			const info = Object.fromEntries(Object.entries(pgNumeric())).info;
			expect(info.dataType).toBe("numeric");
		});

		test("numericPrecision is set to null", () => {
			const column = pgNumeric();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericPrecision).toBe(null);
		});

		test("numericScale is set to null", () => {
			const column = pgNumeric();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericScale).toBe(null);
		});

		test("defaultTo with column data type", () => {
			const column = pgNumeric();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(1);
			expect(info.defaultValue).toBe("'1'::numeric");

			column.defaultTo("1");
			expect(info.defaultValue).toBe("'1'::numeric");

			column.defaultTo(1.1);
			expect(info.defaultValue).toBe("'1.1'::numeric");

			column.defaultTo("1.1");
			expect(info.defaultValue).toBe("'1.1'::numeric");

			column.defaultTo(100n);
			expect(info.defaultValue).toBe("'100'::numeric");
		});
	});

	describe("with optional precision", () => {
		test("numericPrecision is set to precision", () => {
			const column = pgNumeric(4);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericPrecision).toBe(4);
		});

		test("numericScale is set to 0", () => {
			const column = pgNumeric(4);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericScale).toBe(0);
		});

		test("data type has precision and scale", () => {
			const info = Object.fromEntries(Object.entries(pgNumeric(5))).info;
			expect(info.dataType).toBe("numeric(5, 0)");
		});

		test("defaultTo with column data type", () => {
			const column = pgNumeric(5);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(1);
			expect(info.defaultValue).toBe("'1'::numeric");

			column.defaultTo("1");
			expect(info.defaultValue).toBe("'1'::numeric");

			column.defaultTo(1.1);
			expect(info.defaultValue).toBe("'1.1'::numeric");

			column.defaultTo("1.1");
			expect(info.defaultValue).toBe("'1.1'::numeric");

			column.defaultTo(100n);
			expect(info.defaultValue).toBe("'100'::numeric");
		});
	});

	describe("with scale", () => {
		test("numericScale is set to scale", () => {
			const column = pgNumeric(4, 5);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericScale).toBe(5);
		});

		test("data type has precision and scale", () => {
			const info = Object.fromEntries(Object.entries(pgNumeric(4, 5))).info;
			expect(info.dataType).toBe("numeric(4, 5)");
		});

		test("defaultTo with column data type", () => {
			const column = pgNumeric(5, 1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(1);
			expect(info.defaultValue).toBe("'1'::numeric");

			column.defaultTo("1");
			expect(info.defaultValue).toBe("'1'::numeric");

			column.defaultTo(1.1);
			expect(info.defaultValue).toBe("'1.1'::numeric");

			column.defaultTo("1.1");
			expect(info.defaultValue).toBe("'1.1'::numeric");

			column.defaultTo(100n);
			expect(info.defaultValue).toBe("'100'::numeric");
		});
	});
});

function testColumnDefaults(expectedDataType: string) {
	describe("default column info", () => {
		test("dataType is set to the provided data type", (context: ColumnContext) => {
			expect(context.columnInfo.dataType).toBe(expectedDataType);
		});

		test("defaultValue is null", (context: ColumnContext) => {
			expect(context.columnInfo.defaultValue).toBe(null);
		});

		test("characterMaximumLength is null", (context: ColumnContext) => {
			expect(context.columnInfo.characterMaximumLength).toBe(null);
		});

		test("characterMaximumLength is null", (context: ColumnContext) => {
			expect(context.columnInfo.characterMaximumLength).toBe(null);
		});

		test("numericPrecision is null", (context: ColumnContext) => {
			expect(context.columnInfo.numericPrecision).toBe(null);
		});

		test("numericScale is null", (context: ColumnContext) => {
			expect(context.columnInfo.numericScale).toBe(null);
		});

		test("datetimePrecision is null", (context: ColumnContext) => {
			expect(context.columnInfo.datetimePrecision).toBe(null);
		});

		test("renameFrom is null", (context: ColumnContext) => {
			expect(context.columnInfo.renameFrom).toBe(null);
		});

		test("primaryKey is null", (context: ColumnContext) => {
			expect(context.columnInfo.primaryKey).toBe(null);
		});

		test("foreignKeyConstraint is null", (context: ColumnContext) => {
			expect(context.columnInfo.foreignKeyConstraint).toBe(null);
		});

		test("identity is null", (context: ColumnContext) => {
			expect(context.columnInfo.identity).toBe(null);
		});
	});
}

function testColumnMethods(testNull = true) {
	test("renameFrom() sets renameFrom", (context: ColumnContext) => {
		context.column.renameFrom("old_name");
		expect(context.columnInfo.renameFrom).toBe("old_name");
	});

	describe("references()", () => {
		test("references() sets foreignKeyConstraint", (context: ColumnContext) => {
			const users = pgTable("users", {
				columns: {
					id: pgSerial(),
				},
			});
			context.column.references(users, "id");
			expect(context.columnInfo.foreignKeyConstraint).toEqual({
				table: "users",
				column: "id",
				options: "no action;no action",
			});
		});

		test("references() sets foreignKeyConstraint on delete", (context: ColumnContext) => {
			const users = pgTable("users", {
				columns: {
					id: pgSerial(),
				},
			});
			context.column.references(users, "id", { onDelete: "cascade" });
			expect(context.columnInfo.foreignKeyConstraint).toEqual({
				table: "users",
				column: "id",
				options: "cascade;no action",
			});
		});

		test("references() sets foreignKeyConstraint on update", (context: ColumnContext) => {
			const users = pgTable("users", {
				columns: {
					id: pgSerial(),
				},
			});
			context.column.references(users, "id", { onUpdate: "cascade" });
			expect(context.columnInfo.foreignKeyConstraint).toEqual({
				table: "users",
				column: "id",
				options: "no action;cascade",
			});
		});
	});

	test("unique() sets unique info", (context: ColumnContext) => {
		context.column.unique();
		expect(context.columnInfo.unique).toBe(ColumnUnique.NullsDistinct);
	});

	test("nullsNotDistinct() sets unique info when unique() has been called", (context: ColumnContext) => {
		const col = context.column.unique();
		col.nullsNotDistinct();
		expect(context.columnInfo.unique).toBe(ColumnUnique.NullsNotDistinct);
	});

	test("nullsNotDistinct() does not set unique info when unique() has not been called", (context: ColumnContext) => {
		context.column.nullsNotDistinct();
		expect(context.columnInfo.unique).toBe(null);
	});
}
