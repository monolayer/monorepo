import { ColumnDataType, type Expression, sql } from "kysely";
import { Equal, Expect } from "type-testing";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { z } from "zod";
import {
	type Boolish,
	ColumnInfo,
	DefaultValueDataTypes,
	PgBigInt,
	PgBigSerial,
	PgBoolean,
	PgBytea,
	PgChar,
	PgColumn,
	PgColumnBase,
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
	bigint,
	bigserial,
	boolean,
	bytea,
	char,
	date,
	doublePrecision,
	float4,
	float8,
	int2,
	int4,
	int8,
	integer,
	json,
	jsonb,
	numeric,
	real,
	serial,
	text,
	time,
	timestamp,
	timestamptz,
	timetz,
	uuid,
	varchar,
} from "../../src/database/schema/pg_column.js";
import { PgEnum, pgEnum } from "../../src/database/schema/pg_column.js";

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

const tenCentillionBitInt =
	100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000n;

const elevenCentillionBitInt =
	1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000n;

const tenUnDecillionBigInt = 10000000000000000000000000000000000000n;
const eleventUnDecillionBigInt = 100000000000000000000000000000000000000n;

describe("PgColumnBase", () => {
	test("constructor accepts kysely column data types and smallint", () => {
		const expect: Expect<
			Equal<
				ColumnDataType | "smallint",
				ConstructorParameters<typeof PgColumnBase>[0]
			>
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

	test("isNullable is true", (context: ColumnContext) => {
		expect(context.columnInfo.isNullable).toBe(true);
	});

	test("notNull() sets isNullable to false", (context: ColumnWithDefaultContext) => {
		context.column.notNull();
		expect(context.columnInfo.isNullable).toBe(false);
	});

	test("is not a primary key by default", (context: ColumnWithDefaultContext) => {
		expect(context.column._isPrimaryKey).toBe(false);
	});

	describe("defaultTo()", () => {
		test("defaultTo accepts insert column data types or an arbitrary SQL expression", () => {
			const integerColumn = integer();
			const integerColumnExpect: Expect<
				Equal<
					string | number | Expression<unknown>,
					Parameters<typeof integerColumn.defaultTo>[0]
				>
			> = true;
			expectTypeOf(integerColumnExpect).toMatchTypeOf<boolean>();

			const textColumn = text();
			const textColumnExpect: Expect<
				Equal<
					string | Expression<unknown>,
					Parameters<typeof textColumn.defaultTo>[0]
				>
			> = true;
			expectTypeOf(textColumnExpect).toMatchTypeOf<boolean>();
		});

		test("defaultTo sets default value", (context: ColumnWithDefaultContext) => {
			const column = text();
			const info = Object.fromEntries(Object.entries(column)).info;

			const someSqlExpression = sql`now()`;
			column.defaultTo(someSqlExpression);
			expect(info.defaultValue).toBe(someSqlExpression);
		});
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

	test("is not a primary key by default", (context: ColumnWithDefaultContext) => {
		expect(context.column._isPrimaryKey).toBe(false);
	});
});

describe("PgIdentifiableColumn", () => {
	test("generatedAlwaysAsIdentity sets identity to ALWAYS", () => {
		const column = integer();
		column.generatedAlwaysAsIdentity();
		const columnInfo = Object.fromEntries(Object.entries(column)).info;
		expect(columnInfo.identity).toBe("ALWAYS");
	});

	test("generatedByDefaultAsIdentity sets identity to BY DEFAULT", () => {
		const column = integer();
		column.generatedByDefaultAsIdentity();
		const columnInfo = Object.fromEntries(Object.entries(column)).info;
		expect(columnInfo.identity).toBe("BY DEFAULT");
	});
});

function testBase(expectedDataType = "integer") {
	testColumnDefaults(expectedDataType);
	testColumnMethods();
}

describe("pgBoolean", () => {
	test("returns a PgBoolean instance", () => {
		const column = boolean();
		expect(column).toBeInstanceOf(PgBoolean);
	});

	describe("PgBoolean", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(boolean()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to boolean", () => {
			const info = Object.fromEntries(Object.entries(boolean())).info;
			expect(info.dataType).toBe("boolean");
		});

		test("defaultTo with column data type", () => {
			const column = boolean();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(true);
			expect(info.defaultValue).toBe("true");

			column.defaultTo(false);
			expect(info.defaultValue).toBe("false");

			column.defaultTo("true");
			expect(info.defaultValue).toBe("true");

			column.defaultTo("false");
			expect(info.defaultValue).toBe("false");

			column.defaultTo("yes");
			expect(info.defaultValue).toBe("yes");

			column.defaultTo("no");
			expect(info.defaultValue).toBe("no");

			column.defaultTo("on");
			expect(info.defaultValue).toBe("on");

			column.defaultTo("off");
			expect(info.defaultValue).toBe("off");

			column.defaultTo("1");
			expect(info.defaultValue).toBe("1");

			column.defaultTo("0");
			expect(info.defaultValue).toBe("0");

			column.defaultTo(1);
			expect(info.defaultValue).toBe("1");

			column.defaultTo(0);
			expect(info.defaultValue).toBe("0");

			const expression = sql`true`;
			column.defaultTo(expression);
			expect(info.defaultValue).toBe(expression);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = boolean() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = boolean() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});

		describe("column type", () => {
			test('insert: boolean, "yes", "no", "on", "off", 1, 0, "1", "0", null', () => {
				const column = boolean();
				type ColumnType = typeof column._columnType.__insert__;
				type Expected =
					| boolean
					| "true"
					| "false"
					| 1
					| 0
					| "1"
					| "0"
					| "on"
					| "off"
					| "yes"
					| "no"
					| null;
				const isEqual: Expect<Equal<ColumnType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("select: boolean or null", () => {
				const column = boolean();
				type ColumnType = typeof column._columnType.__select__;
				type Expected = boolean | null;
				const isEqual: Expect<Equal<ColumnType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test('update: boolean, "true", "false", "yes", "no", "on", "off", 1, 0, "1", "0", or null', () => {
				const column = boolean();
				type ColumnType = typeof column._columnType.__update__;
				type Expected =
					| boolean
					| "true"
					| "false"
					| 1
					| 0
					| "1"
					| "0"
					| "on"
					| "off"
					| "yes"
					| "no"
					| null;
				null;
				const isEqual: Expect<Equal<ColumnType, Expected>> = true;
				expect(isEqual).toBe(true);
			});
		});

		describe("Zod", () => {
			describe("by default", () => {
				test("input type is boolean, Boolish or null", () => {
					const column = boolean();
					const schema = column.zodSchema();
					type InpuType = z.input<typeof schema>;
					type Expected = boolean | Boolish | null;
					const isEqual: Expect<Equal<InpuType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("output type is boolean or null", () => {
					const column = boolean();
					const schema = column.zodSchema();
					type OutputType = z.output<typeof schema>;
					type Expected = boolean | null;
					const isEqual: Expect<Equal<OutputType, Expected>> = true;
					const booleanResult = schema.safeParse(true);
					expect(booleanResult.success).toBe(true);
					if (booleanResult.success) {
						expect(booleanResult.data).toBe(true);
					}
					const nullResult = schema.safeParse(null);
					expect(nullResult.success).toBe(true);
					if (nullResult.success) {
						expect(nullResult.data).toBe(null);
					}
					expect(isEqual).toBe(true);
				});

				test("output type is boolean with notNull", () => {
					const column = boolean().notNull();
					const schema = column.zodSchema();
					type OutputType = z.output<typeof schema>;
					type Expected = boolean;
					const isEqual: Expect<Equal<OutputType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("parses boolean", () => {
					const column = boolean();
					const schema = column.zodSchema();
					const result = schema.safeParse(true);
					expect(result.success).toBe(true);
					if (result.success) {
						expect(result.data).toBe(true);
					}
				});

				test("parses null", () => {
					const column = boolean();
					const schema = column.zodSchema();
					const result = schema.safeParse(null);
					expect(result.success).toBe(true);
					if (result.success) {
						expect(result.data).toBe(null);
					}
				});

				test("does not parse undefined", () => {
					const column = boolean();
					const schema = column.zodSchema();
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("parses with coercion with boolish values", () => {
					const column = boolean();
					const schema = z.object({
						true: column.zodSchema(),
						false: column.zodSchema(),
						yes: column.zodSchema(),
						no: column.zodSchema(),
						one: column.zodSchema(),
						zero: column.zodSchema(),
						oneString: column.zodSchema(),
						zeroString: column.zodSchema(),
						on: column.zodSchema(),
						off: column.zodSchema(),
					});

					const data = {
						true: "true",
						false: "false",
						yes: "yes",
						no: "no",
						one: 1,
						zero: 0,
						oneString: "1",
						zeroString: "0",
						on: "on",
						off: "off",
					};

					const result = schema.safeParse(data);

					expect(result.success).toBe(true);
					if (result.success) {
						const expected = {
							true: true,
							false: false,
							yes: true,
							no: false,
							one: true,
							zero: false,
							oneString: true,
							zeroString: false,
							on: true,
							off: false,
						};
						expect(result.data).toStrictEqual(expected);
					}
				});

				test("does not parse non boolish values", () => {
					const column = boolean();
					const schema = column.zodSchema();
					expect(schema.safeParse("TRUE").success).toBe(false);
					expect(schema.safeParse("FALSE").success).toBe(false);
					expect(schema.safeParse("undefined").success).toBe(false);
					expect(schema.safeParse("null").success).toBe(false);
					expect(schema.safeParse(2).success).toBe(false);
				});

				test("with default value is nullable", () => {
					const column = boolean().defaultTo(true);
					const schema = column.zodSchema();
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(true);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with notNull is non nullable and required", () => {
					const column = boolean().notNull();
					const schema = column.zodSchema();
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with default and notNull is non nullable", () => {
					const column = boolean().notNull().defaultTo(true);
					const schema = column.zodSchema();
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});
			});

			describe("as primary key", () => {
				test("is non nullable and required", () => {
					const column = boolean();
					column._isPrimaryKey = true;
					const schema = column.zodSchema();
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with default value is non nullable", () => {
					const column = boolean().defaultTo(true);
					column._isPrimaryKey = true;
					const schema = column.zodSchema();
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with notNull is non nullable and required", () => {
					const column = boolean().notNull();
					column._isPrimaryKey = true;
					const schema = column.zodSchema();
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with default and notNull is non nullable", () => {
					const column = boolean().notNull().defaultTo(true);
					column._isPrimaryKey = true;
					const schema = column.zodSchema();
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});
			});
		});
	});
});

describe("pgText", () => {
	test("returns a PgText instance", () => {
		const column = text();
		expect(column).toBeInstanceOf(PgText);
	});

	describe("PgText", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(text()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to text", () => {
			const info = Object.fromEntries(Object.entries(text())).info;
			expect(info.dataType).toBe("text");
		});

		test("defaultTo with column data type", () => {
			const column = text();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("foo");
			expect(info.defaultValue).toBe("'foo'::text");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = text() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = text() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string or null", () => {
				const column = text();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or null", () => {
				const column = text();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				const result = schema.safeParse("one");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("one");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
				if (nullResult.success) {
					expect(nullResult.data).toBe(null);
				}
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = text().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("one");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("one");
				}
			});

			test("parses strings", () => {
				const column = text();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
			});

			test("parses null", () => {
				const column = text();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = text();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("does not parse other types", () => {
				const column = text();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = text().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = text().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = text().notNull().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = text();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = text().defaultTo("hello");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = text().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = text().notNull().defaultTo("1");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgBigInt", () => {
	test("returns a PgBigInt instance", () => {
		const column = bigint();
		expect(column).toBeInstanceOf(PgBigInt);
	});

	describe("PgBigInt", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(bigint()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to bigint", () => {
			const info = Object.fromEntries(Object.entries(bigint())).info;
			expect(info.dataType).toBe("bigint");
		});

		test("defaultTo with column data type", () => {
			const column = bigint();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(12234433444444455n);
			expect(info.defaultValue).toBe("'12234433444444455'::bigint");

			column.defaultTo(12);
			expect(info.defaultValue).toBe("'12'::bigint");

			column.defaultTo("12");
			expect(info.defaultValue).toBe("'12'::bigint");
		});

		test("has generatedAlwaysAsIdentity", () => {
			const column = bigint();
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("has generatedByDefaultAsIdentity", () => {
			const column = bigint();
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is bigint, number, string or null", () => {
				const column = bigint();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or null", () => {
				const column = bigint();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				const result = schema.safeParse(1000n);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("1000");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
				if (nullResult.success) {
					expect(nullResult.data).toBe(null);
				}
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = bigint().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse(10n);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("10");
				}
			});

			test("has never type when generatedAlwaysAsIdentity", () => {
				const column = bigint().generatedAlwaysAsIdentity();
				const schema = column.zodSchema();
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("output type is string with generatedByDefaultAsIdentity", () => {
				const column = bigint().generatedByDefaultAsIdentity();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse(10n);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("10");
				}

				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses bigint", () => {
				const column = bigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = bigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses string", () => {
				const column = bigint();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
			});

			test("parses null", () => {
				const column = bigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = bigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("does not parse floats", () => {
				const column = bigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("fails on invalid string", () => {
				const column = bigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = bigint().defaultTo("1");
				const schema = column.zodSchema();

				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimumValue is -9223372036854775808n", () => {
				const column = bigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(-9223372036854775808n).success).toBe(true);
				expect(schema.safeParse("-9223372036854775808").success).toBe(true);
				expect(schema.safeParse(-9223372036854775809n).success).toBe(false);
				expect(schema.safeParse("-9223372036854775809").success).toBe(false);
			});

			test("maximumValue is 9223372036854775807n", () => {
				const column = bigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(9223372036854775807n).success).toBe(true);
				expect(schema.safeParse("9223372036854775807").success).toBe(true);
				expect(schema.safeParse(9223372036854775808n).success).toBe(false);
				expect(schema.safeParse("9223372036854775808").success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = bigint().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = bigint().notNull().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = bigint();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = bigint().defaultTo(1);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = bigint().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = bigint().notNull().defaultTo("1");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgBigSerial", () => {
	test("returns a PgBigSerial instance", () => {
		const column = bigserial();
		expect(column).toBeInstanceOf(PgBigSerial);
	});

	describe("PgBigSerial", () => {
		test("inherits from PgColumnWithoutDefault", () => {
			expect(bigserial()).toBeInstanceOf(PgGeneratedColumn);
		});

		test("dataType is set to bigserial", () => {
			const info = Object.fromEntries(Object.entries(bigserial())).info;
			expect(info.dataType).toBe("bigserial");
		});

		test("does not have generatedAlwaysAsIdentity", (context) => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = bigserial() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", (context) => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = bigserial() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is bigint, number, string", () => {
				const column = bigserial();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const column = bigserial();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse(1000n);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("1000");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
				if (nullResult.success) {
					expect(nullResult.data).toBe(null);
				}
			});

			test("parses bigint", () => {
				const column = bigserial();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = bigserial();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses strings that can be coerced to bigint", () => {
				const column = bigserial();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("is non nullable", () => {
				const column = bigserial();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(false);
			});

			test("minimum is 1", () => {
				const column = bigserial();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(0).success).toBe(false);
				expect(schema.safeParse("0").success).toBe(false);
			});

			test("maximum is 9223372036854775807", () => {
				const column = bigserial();
				const schema = column.zodSchema();
				expect(schema.safeParse(9223372036854775807n).success).toBe(true);
				expect(schema.safeParse("9223372036854775807").success).toBe(true);
				expect(schema.safeParse(9223372036854775808n).success).toBe(false);
				expect(schema.safeParse("9223372036854775808").success).toBe(false);
			});
		});
	});
});

describe("pgBytea", () => {
	test("returns a PgBytea instance", () => {
		const column = bytea();
		expect(column).toBeInstanceOf(PgBytea);
	});

	describe("PgBytea", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(bytea()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to bytea", () => {
			const info = Object.fromEntries(Object.entries(bytea())).info;
			expect(info.dataType).toBe("bytea");
		});

		test("defaultTo with column data type", () => {
			const column = bytea();
			const info = Object.fromEntries(Object.entries(column)).info;

			const buffer = Buffer.from("hello");
			column.defaultTo(buffer);
			expect(info.defaultValue).toBe("'\\x68656c6c6f'::bytea");

			column.defaultTo("12");
			expect(info.defaultValue).toBe("'\\x3132'::bytea");

			const expression = sql`\\x7b2261223a312c2262223a327d'::bytea`;
			column.defaultTo(expression);
			expect(info.defaultValue).toBe(expression);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = bytea() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = bytea() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is Buffer, string, or null", () => {
				const column = bytea();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = Buffer | string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type same as inputed", () => {
				const column = bytea();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Buffer | string | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				const buffer = Buffer.from("hello");
				const bufferResult = schema.safeParse(buffer);
				expect(bufferResult.success).toBe(true);
				if (bufferResult.success) {
					expect(bufferResult.data).toEqual(buffer);
				}
				const stringResult = schema.safeParse("1000");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("1000");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
				if (nullResult.success) {
					expect(nullResult.data).toBe(null);
				}
				expect(isEqual).toBe(true);
			});

			test("output type is Buffer or string with notNull", () => {
				const column = bytea().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Buffer | string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const buffer = Buffer.from("hello");
				const bufferResult = schema.safeParse(buffer);
				expect(bufferResult.success).toBe(true);
				if (bufferResult.success) {
					expect(bufferResult.data).toEqual(buffer);
				}
				const stringResult = schema.safeParse("1000");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("1000");
				}
			});

			test("parses buffers", () => {
				const column = bytea();
				const schema = column.zodSchema();
				expect(schema.safeParse(Buffer.from("hello")).success).toBe(true);
			});

			test("parses strings", () => {
				const column = bytea();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
			});

			test("parses null", () => {
				const column = bytea();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse other objects", () => {
				const column = bytea();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(false);
				expect(schema.safeParse(10.123).success).toBe(false);
				expect(schema.safeParse(true).success).toBe(false);
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse({ a: 1 }).success).toBe(false);
				expect(schema.safeParse(Date).success).toBe(false);
			});

			test("does not parse undefined", () => {
				const column = bytea();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = bytea().defaultTo(Buffer.from("1"));
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = bytea().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = bytea().notNull().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = bytea();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = bytea().defaultTo("1");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = bytea().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = bytea().notNull().defaultTo("1");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgDate", () => {
	test("returns a PgDate instance", () => {
		const column = date();
		expect(column).toBeInstanceOf(PgDate);
	});

	describe("PgDate", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(date()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to date", () => {
			const info = Object.fromEntries(Object.entries(date())).info;
			expect(info.dataType).toBe("date");
		});

		test("defaultTo with column data type", () => {
			const column = date();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(new Date(1));
			expect(info.defaultValue).toBe("'1970-01-01'::date");

			column.defaultTo(new Date(1).toISOString());
			expect(info.defaultValue).toBe("'1970-01-01'::date");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = date() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = date() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is Date, string or null", () => {
				const column = date();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date, or null", () => {
				const column = date();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Date | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const dateResult = schema.safeParse(new Date(1));
				expect(dateResult.success).toBe(true);
				if (dateResult.success) {
					expect(dateResult.data).toEqual(new Date(1));
				}
				const stringResult = schema.safeParse(new Date(1).toISOString());
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toStrictEqual(new Date(1));
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
				if (nullResult.success) {
					expect(nullResult.data).toBe(null);
				}
			});

			test("output type is Date with notNull", () => {
				const column = date().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Date;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const dateResult = schema.safeParse(new Date(1));
				expect(dateResult.success).toBe(true);
				if (dateResult.success) {
					expect(dateResult.data).toEqual(new Date(1));
				}
				const stringResult = schema.safeParse(new Date(1).toISOString());
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toStrictEqual(new Date(1));
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses dates", () => {
				const column = date();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
			});

			test("parses strings that can be coerced into dates", () => {
				const column = date();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date().toISOString()).success).toBe(true);
				expect(schema.safeParse("not a date").success).toBe(false);
			});

			test("parses null", () => {
				const column = date();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = date();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = date().defaultTo(new Date());
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = date().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = date().notNull().defaultTo(new Date());
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = date();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = date().defaultTo(new Date());
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = date().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = date().notNull().defaultTo(new Date());
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgDoublePrecision", () => {
	test("returns a PgDoublePrecision instance", () => {
		const column = doublePrecision();
		expect(column).toBeInstanceOf(PgDoublePrecision);
	});

	describe("PgDoublePrecision", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(doublePrecision()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to double precision", () => {
			const info = Object.fromEntries(Object.entries(doublePrecision())).info;
			expect(info.dataType).toBe("double precision");
		});

		test("defaultTo with column data type", () => {
			const column = doublePrecision();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10);
			expect(info.defaultValue).toBe("'10'::double precision");

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::double precision");

			column.defaultTo(102n);
			expect(info.defaultValue).toBe("'102'::double precision");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = doublePrecision() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = doublePrecision() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, bigint, string or null", () => {
				const column = doublePrecision();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, or null", () => {
				const column = doublePrecision();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual("1");
				}
				const bigintResult = schema.safeParse(10n);
				expect(bigintResult.success).toBe(true);
				if (bigintResult.success) {
					expect(bigintResult.data).toEqual("10");
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("10");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
				if (nullResult.success) {
					expect(nullResult.data).toBe(null);
				}
			});

			test("output type is string with notNull", () => {
				const column = doublePrecision().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual("1");
				}
				const bigintResult = schema.safeParse(10n);
				expect(bigintResult.success).toBe(true);
				if (bigintResult.success) {
					expect(bigintResult.data).toEqual("10");
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("10");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses bigint", () => {
				const column = doublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = doublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const column = doublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const column = doublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = doublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = doublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = doublePrecision().defaultTo(30);
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = doublePrecision().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = doublePrecision().notNull().defaultTo(1.1);
				const schema = column.zodSchema();
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -1e308", () => {
				const column = doublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse(-tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(-elevenCentillionBitInt).success).toBe(false);
			});

			test("maximum is 1e308", () => {
				const column = doublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse(tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(elevenCentillionBitInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = doublePrecision();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = doublePrecision().defaultTo(1.1);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = doublePrecision().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = doublePrecision().notNull().defaultTo(2.2);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgFloat4", () => {
	test("returns a PgFloat4 instance", () => {
		const column = float4();
		expect(column).toBeInstanceOf(PgFloat4);
	});

	describe("PgFloat4", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(float4()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to real", () => {
			const info = Object.fromEntries(Object.entries(float4())).info;
			expect(info.dataType).toBe("real");
		});

		test("defaultTo with column data type", () => {
			const column = float4();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10.4);
			expect(info.defaultValue).toBe("'10.4'::real");

			column.defaultTo("10.4");
			expect(info.defaultValue).toBe("'10.4'::real");

			column.defaultTo(102n);
			expect(info.defaultValue).toBe("'102'::real");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = float4() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = float4() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, bigint, string or null", () => {
				const column = float4();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, or null", () => {
				const column = float4();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const bigintResult = schema.safeParse(10n);
				expect(bigintResult.success).toBe(true);
				if (bigintResult.success) {
					expect(bigintResult.data).toEqual(10);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
				if (nullResult.success) {
					expect(nullResult.data).toBe(null);
				}
			});

			test("output type is number with notNull", () => {
				const column = float4().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const bigintResult = schema.safeParse(10n);
				expect(bigintResult.success).toBe(true);
				if (bigintResult.success) {
					expect(bigintResult.data).toEqual(10);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses bigint", () => {
				const column = float4();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = float4();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const column = float4();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const column = float4();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = float4();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = float4();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = float4().defaultTo(30);
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = float4().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = float4().notNull().defaultTo(1.1);
				const schema = column.zodSchema();
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -1e37", () => {
				const column = float4();
				const schema = column.zodSchema();
				expect(schema.safeParse(-tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(-eleventUnDecillionBigInt).success).toBe(false);
			});

			test("maximum is 1e37", () => {
				const column = float4();
				const schema = column.zodSchema();
				expect(schema.safeParse(tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(eleventUnDecillionBigInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = float4();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = float4().defaultTo(1.1);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = float4().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = float4().notNull().defaultTo(2.2);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgFloat8", () => {
	test("returns a PgFloat8 instance", () => {
		const column = float8();
		expect(column).toBeInstanceOf(PgFloat8);
	});

	describe("PgFloat8", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(float8()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to double precision", () => {
			const info = Object.fromEntries(Object.entries(float8())).info;
			expect(info.dataType).toBe("double precision");
		});

		test("defaultTo with column data type", () => {
			const column = float8();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10.4);
			expect(info.defaultValue).toBe("'10.4'::double precision");

			column.defaultTo("10.4");
			expect(info.defaultValue).toBe("'10.4'::double precision");

			column.defaultTo(102n);
			expect(info.defaultValue).toBe("'102'::double precision");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = float8() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = float8() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, bigint, string or null", () => {
				const column = float8();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, or null", () => {
				const column = float8();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const bigintResult = schema.safeParse(10n);
				expect(bigintResult.success).toBe(true);
				if (bigintResult.success) {
					expect(bigintResult.data).toEqual(10);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
				if (nullResult.success) {
					expect(nullResult.data).toBe(null);
				}
			});

			test("output type is number with notNull", () => {
				const column = float8().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const bigintResult = schema.safeParse(10n);
				expect(bigintResult.success).toBe(true);
				if (bigintResult.success) {
					expect(bigintResult.data).toEqual(10);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses bigint", () => {
				const column = float8();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = float8();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const column = float8();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const column = float8();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = float8();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = float8();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = float8().defaultTo(30);
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = float8().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = float8().notNull().defaultTo(1.1);
				const schema = column.zodSchema();
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -1e308", () => {
				const column = float8();
				const schema = column.zodSchema();
				expect(schema.safeParse(-tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(-elevenCentillionBitInt).success).toBe(false);
			});

			test("maximum is 1e308", () => {
				const column = float8();
				const schema = column.zodSchema();
				expect(schema.safeParse(tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(elevenCentillionBitInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = float8();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = float8().defaultTo(1.1);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = float8().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = float8().notNull().defaultTo(2.2);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgInt2", () => {
	test("returns a PgInt2 instance", () => {
		const column = int2();
		expect(column).toBeInstanceOf(PgInt2);
	});

	describe("PgInt2", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(int2()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to smallint", () => {
			const info = Object.fromEntries(Object.entries(int2())).info;
			expect(info.dataType).toBe("smallint");
		});

		test("defaultTo with column data type", () => {
			const column = int2();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10);
			expect(info.defaultValue).toBe("'10'::smallint");

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::smallint");
		});

		test("has have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = int2() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = int2() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, string or null", () => {
				const column = int2();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, or null", () => {
				const column = int2();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
				if (nullResult.success) {
					expect(nullResult.data).toBe(null);
				}
			});

			test("output type is number with notNull", () => {
				const column = int2().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("has never type when generatedAlwaysAsIdentity", () => {
				const column = int2().generatedAlwaysAsIdentity();
				const schema = column.zodSchema();
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("output type is number with generatedByDefaultAsIdentity", () => {
				const column = int2().generatedByDefaultAsIdentity();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(10);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses number", () => {
				const column = int2();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("does not parse decimals", () => {
				const column = int2();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("does not parses bigint", () => {
				const column = int2();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(false);
			});

			test("parses strings that can be coerced to number", () => {
				const column = int2();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = int2();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = int2();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = int2().defaultTo(30);
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = int2().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = int2().notNull().defaultTo(11);
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -32768", () => {
				const column = int2();
				const schema = column.zodSchema();
				expect(schema.safeParse(-32768).success).toBe(true);
				expect(schema.safeParse(-32769).success).toBe(false);
			});

			test("maximum is 32767", () => {
				const column = int2();
				const schema = column.zodSchema();
				expect(schema.safeParse(32767).success).toBe(true);
				expect(schema.safeParse(32768).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = int2();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = int2().defaultTo(1);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = int2().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = int2().notNull().defaultTo(40);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgInt4", () => {
	test("returns a PgInt4 instance", () => {
		const column = int4();
		expect(column).toBeInstanceOf(PgInt4);
	});

	describe("PgInt4", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(int4()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to int4", () => {
			const info = Object.fromEntries(Object.entries(int4())).info;
			expect(info.dataType).toBe("integer");
		});

		test("defaultTo with column data type", () => {
			const column = int4();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10);
			expect(info.defaultValue).toBe("10");

			column.defaultTo("10");
			expect(info.defaultValue).toBe("10");

			const expression = sql`20`;
			column.defaultTo(expression);
			expect(info.defaultValue).toBe(expression);
		});

		test("has generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = int4() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("has generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = int4() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, string or null", () => {
				const column = int4();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, or null", () => {
				const column = int4();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
				if (nullResult.success) {
					expect(nullResult.data).toBe(null);
				}
			});

			test("output type is number with notNull", () => {
				const column = int4().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("has never type when generatedAlwaysAsIdentity", () => {
				const column = int4().generatedAlwaysAsIdentity();
				const schema = column.zodSchema();
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("output type is number with generatedByDefaultAsIdentity", () => {
				const column = int4().generatedByDefaultAsIdentity();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(10);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses number", () => {
				const column = int4();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("does not parse decimals", () => {
				const column = int4();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("does not parses bigint", () => {
				const column = int4();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(false);
			});

			test("parses strings that can be coerced to number", () => {
				const column = int4();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = int4();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = int4();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = int4().defaultTo(30);
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = int4().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = int4().notNull().defaultTo(1.1);
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -2147483648", () => {
				const column = int4();
				const schema = column.zodSchema();
				expect(schema.safeParse(-2147483648).success).toBe(true);
				expect(schema.safeParse(-2147483649).success).toBe(false);
			});

			test("maximum is 2147483647", () => {
				const column = int4();
				const schema = column.zodSchema();
				expect(schema.safeParse(2147483647).success).toBe(true);
				expect(schema.safeParse(2147483648).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = int4();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = int4().defaultTo(1);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = int4().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = int4().notNull().defaultTo(40);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgInt8", () => {
	test("returns a PgInt8 instance", () => {
		const column = int8();
		expect(column).toBeInstanceOf(PgInt8);
	});

	describe("PgInt8", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(int8()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to int8", () => {
			const info = Object.fromEntries(Object.entries(int8())).info;
			expect(info.dataType).toBe("bigint");
		});

		test("defaultTo with column data type", () => {
			const column = int8();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10);
			expect(info.defaultValue).toBe("'10'::bigint");

			column.defaultTo(100n);
			expect(info.defaultValue).toBe("'100'::bigint");

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::bigint");
		});

		test("has generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = int8() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("has generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = int8() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is bigint, number, string or null", () => {
				const column = int8();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number or null", () => {
				const column = int8();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const bigIntResult = schema.safeParse(100n);
				expect(bigIntResult.success).toBe(true);
				if (bigIntResult.success) {
					expect(bigIntResult.data).toEqual(100);
				}
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("output type is number with notNull", () => {
				const column = int8().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const bigIntResult = schema.safeParse(100n);
				expect(bigIntResult.success).toBe(true);
				if (bigIntResult.success) {
					expect(bigIntResult.data).toEqual(100);
				}
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("has never type when generatedAlwaysAsIdentity", () => {
				const column = int8().generatedAlwaysAsIdentity();
				const schema = column.zodSchema();
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("output type is number with generatedByDefaultAsIdentity", () => {
				const column = int8().generatedByDefaultAsIdentity();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(10);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses bigint", () => {
				const column = int8();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = int8();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses string", () => {
				const column = int8();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
			});

			test("parses null", () => {
				const column = int8();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = int8();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("does not parse floats", () => {
				const column = bigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("fails on invalid string", () => {
				const column = int8();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = int8().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimumValue is -9223372036854775808n", () => {
				const column = int8();
				const schema = column.zodSchema();
				expect(schema.safeParse(-9223372036854775808n).success).toBe(true);
				expect(schema.safeParse("-9223372036854775808").success).toBe(true);
				expect(schema.safeParse(-9223372036854775809n).success).toBe(false);
				expect(schema.safeParse("-9223372036854775809").success).toBe(false);
			});

			test("maximumValue is 9223372036854775807n", () => {
				const column = int8();
				const schema = column.zodSchema();
				expect(schema.safeParse(9223372036854775807n).success).toBe(true);
				expect(schema.safeParse("9223372036854775807").success).toBe(true);
				expect(schema.safeParse(9223372036854775808n).success).toBe(false);
				expect(schema.safeParse("9223372036854775808").success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = int8().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = int8().notNull().defaultTo(1);
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = int8();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = int8().defaultTo(1);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = int8().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = int8().notNull().defaultTo("1");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgInteger", () => {
	test("returns a PgInteger instance", () => {
		const column = integer();
		expect(column).toBeInstanceOf(PgInteger);
	});

	describe("PgInteger", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(integer()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to integer", () => {
			const info = Object.fromEntries(Object.entries(integer())).info;
			expect(info.dataType).toBe("integer");
		});

		test("defaultTo with column data type", () => {
			const column = integer();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10);
			expect(info.defaultValue).toBe("10");

			column.defaultTo("10");
			expect(info.defaultValue).toBe("10");

			const expression = sql`20`;
			column.defaultTo(expression);
			expect(info.defaultValue).toBe(expression);
		});

		test("has generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = integer() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("has generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = integer() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, string or null", () => {
				const column = integer();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number or null", () => {
				const column = integer();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("output type is number with notNull", () => {
				const column = integer().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("has never type when generatedAlwaysAsIdentity", () => {
				const column = integer().generatedAlwaysAsIdentity();
				const schema = column.zodSchema();
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("output type is number with generatedByDefaultAsIdentity", () => {
				const column = integer().generatedByDefaultAsIdentity();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(10);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses number", () => {
				const column = integer();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("does not parse decimals", () => {
				const column = integer();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("does not parse bigint", () => {
				const column = integer();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(false);
			});

			test("parses strings that can be coerced to number", () => {
				const column = integer();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = integer();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = integer();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = integer().defaultTo(30);
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = integer().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = integer().notNull().defaultTo(1.1);
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -2147483648", () => {
				const column = integer();
				const schema = column.zodSchema();
				expect(schema.safeParse(-2147483648).success).toBe(true);
				expect(schema.safeParse(-2147483649).success).toBe(false);
			});

			test("maximum is 2147483647", () => {
				const column = integer();
				const schema = column.zodSchema();
				expect(schema.safeParse(2147483647).success).toBe(true);
				expect(schema.safeParse(2147483648).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = integer();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = integer().defaultTo(1);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = integer().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = integer().notNull().defaultTo(40);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgJson", () => {
	test("returns a PgJson instance", () => {
		const column = json();
		expect(column).toBeInstanceOf(PgJson);
	});

	describe("PgJson", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(json()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to json", () => {
			const info = Object.fromEntries(Object.entries(json())).info;
			expect(info.dataType).toBe("json");
		});

		test("defaultTo with column data type", () => {
			const column = json();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::json");

			column.defaultTo('{ "foo": "bar" }');
			expect(info.defaultValue).toBe('\'{ "foo": "bar" }\'::json');
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = json() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = json() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, number, boolean, Record<string, any> or null", () => {
				const column = json();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				type Expected = string | number | boolean | Record<string, any> | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is JsonArray, JsonObject, JsonPrimitive or null", () => {
				const column = json();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				type Expected = string | number | boolean | Record<string, any> | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const objectResult = schema.safeParse({ a: 1 });
				expect(objectResult.success).toBe(true);
				if (objectResult.success) {
					expect(objectResult.data).toEqual({ a: 1 });
				}
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("10");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("output type is string, number, boolean, Record<string, any> with notNull", () => {
				const column = json().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				type Expected = string | number | boolean | Record<string, any>;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const objectResult = schema.safeParse({ a: 1 });
				expect(objectResult.success).toBe(true);
				if (objectResult.success) {
					expect(objectResult.data).toEqual({ a: 1 });
				}
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("10");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses strings that can be coerced into JSON objects", () => {
				const column = json();
				const schema = column.zodSchema();
				expect(schema.safeParse("12").success).toBe(true);
				expect(schema.safeParse('{"foo": "bar"}').success).toBe(true);
				expect(schema.safeParse('{"foo"}').success).toBe(false);
				expect(schema.safeParse("foo").success).toBe(false);
			});

			test("parses numbers", () => {
				const column = json();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(10.123).success).toBe(true);
			});

			test("parses boolean", () => {
				const column = json();
				const schema = column.zodSchema();
				expect(schema.safeParse(true).success).toBe(true);
			});

			test("parses null", () => {
				const column = json();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses objects", () => {
				const column = json();
				const schema = column.zodSchema();
				expect(schema.safeParse({ a: 1 }).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = json();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = json().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse({ a: 1 }).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = json().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = json().notNull().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = json();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = json().defaultTo("1");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = json().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = json().notNull().defaultTo("1");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgJsonB", () => {
	test("returns a PgJsonB instance", () => {
		const column = jsonb();
		expect(column).toBeInstanceOf(PgJsonB);
	});

	describe("PgJsonB", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(jsonb()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to jsonb", () => {
			const info = Object.fromEntries(Object.entries(jsonb())).info;
			expect(info.dataType).toBe("jsonb");
		});

		test("defaultTo with column data type", () => {
			const column = jsonb();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::jsonb");

			column.defaultTo('{ "foo": "bar" }');
			expect(info.defaultValue).toBe('\'{ "foo": "bar" }\'::jsonb');
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = jsonb() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = jsonb() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, number, boolean, Record<string, any> or null", () => {
				const column = jsonb();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				type Expected = string | number | boolean | Record<string, any> | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is JsonArray, JsonObject, JsonPrimitive or null", () => {
				const column = jsonb();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				type Expected = string | number | boolean | Record<string, any> | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const objectResult = schema.safeParse({ a: 1 });
				expect(objectResult.success).toBe(true);
				if (objectResult.success) {
					expect(objectResult.data).toEqual({ a: 1 });
				}
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("10");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("output type is string, number, boolean, Record<string, any> with notNull", () => {
				const column = jsonb().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				type Expected = string | number | boolean | Record<string, any>;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const objectResult = schema.safeParse({ a: 1 });
				expect(objectResult.success).toBe(true);
				if (objectResult.success) {
					expect(objectResult.data).toEqual({ a: 1 });
				}
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("10");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses strings that can be coerced into JSON objects", () => {
				const column = jsonb();
				const schema = column.zodSchema();
				expect(schema.safeParse("12").success).toBe(true);
				expect(schema.safeParse('{"foo": "bar"}').success).toBe(true);
				expect(schema.safeParse('{"foo"}').success).toBe(false);
				expect(schema.safeParse("foo").success).toBe(false);
			});

			test("parses numbers", () => {
				const column = jsonb();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(10.123).success).toBe(true);
			});

			test("parses boolean", () => {
				const column = jsonb();
				const schema = column.zodSchema();
				expect(schema.safeParse(true).success).toBe(true);
			});

			test("parses null", () => {
				const column = jsonb();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses objects", () => {
				const column = jsonb();
				const schema = column.zodSchema();
				expect(schema.safeParse({ a: 1 }).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = jsonb();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = jsonb().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse({ a: 1 }).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = jsonb().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = jsonb().notNull().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = jsonb();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = jsonb().defaultTo("1");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = jsonb().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = jsonb().notNull().defaultTo("1");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgReal", () => {
	test("returns a PgReal instance", () => {
		const column = real();
		expect(column).toBeInstanceOf(PgReal);
	});

	describe("PgReal", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(real()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to real", () => {
			const info = Object.fromEntries(Object.entries(real())).info;
			expect(info.dataType).toBe("real");
		});

		test("defaultTo with column data type", () => {
			const column = real();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::real");

			column.defaultTo(10);
			expect(info.defaultValue).toBe("'10'::real");

			column.defaultTo(100n);
			expect(info.defaultValue).toBe("'100'::real");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = real() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = real() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is bigint, number, string or null", () => {
				const column = real();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number or null", () => {
				const column = real();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const bigIntResult = schema.safeParse(100n);
				expect(bigIntResult.success).toBe(true);
				if (bigIntResult.success) {
					expect(bigIntResult.data).toEqual(100);
				}
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("output type is number with notNull", () => {
				const column = real().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const bigIntResult = schema.safeParse(100n);
				expect(bigIntResult.success).toBe(true);
				if (bigIntResult.success) {
					expect(bigIntResult.data).toEqual(100);
				}
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses bigint", () => {
				const column = real();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = real();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const column = real();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const column = real();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = real();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = real();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = real().defaultTo(30);
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = real().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = real().notNull().defaultTo(1.1);
				const schema = column.zodSchema();
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -1e37", () => {
				const column = real();
				const schema = column.zodSchema();
				expect(schema.safeParse(-tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(-eleventUnDecillionBigInt).success).toBe(false);
			});

			test("maximum is 1e37", () => {
				const column = real();
				const schema = column.zodSchema();
				expect(schema.safeParse(tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(eleventUnDecillionBigInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = real();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = real().defaultTo(1.1);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = real().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = real().notNull().defaultTo(2.2);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgSerial", () => {
	test("returns a PgSerial instance", () => {
		const column = serial();
		expect(column).toBeInstanceOf(PgSerial);
	});

	describe("PgSerial", () => {
		test("inherits from PgColumnWithoutDefault", () => {
			expect(serial()).toBeInstanceOf(PgGeneratedColumn);
		});

		test("dataType is set to serial", () => {
			const info = Object.fromEntries(Object.entries(serial())).info;
			expect(info.dataType).toBe("serial");
		});

		test("isNullable is false", () => {
			const info = Object.fromEntries(Object.entries(serial())).info;
			expect(info.isNullable).toBe(false);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = serial() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = serial() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, string", () => {
				const column = serial();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const column = serial();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
			});

			test("parses number", () => {
				const column = serial();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses string", () => {
				const column = serial();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = serial();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("parses coerced strings as number", () => {
				const column = serial();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("is non nullable", () => {
				const column = serial();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(false);
			});

			test("minimum is 1", () => {
				const column = serial();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(0).success).toBe(false);
				expect(schema.safeParse("0").success).toBe(false);
			});

			test("maximum is 2147483648", () => {
				const column = serial();
				const schema = column.zodSchema();
				expect(schema.safeParse(2147483648).success).toBe(true);
				expect(schema.safeParse("2147483648").success).toBe(true);
				expect(schema.safeParse(2147483649).success).toBe(false);
				expect(schema.safeParse("2147483649").success).toBe(false);
			});
		});
	});
});

describe("pgUuid", () => {
	test("returns a PgUuid instance", () => {
		const column = uuid();
		expect(column).toBeInstanceOf(PgUuid);
	});

	describe("PgUuid", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(uuid()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to uuid", () => {
			const info = Object.fromEntries(Object.entries(uuid())).info;
			expect(info.dataType).toBe("uuid");
		});

		test("defaultTo with column data type", () => {
			const column = uuid();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11");
			expect(info.defaultValue).toBe(
				"'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid",
			);

			const expression = sql`'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid`;
			column.defaultTo(expression);
			expect(info.defaultValue).toBe(expression);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = uuid() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = uuid() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string or null", () => {
				const column = uuid();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or null", () => {
				const column = uuid();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const stringResult = schema.safeParse(
					"A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11",
				);
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(
						"A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11",
					);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = uuid().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const stringResult = schema.safeParse(
					"A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11",
				);
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(
						"A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11",
					);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses strings that can be coerced into uuid", () => {
				const column = uuid();
				const schema = column.zodSchema();
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
			});

			test("does not parse other strings", () => {
				const column = uuid();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const column = uuid();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = uuid();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = uuid().defaultTo("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11");
				const schema = column.zodSchema();
				expect(
					schema.safeParse("B0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = uuid().notNull();
				const schema = column.zodSchema();
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = uuid()
					.notNull()
					.defaultTo("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11");
				const schema = column.zodSchema();
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A12").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = uuid();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = uuid().defaultTo("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A12").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = uuid().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = uuid()
					.notNull()
					.defaultTo("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A12").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgVarChar", () => {
	test("returns a PgVarChar instance", () => {
		const column = varchar();
		expect(column).toBeInstanceOf(PgVarChar);
	});

	describe("PgVarChar", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(varchar()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to varchar", () => {
			const info = Object.fromEntries(Object.entries(varchar())).info;
			expect(info.dataType).toBe("varchar");
		});

		test("defaultTo with column data type", () => {
			const column = varchar();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::character varying");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = varchar() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = varchar() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional maximumLength", () => {
		test("characterMaximumLength is set to maximumLength", () => {
			const column = varchar(255);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.characterMaximumLength).toBe(255);
		});

		test("data type has maximumLength", () => {
			const info = Object.fromEntries(Object.entries(varchar(255))).info;
			expect(info.dataType).toBe("varchar(255)");
		});

		test("defaultTo with column data type", () => {
			const column = varchar(100);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::character varying");
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string or null", () => {
				const column = varchar();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or null", () => {
				const column = varchar();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("10");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = varchar().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("10");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses strings", () => {
				const column = varchar();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
			});

			test("does not parse other objects", () => {
				const column = varchar();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(false);
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse({ foo: "bar" }).success).toBe(false);
			});

			test("parses null", () => {
				const column = varchar();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = varchar();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = varchar().defaultTo("hello");
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = varchar().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = varchar().notNull().defaultTo("hello");
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("without maximum length", () => {
				const column = varchar();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse("hello!").success).toBe(true);
			});

			test("with maximum length", () => {
				const column = varchar(5);
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse("hello!").success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = varchar();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = varchar().defaultTo("hello");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = varchar().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = varchar().notNull().defaultTo("hello");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgChar", () => {
	test("returns a PgChar instance", () => {
		const column = char();
		expect(column).toBeInstanceOf(PgChar);
	});

	describe("PgChar", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(char()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to char(1)", () => {
			const info = Object.fromEntries(Object.entries(char())).info;
			expect(info.dataType).toBe("char(1)");
		});

		test("characterMaximumLength is set to 1", () => {
			const column = char();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.characterMaximumLength).toBe(1);
		});

		test("defaultTo with column data type", () => {
			const column = char();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::character(1)");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = char() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = char() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional maximumLength", () => {
		test("characterMaximumLength is set to maximumLength", () => {
			const column = char(255);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.characterMaximumLength).toBe(255);
		});

		test("data type has maximumLength", () => {
			const info = Object.fromEntries(Object.entries(char(255))).info;
			expect(info.dataType).toBe("char(255)");
		});

		test("defaultTo with column data type", () => {
			const column = char(200);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::character(1)");
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string or null", () => {
				const column = char(10);
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or null", () => {
				const column = char(10);
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("10");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = char(10).notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("10");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses strings up to the maximum length", () => {
				const column = char(5);
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse("hello!").success).toBe(false);
			});

			test("does not parse other objects", () => {
				const column = char(5);
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(false);
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse({ foo: "bar" }).success).toBe(false);
			});

			test("parses null", () => {
				const column = char();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = char();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = char(5).defaultTo("hello");
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = char(5).notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = char(5).notNull().defaultTo("hello");
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = char(5);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = char(5).defaultTo("hello");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = char(5).notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = char(5).notNull().defaultTo("hello");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
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
		const column = time();
		expect(column).toBeInstanceOf(PgTime);
	});

	describe("PgTime", () => {
		test("inherits from PgColumnWithPrecision", () => {
			expect(time()).toBeInstanceOf(PgColumnWithPrecision);
		});

		test("dataType is set to time", () => {
			const info = Object.fromEntries(Object.entries(time())).info;
			expect(info.dataType).toBe("time");
		});

		test("datetimePrecision is set to null", () => {
			const column = time();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("defaultTo with column data type", () => {
			const column = time();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("04:05 AM");
			expect(info.defaultValue).toBe("'04:05 AM'::time without time zone");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = time() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = time() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = time(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(Object.entries(time(1))).info;
			expect(info.dataType).toBe("time(1)");
		});

		test("defaultTo with column data type", () => {
			const column = time(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("04:05 AM");
			expect(info.defaultValue).toBe("'04:05 AM'::time without time zone");
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string or null", () => {
				const column = time();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or null", () => {
				const column = time();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const stringResult = schema.safeParse("11:30");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("11:30");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = time().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const stringResult = schema.safeParse("10:30");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("10:30");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses time strings", () => {
				const column = time();
				const schema = column.zodSchema();
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse("11:30:01").success).toBe(true);
				expect(schema.safeParse("11:30:01.129").success).toBe(true);
				expect(schema.safeParse("040506").success).toBe(true);
				expect(schema.safeParse("040506-08").success).toBe(true);
				expect(schema.safeParse("04:05:06.789-8").success).toBe(true);
				expect(schema.safeParse("04:05:06-08:00").success).toBe(true);
				expect(schema.safeParse("04:05-08:00").success).toBe(true);
				expect(schema.safeParse("040506+0730").success).toBe(true);
				expect(schema.safeParse("040506-0730").success).toBe(true);
				expect(schema.safeParse("040506+07:30:00").success).toBe(true);
			});

			test("does not parse other strings", () => {
				const column = time();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const column = time();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = time();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = time().defaultTo("11:30");
				const schema = column.zodSchema();
				expect(schema.safeParse("01:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = time().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = time().notNull().defaultTo("11:30");
				const schema = column.zodSchema();
				expect(schema.safeParse("02:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = time();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = time().defaultTo("11:30");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = time().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = time().notNull().defaultTo("11:30");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgTimeTz", () => {
	test("returns a PgTimeTz instance", () => {
		const column = timetz();
		expect(column).toBeInstanceOf(PgTimeTz);
	});

	describe("PgTimeTz", () => {
		test("inherits from PgColumnWithPrecision", () => {
			expect(timetz()).toBeInstanceOf(PgColumnWithPrecision);
		});

		test("dataType is set to timetz", () => {
			const info = Object.fromEntries(Object.entries(timetz())).info;
			expect(info.dataType).toBe("timetz");
		});

		test("datetimePrecision is set to null", () => {
			const column = timetz();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("defaultTo with column data type", () => {
			const column = timetz();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("04:05:06-08:00");
			expect(info.defaultValue).toBe("'04:05:06-08:00'::time with time zone");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = timetz() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = timetz() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = timetz(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(Object.entries(timetz(1))).info;
			expect(info.dataType).toBe("timetz(1)");
		});

		test("defaultTo with column data type", () => {
			const column = timetz(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("04:05:06-08:00");
			expect(info.defaultValue).toBe("'04:05:06-08:00'::time with time zone");
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string or null", () => {
				const column = timetz();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or null", () => {
				const column = timetz();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const stringResult = schema.safeParse("04:05:06-08:00");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("04:05:06-08:00");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = timetz().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const stringResult = schema.safeParse("04:05:06-08:00");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("04:05:06-08:00");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses time strings", () => {
				const column = timetz();
				const schema = column.zodSchema();
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse("11:30:01").success).toBe(true);
				expect(schema.safeParse("11:30:01.129").success).toBe(true);
				expect(schema.safeParse("040506").success).toBe(true);
				expect(schema.safeParse("040506-08").success).toBe(true);
				expect(schema.safeParse("04:05:06.789-8").success).toBe(true);
				expect(schema.safeParse("04:05:06-08:00").success).toBe(true);
				expect(schema.safeParse("04:05-08:00").success).toBe(true);
				expect(schema.safeParse("040506+0730").success).toBe(true);
				expect(schema.safeParse("040506-0730").success).toBe(true);
				expect(schema.safeParse("040506+07:30:00").success).toBe(true);
			});

			test("does not parse other strings", () => {
				const column = timetz();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const column = timetz();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = timetz();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = timetz().defaultTo("11:30");
				const schema = column.zodSchema();
				expect(schema.safeParse("01:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = timetz().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = timetz().notNull().defaultTo("11:30");
				const schema = column.zodSchema();
				expect(schema.safeParse("02:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = time();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = time().defaultTo("11:30");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = time().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = time().notNull().defaultTo("11:30");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgTimestamp", () => {
	test("returns a PgTimestamp instance", () => {
		const column = timestamp();
		expect(column).toBeInstanceOf(PgTimestamp);
	});

	describe("PgTimestamp", () => {
		test("inherits from PgColumnWithPrecision", () => {
			expect(timestamp()).toBeInstanceOf(PgColumnWithPrecision);
		});

		test("dataType is set to timestamp", () => {
			const info = Object.fromEntries(Object.entries(timestamp())).info;
			expect(info.dataType).toBe("timestamp");
		});

		test("datetimePrecision is set to null", () => {
			const column = timestamp();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("defaultTo with column data type", () => {
			const column = timestamp();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(new Date(1));
			expect(info.defaultValue).toBe(
				"'1970-01-01T00:00:00.001Z'::timestamp without time zone",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = timestamp() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = timestamp() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = timestamp(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(Object.entries(timestamp(1))).info;
			expect(info.dataType).toBe("timestamp(1)");
		});

		test("defaultTo with column data type", () => {
			const column = timestamp(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(new Date(1));
			expect(info.defaultValue).toBe(
				"'1970-01-01T00:00:00.001Z'::timestamp without time zone",
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is Date, string or null", () => {
				const column = timestamp();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date or null", () => {
				const column = timestamp();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Date | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const dateResult = schema.safeParse(new Date(1));
				expect(dateResult.success).toBe(true);
				if (dateResult.success) {
					expect(dateResult.data).toStrictEqual(new Date(1));
				}

				const stringResult = schema.safeParse(new Date(1).toISOString());
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toStrictEqual(new Date(1));
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = timestamp().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Date;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const dateResult = schema.safeParse(new Date(1));
				expect(dateResult.success).toBe(true);
				if (dateResult.success) {
					expect(dateResult.data).toStrictEqual(new Date(1));
				}

				const stringResult = schema.safeParse(new Date(1).toISOString());
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toStrictEqual(new Date(1));
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses dates", () => {
				const column = timestamp();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
			});

			test("parses strings that can be coerced into dates", () => {
				const column = timestamp();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date().toISOString()).success).toBe(true);
			});

			test("does not parse other strings", () => {
				const column = timestamp();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const column = timestamp();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = timestamp();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = timestamp().defaultTo(new Date());
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = timestamp().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = timestamp().notNull().defaultTo(new Date());
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = timestamp();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = timestamp().defaultTo(new Date());
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = timestamp().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = timestamp().notNull().defaultTo(new Date());
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgTimestampTz", () => {
	test("returns a PgTimestampTz instance", () => {
		const column = timestamptz();
		expect(column).toBeInstanceOf(PgTimestampTz);
	});

	describe("PgTimestampTz", () => {
		test("inherits from PgColumnWithPrecision", () => {
			expect(timestamptz()).toBeInstanceOf(PgColumnWithPrecision);
		});

		test("dataType is set to timestamptz", () => {
			const info = Object.fromEntries(Object.entries(timestamptz())).info;
			expect(info.dataType).toBe("timestamptz");
		});

		test("datetimePrecision is set to null", () => {
			const column = timestamptz();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("defaultTo with column data type", () => {
			const column = timestamptz();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(new Date(1));
			expect(info.defaultValue).toBe(
				"'1970-01-01T00:00:00.001Z'::timestamp with time zone",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = timestamptz() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = timestamptz() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = timestamptz(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(Object.entries(timestamptz(1))).info;
			expect(info.dataType).toBe("timestamptz(1)");
		});

		test("defaultTo with column data type", () => {
			const column = timestamptz(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(new Date(1));
			expect(info.defaultValue).toBe(
				"'1970-01-01T00:00:00.001Z'::timestamp with time zone",
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is Date, string or null", () => {
				const column = timestamptz();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date or null", () => {
				const column = timestamptz();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Date | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const dateResult = schema.safeParse(new Date(1));
				expect(dateResult.success).toBe(true);
				if (dateResult.success) {
					expect(dateResult.data).toStrictEqual(new Date(1));
				}

				const stringResult = schema.safeParse(new Date(1).toISOString());
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toStrictEqual(new Date(1));
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = timestamptz().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Date;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const dateResult = schema.safeParse(new Date(1));
				expect(dateResult.success).toBe(true);
				if (dateResult.success) {
					expect(dateResult.data).toStrictEqual(new Date(1));
				}

				const stringResult = schema.safeParse(new Date(1).toISOString());
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toStrictEqual(new Date(1));
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses dates", () => {
				const column = timestamptz();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
			});

			test("parses strings that can be coerced into dates", () => {
				const column = timestamptz();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date().toISOString()).success).toBe(true);
			});

			test("does not parse other strings", () => {
				const column = timestamptz();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const column = timestamptz();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = timestamptz();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = timestamptz().defaultTo(new Date());
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = timestamptz().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = timestamptz().notNull().defaultTo(new Date());
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = timestamptz();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = timestamptz().defaultTo(new Date());
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = timestamptz().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = timestamptz().notNull().defaultTo(new Date());
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgNumeric", () => {
	test("returns a PgNumeric instance", () => {
		const column = numeric();
		expect(column).toBeInstanceOf(PgNumeric);
	});

	describe("PgNumeric", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(numeric()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to numeric", () => {
			const info = Object.fromEntries(Object.entries(numeric())).info;
			expect(info.dataType).toBe("numeric");
		});

		test("numericPrecision is set to null", () => {
			const column = numeric();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericPrecision).toBe(null);
		});

		test("numericScale is set to null", () => {
			const column = numeric();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericScale).toBe(null);
		});

		test("defaultTo with column data type", () => {
			const column = numeric();
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

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = numeric() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = numeric() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional precision", () => {
		test("numericPrecision is set to precision", () => {
			const column = numeric(4);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericPrecision).toBe(4);
		});

		test("numericScale is set to 0", () => {
			const column = numeric(4);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericScale).toBe(0);
		});

		test("data type has precision and scale", () => {
			const info = Object.fromEntries(Object.entries(numeric(5))).info;
			expect(info.dataType).toBe("numeric(5, 0)");
		});

		test("defaultTo with column data type", () => {
			const column = numeric(5);
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
			const column = numeric(4, 5);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.numericScale).toBe(5);
		});

		test("data type has precision and scale", () => {
			const info = Object.fromEntries(Object.entries(numeric(4, 5))).info;
			expect(info.dataType).toBe("numeric(4, 5)");
		});

		test("defaultTo with column data type", () => {
			const column = numeric(5, 1);
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

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, bigint, string or null", () => {
				const column = numeric();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, or null", () => {
				const column = numeric();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const bigintResult = schema.safeParse(10n);
				expect(bigintResult.success).toBe(true);
				if (bigintResult.success) {
					expect(bigintResult.data).toEqual(10);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
				if (nullResult.success) {
					expect(nullResult.data).toBe(null);
				}
			});

			test("output type is string with notNull", () => {
				const column = numeric().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual(1);
				}
				const bigintResult = schema.safeParse(10n);
				expect(bigintResult.success).toBe(true);
				if (bigintResult.success) {
					expect(bigintResult.data).toEqual(10);
				}
				const stringResult = schema.safeParse("10");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe(10);
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses bigint", () => {
				const column = numeric();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = numeric();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const column = numeric();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const column = numeric();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = numeric();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = numeric();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = numeric().defaultTo(2);
				const schema = column.zodSchema();
				expect(schema.safeParse(2).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = numeric().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = numeric().notNull().defaultTo(1);
				const schema = column.zodSchema();
				expect(schema.safeParse(2).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("unconstrained", () => {
				const column = numeric();
				const schema = column.zodSchema();
				expect(schema.safeParse(123423442.1).success).toBe(true);
				expect(schema.safeParse(123423442.12345).success).toBe(true);
				expect(schema.safeParse(12342.123452323).success).toBe(true);
			});

			describe("constrained with precision", () => {
				test("parses on digit count before decimal less than precision", () => {
					const column = numeric(5);
					const schema = column.zodSchema();
					expect(schema.safeParse(1234.1).success).toBe(true);
					expect(schema.safeParse(1234).success).toBe(true);
					expect(schema.safeParse("1234.1").success).toBe(true);
					expect(schema.safeParse("1234").success).toBe(true);
				});

				test("parses on digit count before decimal equal to precision", () => {
					const column = numeric(5);
					const schema = column.zodSchema();
					expect(schema.safeParse(12345).success).toBe(true);
					expect(schema.safeParse(12345.1234).success).toBe(true);
					expect(schema.safeParse("12345").success).toBe(true);
					expect(schema.safeParse("12345.1234").success).toBe(true);
				});

				test("does not parse on digit count before decimal greater than precision", () => {
					const column = numeric(5);
					const schema = column.zodSchema();
					expect(schema.safeParse(123456).success).toBe(false);
					expect(schema.safeParse(123456.1234).success).toBe(false);
					expect(schema.safeParse("123456").success).toBe(false);
					expect(schema.safeParse("123456.1234").success).toBe(false);
				});
			});

			describe("constrained with precision and scale", () => {
				test("parses on digit count before decimal less than precision", () => {
					const column = numeric(5, 2);
					const schema = column.zodSchema();
					expect(schema.safeParse(1234.1).success).toBe(true);
					expect(schema.safeParse(1234).success).toBe(true);
					expect(schema.safeParse("1234.1").success).toBe(true);
					expect(schema.safeParse("1234").success).toBe(true);
				});

				test("parses on digit count before decimal equal to precision", () => {
					const column = numeric(5, 4);
					const schema = column.zodSchema();
					expect(schema.safeParse(12345).success).toBe(true);
					expect(schema.safeParse(12345.1234).success).toBe(true);
					expect(schema.safeParse("12345").success).toBe(true);
					expect(schema.safeParse("12345.1234").success).toBe(true);
				});

				test("does not parse on digit count before decimal greater than precision", () => {
					const column = numeric(5, 2);
					const schema = column.zodSchema();
					expect(schema.safeParse(123456).success).toBe(false);
					expect(schema.safeParse(123456.1234).success).toBe(false);
					expect(schema.safeParse("123456").success).toBe(false);
					expect(schema.safeParse("123456.1234").success).toBe(false);
				});

				test("parses on decimal count less than scale", () => {
					const column = numeric(5, 4);
					const schema = column.zodSchema();
					expect(schema.safeParse(1234.1).success).toBe(true);
					expect(schema.safeParse("1234.1").success).toBe(true);
				});

				test("parses on decimal count equal to scale", () => {
					const column = numeric(5, 4);
					const schema = column.zodSchema();
					expect(schema.safeParse(1234.1234).success).toBe(true);
					expect(schema.safeParse("1234.1234").success).toBe(true);
				});

				test("does not parse decimal count grater than scale", () => {
					const column = numeric(5, 4);
					const schema = column.zodSchema();
					expect(schema.safeParse(1234.12345).success).toBe(false);
					expect(schema.safeParse("1234.12345").success).toBe(false);
				});
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = numeric();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = numeric().defaultTo(1);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(2).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = numeric().notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = numeric().notNull().defaultTo(1);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse(2).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});
});

describe("pgEnum", () => {
	test("returns a PgEnum instance", () => {
		const testEnum = pgEnum("myEnum", ["one", "two", "three"]);
		expect(testEnum).toBeInstanceOf(PgEnum);
	});

	test("enum name", () => {
		const testEnum = pgEnum("myEnum", ["one", "two", "three"]);
		expect(testEnum.name).toBe("myEnum");
	});

	test("enum values", () => {
		const testEnum = pgEnum("myEnum", ["one", "two", "three"]);
		expect(testEnum.values).toStrictEqual(["one", "two", "three"]);
	});

	test("is not a primary key by default", () => {
		const testEnum = pgEnum("myEnum", ["one", "two", "three"]);
		expect(testEnum._isPrimaryKey).toBe(false);
	});

	test("default info", () => {
		const testEnum = pgEnum("myEnum", ["one", "two", "three"]);
		expect(testEnum.info).toStrictEqual({
			dataType: "myEnum",
			characterMaximumLength: null,
			datetimePrecision: null,
			defaultValue: null,
			identity: null,
			isNullable: true,
			numericPrecision: null,
			numericScale: null,
			renameFrom: null,
			enum: true,
		});
	});

	test("does not have generatedAlwaysAsIdentity", () => {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const column = pgEnum("myEnum", ["one", "two", "three"]) as any;
		expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(false);
	});

	test("does not have generatedByDefaultAsIdentity", () => {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const column = pgEnum("myEnum", ["one", "two", "three"]) as any;
		expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
			false,
		);
	});

	test("notNull()", () => {
		const testEnum = pgEnum("myEnum", ["one", "two", "three"]).notNull();
		expect(testEnum.info.isNullable).toBe(false);
	});

	test("defaultTo()", () => {
		const testEnum = pgEnum("myEnum", ["one", "two", "three"]).defaultTo("one");
		expect(testEnum.info.defaultValue).toBe("'one'::myEnum");
	});

	test("renameFrom()", () => {
		const testEnum = pgEnum("myEnum", ["one", "two", "three"]).renameFrom(
			"old_name",
		);
		expect(testEnum.info.renameFrom).toBe("old_name");
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string null", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]);
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, or null", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]);
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const stringResult = schema.safeParse("user");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("user");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
				if (nullResult.success) {
					expect(nullResult.data).toBe(null);
				}
			});

			test("output type is string with notNull", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]).notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const stringResult = schema.safeParse("user");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("user");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses enum members", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]);
				const schema = column.zodSchema();
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse("admin").success).toBe(true);
				expect(schema.safeParse("superuser").success).toBe(true);
			});

			test("does not parse other objects", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]);
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
				expect(schema.safeParse(10.123).success).toBe(false);
				expect(schema.safeParse(true).success).toBe(false);
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse({ a: 1 }).success).toBe(false);
				expect(schema.safeParse(Date).success).toBe(false);
			});

			test("parses null", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]);
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse undefined", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]);
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is nullable", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]).defaultTo(
					"user",
				);
				const schema = column.zodSchema();
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]).notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"])
					.notNull()
					.defaultTo("user");
				const schema = column.zodSchema();
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]).defaultTo(
					"user",
				);
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]).notNull();
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"])
					.notNull()
					.defaultTo("user");
				column._isPrimaryKey = true;
				const schema = column.zodSchema();
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
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
}
