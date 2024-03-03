import { type Expression, sql } from "kysely";
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
	PgTimeColumn,
	PgTimeTz,
	PgTimestamp,
	PgTimestampColumn,
	PgTimestampTz,
	PgUuid,
	PgVarChar,
	pgBigint,
	pgBigserial,
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
	pgJsonb,
	pgNumeric,
	pgReal,
	pgSerial,
	pgText,
	pgTime,
	pgTimestamp,
	pgTimestamptz,
	pgTimetz,
	pgUuid,
	pgVarchar,
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
});

describe("PgIdentifiableColumn", () => {
	test("generatedAlwaysAsIdentity sets identity to ALWAYS", () => {
		const column = pgInteger();
		column.generatedAlwaysAsIdentity();
		const columnInfo = Object.fromEntries(Object.entries(column)).info;
		expect(columnInfo.identity).toBe("ALWAYS");
	});

	test("generatedByDefaultAsIdentity sets identity to BY DEFAULT", () => {
		const column = pgInteger();
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
			const column = pgBoolean() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgBoolean() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});

		describe("Zod", () => {
			describe("by default", () => {
				test("input type is boolean, Boolish, null or undefined", () => {
					const column = pgBoolean();
					const schema = column.zodSchema();
					type InpuType = z.input<typeof schema>;
					type Expected = boolean | Boolish | null | undefined;
					const isEqual: Expect<Equal<InpuType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("output type is boolean, null or undefined", () => {
					const column = pgBoolean();
					const schema = column.zodSchema();
					type OutputType = z.output<typeof schema>;
					type Expected = boolean | null | undefined;
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

				test("input type is boolean, Boolish with notNull", () => {
					const column = pgBoolean().notNull();
					const schema = column.zodSchema();
					type InputType = z.input<typeof schema>;
					type Expected = boolean | Boolish;
					const isEqual: Expect<Equal<InputType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("output type is boolean with notNull", () => {
					const column = pgBoolean().notNull();
					const schema = column.zodSchema();
					type OutputType = z.output<typeof schema>;
					type Expected = boolean;
					const isEqual: Expect<Equal<OutputType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("parses boolean", () => {
					const column = pgBoolean();
					const schema = column.zodSchema();
					const result = schema.safeParse(true);
					expect(result.success).toBe(true);
					if (result.success) {
						expect(result.data).toBe(true);
					}
				});

				test("parses null", () => {
					const column = pgBoolean();
					const schema = column.zodSchema();
					const result = schema.safeParse(null);
					expect(result.success).toBe(true);
					if (result.success) {
						expect(result.data).toBe(null);
					}
				});

				test("parses undefined", () => {
					const column = pgBoolean();
					const schema = column.zodSchema();
					expect(schema.safeParse(undefined).success).toBe(true);
				});

				test("parses with coercion with boolish values", () => {
					const column = pgBoolean();
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
					const column = pgBoolean();
					const schema = column.zodSchema();
					expect(schema.safeParse("TRUE").success).toBe(false);
					expect(schema.safeParse("FALSE").success).toBe(false);
					expect(schema.safeParse("undefined").success).toBe(false);
					expect(schema.safeParse("null").success).toBe(false);
					expect(schema.safeParse(2).success).toBe(false);
				});

				test("with default value is nullable and optional", () => {
					const column = pgBoolean().defaultTo(true);
					const schema = column.zodSchema();
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(true);
					expect(schema.safeParse(undefined).success).toBe(true);
				});

				test("with notNull is non nullable and required", () => {
					const column = pgBoolean().notNull();
					const schema = column.zodSchema();
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with default and notNull is non nullable", () => {
					const column = pgBoolean().notNull().defaultTo(true);
					const schema = column.zodSchema();
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});
			});

			describe("as primary key", () => {
				test("input type is boolean, Boolish", () => {
					const column = pgBoolean().primaryKey();
					const schema = column.zodSchema();
					type InpuType = z.input<typeof schema>;
					type Expected = boolean | Boolish;
					const isEqual: Expect<Equal<InpuType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("input type is boolean", () => {
					const column = pgBoolean().primaryKey();
					const schema = column.zodSchema();
					type OutputType = z.output<typeof schema>;
					type Expected = boolean;
					const isEqual: Expect<Equal<OutputType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("is non nullable and required", () => {
					const column = pgBoolean().primaryKey();
					const schema = column.zodSchema();
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with default value is non nullable", () => {
					const column = pgBoolean().defaultTo(true).primaryKey();
					const schema = column.zodSchema();
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with notNull is non nullable and required", () => {
					const column = pgBoolean().notNull().primaryKey();
					const schema = column.zodSchema();
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with default and notNull is non nullable", () => {
					const column = pgBoolean().notNull().defaultTo(true).primaryKey();
					const schema = column.zodSchema();
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});
			});

			describe("errors", () => {
				test("undefined", () => {
					const column = pgBoolean().notNull();
					const schema = column.zodSchema();
					const result = schema.safeParse(undefined);
					expect(result.success).toBe(false);
					if (!result.success) {
						const expected = [
							{
								code: "invalid_type",
								expected: "boolean",
								received: "undefined",
								path: [],
								message: "Required",
							},
						];
						expect(result.error.errors).toStrictEqual(expected);
					}
				});

				test("null", () => {
					const column = pgBoolean().notNull();
					const schema = column.zodSchema();
					const result = schema.safeParse(null);
					expect(result.success).toBe(false);
					if (!result.success) {
						const expected = [
							{
								code: "invalid_type",
								expected: "boolean",
								received: "null",
								path: [],
								message: "Expected boolean, received null",
							},
						];
						expect(result.error.errors).toStrictEqual(expected);
					}
				});

				test("not a boolean", () => {
					const column = pgBoolean();
					const schema = column.zodSchema();
					const result = schema.safeParse("hello");
					expect(result.success).toBe(false);
					if (!result.success) {
						const expected = [
							{
								code: "custom",
								path: [],
								message: "Invalid boolean",
							},
						];
						expect(result.error.errors).toStrictEqual(expected);
					}
				});
			});
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

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgText() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgText() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null or undefined", () => {
				const column = pgText();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const column = pgText();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
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

			test("input type is string with notNull", () => {
				const column = pgText().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("one");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("one");
				}
			});

			test("output type is string with notNull", () => {
				const column = pgText().notNull();
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
				const column = pgText();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
			});

			test("parses null", () => {
				const column = pgText();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgText();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("does not parse other types", () => {
				const column = pgText();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const column = pgText().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgText().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgText().notNull().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string with primary key", () => {
				const column = pgText().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const column = pgText().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgText().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgText().defaultTo("hello").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgText().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgText().notNull().defaultTo("1").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgText().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_type",
							expected: "string",
							received: "undefined",
							path: [],
							message: "Required",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgText().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_type",
							expected: "string",
							received: "null",
							path: [],
							message: "Expected string, received null",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a string", () => {
				const column = pgText();
				const schema = column.zodSchema();
				const result = schema.safeParse(12);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_type",
							expected: "string",
							received: "number",
							path: [],
							message: "Expected string, received number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
		});
	});
});

describe("pgBigInt", () => {
	test("returns a PgBigInt instance", () => {
		const column = pgBigint();
		expect(column).toBeInstanceOf(PgBigInt);
	});

	describe("PgBigInt", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgBigint()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to bigint", () => {
			const info = Object.fromEntries(Object.entries(pgBigint())).info;
			expect(info.dataType).toBe("bigint");
		});

		test("defaultTo with column data type", () => {
			const column = pgBigint();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(12234433444444455n);
			expect(info.defaultValue).toBe("'12234433444444455'::bigint");

			column.defaultTo(12);
			expect(info.defaultValue).toBe("'12'::bigint");

			column.defaultTo("12");
			expect(info.defaultValue).toBe("'12'::bigint");
		});

		test("has generatedAlwaysAsIdentity", () => {
			const column = pgBigint();
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("has generatedByDefaultAsIdentity", () => {
			const column = pgBigint();
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is bigint, number, string, null, or undefined", () => {
				const column = pgBigint();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null, or undefined", () => {
				const column = pgBigint();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
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

			test("input type is bigint, number, or string with notNull", () => {
				const column = pgBigint().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = bigint | number | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse(10n);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("10");
				}
			});

			test("output type is string with notNull", () => {
				const column = pgBigint().notNull();
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
				const column = pgBigint().generatedAlwaysAsIdentity();
				const schema = column.zodSchema();
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("input type is bigint, number, string, or undefined with generatedByDefaultAsIdentity", () => {
				const column = pgBigint().generatedByDefaultAsIdentity();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = bigint | string | number | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse(10n);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("10");
				}

				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("output type is string with generatedByDefaultAsIdentity", () => {
				const column = pgBigint().generatedByDefaultAsIdentity();
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
				const column = pgBigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = pgBigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses string", () => {
				const column = pgBigint();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
			});

			test("parses null", () => {
				const column = pgBigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgBigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("does not parse floats", () => {
				const column = pgBigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("fails on invalid string", () => {
				const column = pgBigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const column = pgBigint().defaultTo("1");
				const schema = column.zodSchema();

				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("minimumValue is -9223372036854775808n", () => {
				const column = pgBigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(-9223372036854775808n).success).toBe(true);
				expect(schema.safeParse("-9223372036854775808").success).toBe(true);
				expect(schema.safeParse(-9223372036854775809n).success).toBe(false);
				expect(schema.safeParse("-9223372036854775809").success).toBe(false);
			});

			test("maximumValue is 9223372036854775807n", () => {
				const column = pgBigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(9223372036854775807n).success).toBe(true);
				expect(schema.safeParse("9223372036854775807").success).toBe(true);
				expect(schema.safeParse(9223372036854775808n).success).toBe(false);
				expect(schema.safeParse("9223372036854775808").success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgBigint().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgBigint().notNull().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is bigint, number, string", () => {
				const column = pgBigint().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const column = pgBigint().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgBigint().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgBigint().defaultTo(1).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgBigint().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgBigint().notNull().defaultTo("1").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgBigint().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Required",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgBigint().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected BigInt, Number or String that can coerce to BigInt, received null",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a bigint", () => {
				const column = pgBigint();
				const schema = column.zodSchema();
				const result = schema.safeParse("hello");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Invalid bigint",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
		});
	});
});

describe("pgBigSerial", () => {
	test("returns a PgBigSerial instance", () => {
		const column = pgBigserial();
		expect(column).toBeInstanceOf(PgBigSerial);
	});

	describe("PgBigSerial", () => {
		test("inherits from PgColumnWithoutDefault", () => {
			expect(pgBigserial()).toBeInstanceOf(PgGeneratedColumn);
		});

		test("dataType is set to bigserial", () => {
			const info = Object.fromEntries(Object.entries(pgBigserial())).info;
			expect(info.dataType).toBe("bigserial");
		});

		test("does not have generatedAlwaysAsIdentity", (context) => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgBigserial() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", (context) => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgBigserial() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		test("has never type", () => {
			const column = pgBigserial();
			const schema = column.zodSchema();
			type SchemaType = typeof schema;
			type Expected = z.ZodType<never, z.ZodTypeDef, never>;
			const isEqual: Expect<Equal<SchemaType, Expected>> = true;
			expect(isEqual).toBe(true);
			const result = schema.safeParse(1);
			expect(result.success).toBe(false);
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
			expect(info.defaultValue).toBe("'\\x68656c6c6f'::bytea");

			column.defaultTo("12");
			expect(info.defaultValue).toBe("'\\x3132'::bytea");

			const expression = sql`\\x7b2261223a312c2262223a327d'::bytea`;
			column.defaultTo(expression);
			expect(info.defaultValue).toBe(expression);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgBytea() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgBytea() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is Buffer, string, null, or undefined", () => {
				const column = pgBytea();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = Buffer | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Buffer, string, null, or undefined", () => {
				const column = pgBytea();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Buffer | string | null | undefined;
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

			test("input type is Buffer or string with notNull", () => {
				const column = pgBytea().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = Buffer | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Buffer or string with notNull", () => {
				const column = pgBytea().notNull();
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
				const column = pgBytea();
				const schema = column.zodSchema();
				expect(schema.safeParse(Buffer.from("hello")).success).toBe(true);
			});

			test("parses strings", () => {
				const column = pgBytea();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
			});

			test("parses null", () => {
				const column = pgBytea();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse other objects", () => {
				const column = pgBytea();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(false);
				expect(schema.safeParse(10.123).success).toBe(false);
				expect(schema.safeParse(true).success).toBe(false);
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse({ a: 1 }).success).toBe(false);
				expect(schema.safeParse(Date).success).toBe(false);
			});

			test("parses undefined", () => {
				const column = pgBytea();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable, and optional", () => {
				const column = pgBytea().defaultTo(Buffer.from("1"));
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgBytea().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgBytea().notNull().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is Buffer or string", () => {
				const column = pgBytea().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = Buffer | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Buffer or string", () => {
				const column = pgBytea().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Buffer | string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgBytea().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgBytea().defaultTo("1").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgBytea().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgBytea().notNull().defaultTo("1").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgBytea().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Required",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgBytea().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Expected Buffer or string, received null",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a bytea", () => {
				const column = pgBytea();
				const schema = column.zodSchema();
				const result = schema.safeParse(new Date());
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Expected Buffer or string, received object",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
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

			column.defaultTo(new Date(1));
			expect(info.defaultValue).toBe("'1970-01-01'::date");

			column.defaultTo(new Date(1).toISOString());
			expect(info.defaultValue).toBe("'1970-01-01'::date");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgDate() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgDate() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is Date, string, null, or undefined", () => {
				const column = pgDate();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date, null, or undefined", () => {
				const column = pgDate();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Date | null | undefined;
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

			test("input type is Date or string with notNull", () => {
				const column = pgDate().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = Date | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date with notNull", () => {
				const column = pgDate().notNull();
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
				const column = pgDate();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
			});

			test("parses strings that can be coerced into dates", () => {
				const column = pgDate();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date().toISOString()).success).toBe(true);
				expect(schema.safeParse("not a date").success).toBe(false);
			});

			test("parses null", () => {
				const column = pgDate();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgDate();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgDate().defaultTo(new Date());
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgDate().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgDate().notNull().defaultTo(new Date());
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is Date, string", () => {
				const column = pgDate().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date", () => {
				const column = pgDate().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Date;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgDate().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgDate().defaultTo(new Date()).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgDate().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgDate().notNull().defaultTo(new Date()).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgDate().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Required",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgDate().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected Date or String that can coerce to Date, received null",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a date", () => {
				const column = pgDate();
				const schema = column.zodSchema();
				const result = schema.safeParse("hello");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_date",
							path: [],
							message: "Invalid date",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
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

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgDoublePrecision() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgDoublePrecision() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, bigint, string, null, or undefined", () => {
				const column = pgDoublePrecision();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null, or undefined", () => {
				const column = pgDoublePrecision();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
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

			test("input type is  number, bigint, or string with notNull", () => {
				const column = pgDoublePrecision().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = bigint | number | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = pgDoublePrecision().notNull();
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
				const column = pgDoublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = pgDoublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const column = pgDoublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const column = pgDoublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = pgDoublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgDoublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgDoublePrecision().defaultTo(30);
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgDoublePrecision().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgDoublePrecision().notNull().defaultTo(1.1);
				const schema = column.zodSchema();
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -1e308", () => {
				const column = pgDoublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse(-tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(-elevenCentillionBitInt).success).toBe(false);
			});

			test("maximum is 1e308", () => {
				const column = pgDoublePrecision();
				const schema = column.zodSchema();
				expect(schema.safeParse(tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(elevenCentillionBitInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is number, bigint, string", () => {
				const column = pgDoublePrecision().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const column = pgDoublePrecision().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgDoublePrecision().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgDoublePrecision().defaultTo(1.1).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgDoublePrecision().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgDoublePrecision()
					.notNull()
					.defaultTo(2.2)
					.primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgDoublePrecision().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Required",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgDoublePrecision().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected bigint, Number or String that can be converted to a floating-point number or a bigint, received null",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a double precision", () => {
				const column = pgDoublePrecision();
				const schema = column.zodSchema();
				const result = schema.safeParse("hello");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected bigint, Number or String that can be converted to a floating-point number or a bigint",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("smaller than minimum", () => {
				const column = pgDoublePrecision();
				const schema = column.zodSchema();
				const result = schema.safeParse(-elevenCentillionBitInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "too_small",
							exact: false,
							inclusive: true,
							message: "Number must be greater than or equal to -1e+308",
							minimum: -1e308,
							path: [],
							type: "number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("greater than maximum", () => {
				const column = pgDoublePrecision();
				const schema = column.zodSchema();
				const result = schema.safeParse(elevenCentillionBitInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "too_big",
							exact: false,
							inclusive: true,
							message: "Number must be less than or equal to 1e+308",
							maximum: 1e308,
							path: [],
							type: "number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
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

		test("dataType is set to real", () => {
			const info = Object.fromEntries(Object.entries(pgFloat4())).info;
			expect(info.dataType).toBe("real");
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

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgFloat4() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgFloat4() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, bigint, string, null, or undefined", () => {
				const column = pgFloat4();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const column = pgFloat4();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number | null | undefined;
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

			test("input type is number, bigint, or string with notNull", () => {
				const column = pgFloat4().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number with notNull", () => {
				const column = pgFloat4().notNull();
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
				const column = pgFloat4();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = pgFloat4();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const column = pgFloat4();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const column = pgFloat4();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = pgFloat4();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgFloat4();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgFloat4().defaultTo(30);
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgFloat4().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgFloat4().notNull().defaultTo(1.1);
				const schema = column.zodSchema();
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -1e37", () => {
				const column = pgFloat4();
				const schema = column.zodSchema();
				expect(schema.safeParse(-tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(-eleventUnDecillionBigInt).success).toBe(false);
			});

			test("maximum is 1e37", () => {
				const column = pgFloat4();
				const schema = column.zodSchema();
				expect(schema.safeParse(tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(eleventUnDecillionBigInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is number, bigint, string", () => {
				const column = pgFloat4().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const column = pgFloat4().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgFloat4().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgFloat4().defaultTo(1.1).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgFloat4().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgFloat4().notNull().defaultTo(2.2).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgFloat4().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Required",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgFloat4().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected bigint, Number or String that can be converted to a floating-point number or a bigint, received null",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a float4", () => {
				const column = pgFloat4();
				const schema = column.zodSchema();
				const result = schema.safeParse("hello");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected bigint, Number or String that can be converted to a floating-point number or a bigint",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("smaller than minimum", () => {
				const column = pgFloat4();
				const schema = column.zodSchema();
				const result = schema.safeParse(-eleventUnDecillionBigInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "too_small",
							exact: false,
							inclusive: true,
							message: "Number must be greater than or equal to -1e+37",
							minimum: -1e37,
							path: [],
							type: "number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("greater than maximum", () => {
				const column = pgFloat4();
				const schema = column.zodSchema();
				const result = schema.safeParse(eleventUnDecillionBigInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "too_big",
							exact: false,
							inclusive: true,
							message: "Number must be less than or equal to 1e+37",
							maximum: 1e37,
							path: [],
							type: "number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
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

		test("dataType is set to double precision", () => {
			const info = Object.fromEntries(Object.entries(pgFloat8())).info;
			expect(info.dataType).toBe("double precision");
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

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgFloat8() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgFloat8() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, bigint, string, null, or undefined", () => {
				const column = pgFloat8();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const column = pgFloat8();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number | null | undefined;
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

			test("input type is number, bigint, or string with notNull", () => {
				const column = pgFloat8().notNull();
				const schema = column.zodSchema();
				type OutputType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number with notNull", () => {
				const column = pgFloat8().notNull();
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
				const column = pgFloat8();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = pgFloat8();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const column = pgFloat8();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const column = pgFloat8();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = pgFloat8();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgFloat8();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgFloat8().defaultTo(30);
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgFloat8().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgFloat8().notNull().defaultTo(1.1);
				const schema = column.zodSchema();
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -1e308", () => {
				const column = pgFloat8();
				const schema = column.zodSchema();
				expect(schema.safeParse(-tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(-elevenCentillionBitInt).success).toBe(false);
			});

			test("maximum is 1e308", () => {
				const column = pgFloat8();
				const schema = column.zodSchema();
				expect(schema.safeParse(tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(elevenCentillionBitInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is number, bigint, string", () => {
				const column = pgFloat8().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const column = pgFloat8().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgFloat8().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgFloat8().defaultTo(1.1).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgFloat8().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgFloat8().notNull().defaultTo(2.2).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgFloat8().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Required",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgFloat8().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected bigint, Number or String that can be converted to a floating-point number or a bigint, received null",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a float8", () => {
				const column = pgFloat8();
				const schema = column.zodSchema();
				const result = schema.safeParse("hello");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected bigint, Number or String that can be converted to a floating-point number or a bigint",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("smaller than minimum", () => {
				const column = pgFloat8();
				const schema = column.zodSchema();
				const result = schema.safeParse(-elevenCentillionBitInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "too_small",
							exact: false,
							inclusive: true,
							message: "Number must be greater than or equal to -1e+308",
							minimum: -1e308,
							path: [],
							type: "number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("greater than maximum", () => {
				const column = pgFloat8();
				const schema = column.zodSchema();
				const result = schema.safeParse(elevenCentillionBitInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "too_big",
							exact: false,
							inclusive: true,
							message: "Number must be less than or equal to 1e+308",
							maximum: 1e308,
							path: [],
							type: "number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
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

		test("dataType is set to smallint", () => {
			const info = Object.fromEntries(Object.entries(pgInt2())).info;
			expect(info.dataType).toBe("smallint");
		});

		test("defaultTo with column data type", () => {
			const column = pgInt2();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(10);
			expect(info.defaultValue).toBe("'10'::smallint");

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::smallint");
		});

		test("has have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgInt2() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgInt2() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, string, null, or undefined", () => {
				const column = pgInt2();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const column = pgInt2();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number | null | undefined;
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

			test("input type is number or string with notNull", () => {
				const column = pgInt2().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number with notNull", () => {
				const column = pgInt2().notNull();
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
				const column = pgInt2().generatedAlwaysAsIdentity();
				const schema = column.zodSchema();
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("output type is number with generatedByDefaultAsIdentity", () => {
				const column = pgInt2().generatedByDefaultAsIdentity();
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
				const column = pgInt2();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("does not parse decimals", () => {
				const column = pgInt2();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("does not parse bigint", () => {
				const column = pgInt2();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(false);
			});

			test("parses strings that can be coerced to number", () => {
				const column = pgInt2();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = pgInt2();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgInt2();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgInt2().defaultTo(30);
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgInt2().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgInt2().notNull().defaultTo(11);
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -32768", () => {
				const column = pgInt2();
				const schema = column.zodSchema();
				expect(schema.safeParse(-32768).success).toBe(true);
				expect(schema.safeParse(-32769).success).toBe(false);
			});

			test("maximum is 32767", () => {
				const column = pgInt2();
				const schema = column.zodSchema();
				expect(schema.safeParse(32767).success).toBe(true);
				expect(schema.safeParse(32768).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is number, string", () => {
				const column = pgInt2().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const column = pgInt2().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgInt2().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgInt2().defaultTo(1).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgInt2().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgInt2().notNull().defaultTo(40).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});

	describe("errors", () => {
		test("undefined", () => {
			const column = pgInt2().notNull();
			const schema = column.zodSchema();
			const result = schema.safeParse(undefined);
			expect(result.success).toBe(false);
			if (!result.success) {
				const expected = [
					{
						code: "custom",
						path: [],
						message: "Required",
						fatal: true,
					},
				];
				expect(result.error.errors).toStrictEqual(expected);
			}
		});

		test("null", () => {
			const column = pgInt2().notNull();
			const schema = column.zodSchema();
			const result = schema.safeParse(null);
			expect(result.success).toBe(false);
			if (!result.success) {
				const expected = [
					{
						code: "custom",
						path: [],
						message:
							"Expected Number or String that can be converted to a number, received null",
						fatal: true,
					},
				];
				expect(result.error.errors).toStrictEqual(expected);
			}
		});

		test("not an int2", () => {
			const column = pgInt2();
			const schema = column.zodSchema();
			const result = schema.safeParse("hello");
			expect(result.success).toBe(false);
			if (!result.success) {
				const expected = [
					{
						code: "invalid_type",
						expected: "number",
						received: "nan",
						path: [],
						message: "Expected number, received nan",
					},
				];
				expect(result.error.errors).toStrictEqual(expected);
			}
		});

		test("bigint", () => {
			const column = pgInt2();
			const schema = column.zodSchema();
			const result = schema.safeParse(1n);
			expect(result.success).toBe(false);
			if (!result.success) {
				const expected = [
					{
						code: "invalid_type",
						expected: "number",
						received: "bigint",
						path: [],
						message: "Expected number, received bigint",
					},
				];
				expect(result.error.errors).toStrictEqual(expected);
			}
		});

		test("smaller than minimum", () => {
			const column = pgInt2();
			const schema = column.zodSchema();
			const result = schema.safeParse(-32769);
			expect(result.success).toBe(false);
			if (!result.success) {
				const expected = [
					{
						code: "too_small",
						exact: false,
						inclusive: true,
						message: "Number must be greater than or equal to -32768",
						minimum: -32768,
						path: [],
						type: "number",
					},
				];
				expect(result.error.errors).toStrictEqual(expected);
			}
		});

		test("greater than maximum", () => {
			const column = pgInt2();
			const schema = column.zodSchema();
			const result = schema.safeParse(32768);
			expect(result.success).toBe(false);
			if (!result.success) {
				const expected = [
					{
						code: "too_big",
						exact: false,
						inclusive: true,
						message: "Number must be less than or equal to 32767",
						maximum: 32767,
						path: [],
						type: "number",
					},
				];
				expect(result.error.errors).toStrictEqual(expected);
			}
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
			expect(info.dataType).toBe("integer");
		});

		test("defaultTo with column data type", () => {
			const column = pgInt4();
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
			const column = pgInt4() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("has generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgInt4() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, string, null, or undefined", () => {
				const column = pgInt4();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const column = pgInt4();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number | null | undefined;
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

			test("input type is number or string with notNull", () => {
				const column = pgInt4().notNull();
				const schema = column.zodSchema();
				type OutputType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number with notNull", () => {
				const column = pgInt4().notNull();
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
				const column = pgInt4().generatedAlwaysAsIdentity();
				const schema = column.zodSchema();
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("output type is number with generatedByDefaultAsIdentity", () => {
				const column = pgInt4().generatedByDefaultAsIdentity();
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
				const column = pgInt4();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("does not parse decimals", () => {
				const column = pgInt4();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("does not parse bigint", () => {
				const column = pgInt4();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(false);
			});

			test("parses strings that can be coerced to number", () => {
				const column = pgInt4();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = pgInt4();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgInt4();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgInt4().defaultTo(30);
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgInt4().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgInt4().notNull().defaultTo(1.1);
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -2147483648", () => {
				const column = pgInt4();
				const schema = column.zodSchema();
				expect(schema.safeParse(-2147483648).success).toBe(true);
				expect(schema.safeParse(-2147483649).success).toBe(false);
			});

			test("maximum is 2147483647", () => {
				const column = pgInt4();
				const schema = column.zodSchema();
				expect(schema.safeParse(2147483647).success).toBe(true);
				expect(schema.safeParse(2147483648).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is number, string", () => {
				const column = pgInt4().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const column = pgInt4().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgInt4().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgInt4().defaultTo(1).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgInt4().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgInt4().notNull().defaultTo(40).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgInt4().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Required",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgInt4().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected Number or String that can be converted to a number, received null",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not an int4", () => {
				const column = pgInt4();
				const schema = column.zodSchema();
				const result = schema.safeParse("hello");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_type",
							expected: "number",
							received: "nan",
							path: [],
							message: "Expected number, received nan",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("bigint", () => {
				const column = pgInt4();
				const schema = column.zodSchema();
				const result = schema.safeParse(1n);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_type",
							expected: "number",
							received: "bigint",
							path: [],
							message: "Expected number, received bigint",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("smaller than minimum", () => {
				const column = pgInt4();
				const schema = column.zodSchema();
				const result = schema.safeParse(-2147483649);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "too_small",
							exact: false,
							inclusive: true,
							message: "Number must be greater than or equal to -2147483648",
							minimum: -2147483648,
							path: [],
							type: "number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("greater than maximum", () => {
				const column = pgInt4();
				const schema = column.zodSchema();
				const result = schema.safeParse(2147483648);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "too_big",
							exact: false,
							inclusive: true,
							message: "Number must be less than or equal to 2147483647",
							maximum: 2147483647,
							path: [],
							type: "number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
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
			expect(info.dataType).toBe("bigint");
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

		test("has generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgInt8() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("has generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgInt8() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is bigint, number, string, null, or undefined", () => {
				const column = pgInt8();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const column = pgInt8();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number | null | undefined;
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

			test("input type is number with notNull", () => {
				const column = pgInt8().notNull();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is bigint, number, or string with notNull", () => {
				const column = pgInt8().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
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
				const column = pgInt8().generatedAlwaysAsIdentity();
				const schema = column.zodSchema();
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("output type is number with generatedByDefaultAsIdentity", () => {
				const column = pgInt8().generatedByDefaultAsIdentity();
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
				const column = pgInt8();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = pgInt8();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses string", () => {
				const column = pgInt8();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
			});

			test("parses null", () => {
				const column = pgInt8();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgInt8();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("does not parse floats", () => {
				const column = pgBigint();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("fails on invalid string", () => {
				const column = pgInt8();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const column = pgInt8().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("minimumValue is -9223372036854775808n", () => {
				const column = pgInt8();
				const schema = column.zodSchema();
				expect(schema.safeParse(-9223372036854775808n).success).toBe(true);
				expect(schema.safeParse("-9223372036854775808").success).toBe(true);
				expect(schema.safeParse(-9223372036854775809n).success).toBe(false);
				expect(schema.safeParse("-9223372036854775809").success).toBe(false);
			});

			test("maximumValue is 9223372036854775807n", () => {
				const column = pgInt8();
				const schema = column.zodSchema();
				expect(schema.safeParse(9223372036854775807n).success).toBe(true);
				expect(schema.safeParse("9223372036854775807").success).toBe(true);
				expect(schema.safeParse(9223372036854775808n).success).toBe(false);
				expect(schema.safeParse("9223372036854775808").success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgInt8().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgInt8().notNull().defaultTo(1);
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is bigint, number, string", () => {
				const column = pgInt8().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const column = pgInt8().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgInt8().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgInt8().defaultTo(1).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgInt8().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgInt8().notNull().defaultTo("1").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgInt8().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Required",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgInt8().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected BigInt, Number or String that can coerce to BigInt, received null",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a bigint", () => {
				const column = pgInt8();
				const schema = column.zodSchema();
				const result = schema.safeParse("hello");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Invalid bigint",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
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
			expect(info.defaultValue).toBe("10");

			column.defaultTo("10");
			expect(info.defaultValue).toBe("10");

			const expression = sql`20`;
			column.defaultTo(expression);
			expect(info.defaultValue).toBe(expression);
		});

		test("has generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgInteger() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("has generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgInteger() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, string, null, or undefined", () => {
				const column = pgInteger();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const column = pgInteger();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number | null | undefined;
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

			test("input type is number or string with notNull", () => {
				const column = pgInteger().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number with notNull", () => {
				const column = pgInteger().notNull();
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
				const column = pgInteger().generatedAlwaysAsIdentity();
				const schema = column.zodSchema();
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("output type is number with generatedByDefaultAsIdentity", () => {
				const column = pgInteger().generatedByDefaultAsIdentity();
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
				const column = pgInteger();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("does not parse decimals", () => {
				const column = pgInteger();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("does not parse bigint", () => {
				const column = pgInteger();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(false);
			});

			test("parses strings that can be coerced to number", () => {
				const column = pgInteger();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = pgInteger();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgInteger();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgInteger().defaultTo(30);
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgInteger().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgInteger().notNull().defaultTo(1.1);
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -2147483648", () => {
				const column = pgInteger();
				const schema = column.zodSchema();
				expect(schema.safeParse(-2147483648).success).toBe(true);
				expect(schema.safeParse(-2147483649).success).toBe(false);
			});

			test("maximum is 2147483647", () => {
				const column = pgInteger();
				const schema = column.zodSchema();
				expect(schema.safeParse(2147483647).success).toBe(true);
				expect(schema.safeParse(2147483648).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is number or string", () => {
				const column = pgInteger().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const column = pgInteger().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgInteger().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgInteger().defaultTo(1).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgInteger().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgInteger().notNull().defaultTo(40).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgInteger().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Required",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgInteger().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected Number or String that can be converted to a number, received null",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not an integer", () => {
				const column = pgInteger();
				const schema = column.zodSchema();
				const result = schema.safeParse("hello");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_type",
							expected: "number",
							received: "nan",
							path: [],
							message: "Expected number, received nan",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("bigint", () => {
				const column = pgInteger();
				const schema = column.zodSchema();
				const result = schema.safeParse(1n);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_type",
							expected: "number",
							received: "bigint",
							path: [],
							message: "Expected number, received bigint",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("smaller than minimum", () => {
				const column = pgInteger();
				const schema = column.zodSchema();
				const result = schema.safeParse(-2147483649);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "too_small",
							exact: false,
							inclusive: true,
							message: "Number must be greater than or equal to -2147483648",
							minimum: -2147483648,
							path: [],
							type: "number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("greater than maximum", () => {
				const column = pgInteger();
				const schema = column.zodSchema();
				const result = schema.safeParse(2147483648);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "too_big",
							exact: false,
							inclusive: true,
							message: "Number must be less than or equal to 2147483647",
							maximum: 2147483647,
							path: [],
							type: "number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
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

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgJson() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgJson() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, number, boolean, Record<string, any>, null, or undefined", () => {
				const column = pgJson();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected =
					| string
					| number
					| boolean
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					| Record<string, any>
					| null
					| undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, number, boolean, Record<string, any>, null or undefined", () => {
				const column = pgJson();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected =
					| string
					| number
					| boolean
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					| Record<string, any>
					| null
					| undefined;
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

			test("input type is string, number, boolean, Record<string, any> with notNull", () => {
				const column = pgJson().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				type Expected = string | number | boolean | Record<string, any>;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, number, boolean, Record<string, any> with notNull", () => {
				const column = pgJson().notNull();
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
				const column = pgJson();
				const schema = column.zodSchema();
				expect(schema.safeParse("12").success).toBe(true);
				expect(schema.safeParse('{"foo": "bar"}').success).toBe(true);
				expect(schema.safeParse('{"foo"}').success).toBe(false);
				expect(schema.safeParse("foo").success).toBe(false);
			});

			test("parses numbers", () => {
				const column = pgJson();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(10.123).success).toBe(true);
			});

			test("parses boolean", () => {
				const column = pgJson();
				const schema = column.zodSchema();
				expect(schema.safeParse(true).success).toBe(true);
			});

			test("parses null", () => {
				const column = pgJson();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				if (result.success) {
					console.log(result.data);
				}
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses objects", () => {
				const column = pgJson();
				const schema = column.zodSchema();
				expect(schema.safeParse({ a: 1 }).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgJson();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgJson().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse({ a: 1 }).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgJson().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgJson().notNull().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string, number, boolean, or Record<string, any>", () => {
				const column = pgJson().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				type Expected = string | number | boolean | Record<string, any>;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is JsonArray, JsonObject, or JsonPrimitive", () => {
				const column = pgJson().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				type Expected = string | number | boolean | Record<string, any>;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgJson().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgJson().defaultTo("1").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgJson().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgJson().notNull().defaultTo("1").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgJson().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Required",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgJson().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected value that can be converted to JSON, received null",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not an json", () => {
				const column = pgJson();
				const schema = column.zodSchema();
				const result = schema.safeParse(new Date());
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Invalid JSON",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
		});
	});
});

describe("pgJsonB", () => {
	test("returns a PgJsonB instance", () => {
		const column = pgJsonb();
		expect(column).toBeInstanceOf(PgJsonB);
	});

	describe("PgJsonB", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgJsonb()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to jsonb", () => {
			const info = Object.fromEntries(Object.entries(pgJsonb())).info;
			expect(info.dataType).toBe("jsonb");
		});

		test("defaultTo with column data type", () => {
			const column = pgJsonb();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::jsonb");

			column.defaultTo('{ "foo": "bar" }');
			expect(info.defaultValue).toBe('\'{ "foo": "bar" }\'::jsonb');
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgJsonb() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgJsonb() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, number, boolean, Record<string, any>, null, or undefined", () => {
				const column = pgJsonb();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected =
					| string
					| number
					| boolean
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					| Record<string, any>
					| null
					| undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, number, boolean, Record<string, any>, null, or undefined", () => {
				const column = pgJsonb();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected =
					| string
					| number
					| boolean
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					| Record<string, any>
					| null
					| undefined;
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

			test("input type is string, number, boolean, Record<string, any> with notNull", () => {
				const column = pgJsonb().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				type Expected = string | number | boolean | Record<string, any>;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, number, boolean, Record<string, any> with notNull", () => {
				const column = pgJsonb().notNull();
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
				const column = pgJsonb();
				const schema = column.zodSchema();
				expect(schema.safeParse("12").success).toBe(true);
				expect(schema.safeParse('{"foo": "bar"}').success).toBe(true);
				expect(schema.safeParse('{"foo"}').success).toBe(false);
				expect(schema.safeParse("foo").success).toBe(false);
			});

			test("parses numbers", () => {
				const column = pgJsonb();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(10.123).success).toBe(true);
			});

			test("parses boolean", () => {
				const column = pgJsonb();
				const schema = column.zodSchema();
				expect(schema.safeParse(true).success).toBe(true);
			});

			test("parses null", () => {
				const column = pgJsonb();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses objects", () => {
				const column = pgJsonb();
				const schema = column.zodSchema();
				expect(schema.safeParse({ a: 1 }).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgJsonb();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgJsonb().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse({ a: 1 }).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgJsonb().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgJsonb().notNull().defaultTo("1");
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string, number, boolean, or Record<string, any>", () => {
				const column = pgJsonb().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				type Expected = string | number | boolean | Record<string, any>;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is JsonArray, JsonObject, JsonPrimitive", () => {
				const column = pgJsonb().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				type Expected = string | number | boolean | Record<string, any>;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgJsonb().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgJsonb().defaultTo("1").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgJsonb().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgJsonb().notNull().defaultTo("1").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgJsonb().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Required",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgJsonb().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected value that can be converted to JSON, received null",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not an json", () => {
				const column = pgJsonb();
				const schema = column.zodSchema();
				const result = schema.safeParse(new Date());
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Invalid JSON",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
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

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgReal() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgReal() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is bigint, number, string, null, or undefined", () => {
				const column = pgReal();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const column = pgReal();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number | null | undefined;
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
				const column = pgReal().notNull();
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
				const column = pgReal();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = pgReal();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const column = pgReal();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const column = pgReal();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = pgReal();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgReal();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgReal().defaultTo(30);
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgReal().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgReal().notNull().defaultTo(1.1);
				const schema = column.zodSchema();
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -1e37", () => {
				const column = pgReal();
				const schema = column.zodSchema();
				expect(schema.safeParse(-tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(-eleventUnDecillionBigInt).success).toBe(false);
			});

			test("maximum is 1e37", () => {
				const column = pgReal();
				const schema = column.zodSchema();
				expect(schema.safeParse(tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(eleventUnDecillionBigInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is bigint, number, or string", () => {
				const column = pgReal().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const column = pgReal().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgReal().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgReal().defaultTo(1.1).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgReal().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgReal().notNull().defaultTo(2.2).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgReal().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Required",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgReal().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected bigint, Number or String that can be converted to a floating-point number or a bigint, received null",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a real", () => {
				const column = pgReal();
				const schema = column.zodSchema();
				const result = schema.safeParse("hello");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected bigint, Number or String that can be converted to a floating-point number or a bigint",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("smaller than minimum", () => {
				const column = pgReal();
				const schema = column.zodSchema();
				const result = schema.safeParse(-eleventUnDecillionBigInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "too_small",
							exact: false,
							inclusive: true,
							message: "Number must be greater than or equal to -1e+37",
							minimum: -1e37,
							path: [],
							type: "number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("greater than maximum", () => {
				const column = pgReal();
				const schema = column.zodSchema();
				const result = schema.safeParse(eleventUnDecillionBigInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "too_big",
							exact: false,
							inclusive: true,
							message: "Number must be less than or equal to 1e+37",
							maximum: 1e37,
							path: [],
							type: "number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
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

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgSerial() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgSerial() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		test("has never type", () => {
			const column = pgSerial();
			const schema = column.zodSchema();
			type SchemaType = typeof schema;
			type Expected = z.ZodType<never, z.ZodTypeDef, never>;
			const isEqual: Expect<Equal<SchemaType, Expected>> = true;
			expect(isEqual).toBe(true);
			const result = schema.safeParse(1);
			expect(result.success).toBe(false);
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
			const column = pgUuid() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgUuid() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null, or undefined", () => {
				const column = pgUuid();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null, or undefined", () => {
				const column = pgUuid();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
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

			test("input type is string with notNull", () => {
				const column = pgUuid().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = pgUuid().notNull();
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
				const column = pgUuid();
				const schema = column.zodSchema();
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
			});

			test("does not parse other strings", () => {
				const column = pgUuid();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const column = pgUuid();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgUuid();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgUuid().defaultTo(
					"A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11",
				);
				const schema = column.zodSchema();
				expect(
					schema.safeParse("B0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgUuid().notNull();
				const schema = column.zodSchema();
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgUuid()
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
			test("input type is string", () => {
				const column = pgUuid().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const column = pgUuid().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgUuid().primaryKey();
				const schema = column.zodSchema();
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgUuid()
					.defaultTo("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11")
					.primaryKey();
				const schema = column.zodSchema();
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A12").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgUuid().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgUuid()
					.notNull()
					.defaultTo("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11")
					.primaryKey();
				const schema = column.zodSchema();
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A12").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			describe("errors", () => {
				test("undefined", () => {
					const column = pgUuid().notNull();
					const schema = column.zodSchema();
					const result = schema.safeParse(undefined);
					expect(result.success).toBe(false);
					if (!result.success) {
						const expected = [
							{
								code: "custom",
								path: [],
								message: "Required",
								fatal: true,
							},
						];
						expect(result.error.errors).toStrictEqual(expected);
					}
				});

				test("null", () => {
					const column = pgUuid().notNull();
					const schema = column.zodSchema();
					const result = schema.safeParse(null);
					expect(result.success).toBe(false);
					if (!result.success) {
						const expected = [
							{
								code: "custom",
								path: [],
								message: "Expected uuid, received null",
								fatal: true,
							},
						];
						expect(result.error.errors).toStrictEqual(expected);
					}
				});

				test("not a uuid", () => {
					const column = pgUuid();
					const schema = column.zodSchema();
					const result = schema.safeParse("hello");
					expect(result.success).toBe(false);
					if (!result.success) {
						const expected = [
							{
								code: "invalid_string",
								path: [],
								message: "Invalid uuid",
								validation: "uuid",
							},
						];
						expect(result.error.errors).toStrictEqual(expected);
					}
				});
			});
		});
	});
});

describe("pgVarChar", () => {
	test("returns a PgVarChar instance", () => {
		const column = pgVarchar();
		expect(column).toBeInstanceOf(PgVarChar);
	});

	describe("PgVarChar", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(pgVarchar()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to varchar", () => {
			const info = Object.fromEntries(Object.entries(pgVarchar())).info;
			expect(info.dataType).toBe("varchar");
		});

		test("defaultTo with column data type", () => {
			const column = pgVarchar();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::character varying");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgVarchar() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgVarchar() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional maximumLength", () => {
		test("characterMaximumLength is set to maximumLength", () => {
			const column = pgVarchar(255);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.characterMaximumLength).toBe(255);
		});

		test("data type has maximumLength", () => {
			const info = Object.fromEntries(Object.entries(pgVarchar(255))).info;
			expect(info.dataType).toBe("varchar(255)");
		});

		test("defaultTo with column data type", () => {
			const column = pgVarchar(100);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("10");
			expect(info.defaultValue).toBe("'10'::character varying");
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null or undefined", () => {
				const column = pgVarchar();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const column = pgVarchar();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
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

			test("input type is string with notNull", () => {
				const column = pgVarchar().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = pgVarchar().notNull();
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
				const column = pgVarchar();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
			});

			test("does not parse other objects", () => {
				const column = pgVarchar();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(false);
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse({ foo: "bar" }).success).toBe(false);
			});

			test("parses null", () => {
				const column = pgVarchar();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgVarchar();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgVarchar().defaultTo("hello");
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgVarchar().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgVarchar().notNull().defaultTo("hello");
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("without maximum length", () => {
				const column = pgVarchar();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse("hello!").success).toBe(true);
			});

			test("with maximum length", () => {
				const column = pgVarchar(5);
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse("hello!").success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string", () => {
				const column = pgVarchar().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const column = pgVarchar().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgVarchar().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgVarchar().defaultTo("hello").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgVarchar().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgVarchar().notNull().defaultTo("hello").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgVarchar().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_type",
							expected: "string",
							received: "undefined",
							path: [],
							message: "Required",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgVarchar().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_type",
							expected: "string",
							received: "null",
							path: [],
							message: "Expected string, received null",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a string", () => {
				const column = pgVarchar();
				const schema = column.zodSchema();
				const result = schema.safeParse(12);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_type",
							expected: "string",
							received: "number",
							path: [],
							message: "Expected string, received number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("longer than maximum length", () => {
				const column = pgVarchar(5);
				const schema = column.zodSchema();
				const result = schema.safeParse("hello!");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "too_big",
							type: "string",
							exact: false,
							inclusive: true,
							maximum: 5,
							path: [],
							message: "String must contain at most 5 character(s)",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
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

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgChar() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgChar() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
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

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null or undefined", () => {
				const column = pgChar(10);
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const column = pgChar(10);
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
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

			test("input type is string with notNull", () => {
				const column = pgChar(10).notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = pgChar(10).notNull();
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
				const column = pgChar(5);
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse("hello!").success).toBe(false);
			});

			test("does not parse other objects", () => {
				const column = pgChar(5);
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(false);
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse({ foo: "bar" }).success).toBe(false);
			});

			test("parses null", () => {
				const column = pgChar();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgChar();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgChar(5).defaultTo("hello");
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgChar(5).notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgChar(5).notNull().defaultTo("hello");
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string", () => {
				const column = pgChar(10).primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or null", () => {
				const column = pgChar(10).primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgChar(5).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgChar(5).defaultTo("hello").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgChar(5).notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgChar(5).notNull().defaultTo("hello").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgChar().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_type",
							expected: "string",
							received: "undefined",
							path: [],
							message: "Required",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgChar().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_type",
							expected: "string",
							received: "null",
							path: [],
							message: "Expected string, received null",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a string", () => {
				const column = pgChar();
				const schema = column.zodSchema();
				const result = schema.safeParse(12);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_type",
							expected: "string",
							received: "number",
							path: [],
							message: "Expected string, received number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("longer than maximum length", () => {
				const column = pgChar(10);
				const schema = column.zodSchema();
				const result = schema.safeParse("hello world!");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "too_big",
							type: "string",
							exact: false,
							inclusive: true,
							maximum: 10,
							path: [],
							message: "String must contain at most 10 character(s)",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
		});
	});
});

describe("PgTimeColumn", () => {
	test("inherits from PgColumn", () => {
		const column = new PgTimeColumn("time");
		expect(column).toBeInstanceOf(PgColumn);
	});

	test("optional precision accepts values from 0 to 6", () => {
		type range = 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;
		const expect: Expect<
			Equal<range, ConstructorParameters<typeof PgTimeColumn>[1]>
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
		test("inherits from PgTimeColumn", () => {
			expect(pgTime()).toBeInstanceOf(PgTimeColumn);
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

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgTime() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgTime() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
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

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null or undefined", () => {
				const column = pgTime();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const column = pgTime();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
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

			test("input type is string with notNull", () => {
				const column = pgTime().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = pgTime().notNull();
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
				const column = pgTime();
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
				const column = pgTime();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const column = pgTime();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgTime();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgTime().defaultTo("11:30");
				const schema = column.zodSchema();
				expect(schema.safeParse("01:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgTime().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgTime().notNull().defaultTo("11:30");
				const schema = column.zodSchema();
				expect(schema.safeParse("02:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string", () => {
				const column = pgTime().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const column = pgTime().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgTime().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgTime().defaultTo("11:30").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgTime().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgTime().notNull().defaultTo("11:30").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgTime().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							fatal: true,
							path: [],
							message: "Required",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgTime().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							fatal: true,
							path: [],
							message: "Expected string with time format, received null",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a time", () => {
				const column = pgTime();
				const schema = column.zodSchema();
				const result = schema.safeParse(12);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Expected string with time format, received number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a time string", () => {
				const column = pgTime();
				const schema = column.zodSchema();
				const result = schema.safeParse("not a time");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_string",
							path: [],
							message: "Invalid time",
							validation: "regex",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
		});
	});
});

describe("pgTimeTz", () => {
	test("returns a PgTimeTz instance", () => {
		const column = pgTimetz();
		expect(column).toBeInstanceOf(PgTimeTz);
	});

	describe("PgTimeTz", () => {
		test("inherits from PgTimeColumn", () => {
			expect(pgTimetz()).toBeInstanceOf(PgTimeColumn);
		});

		test("dataType is set to timetz", () => {
			const info = Object.fromEntries(Object.entries(pgTimetz())).info;
			expect(info.dataType).toBe("timetz");
		});

		test("datetimePrecision is set to null", () => {
			const column = pgTimetz();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("defaultTo with column data type", () => {
			const column = pgTimetz();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("04:05:06-08:00");
			expect(info.defaultValue).toBe("'04:05:06-08:00'::time with time zone");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgTimetz() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgTimetz() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = pgTimetz(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(Object.entries(pgTimetz(1))).info;
			expect(info.dataType).toBe("timetz(1)");
		});

		test("defaultTo with column data type", () => {
			const column = pgTimetz(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo("04:05:06-08:00");
			expect(info.defaultValue).toBe("'04:05:06-08:00'::time with time zone");
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null, or undefined", () => {
				const column = pgTimetz();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null, or undefined", () => {
				const column = pgTimetz();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const stringResult = schema.safeParse("04:05:06-08:00");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("04:05:06-08:00");
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("input type is string with notNull", () => {
				const column = pgTimetz().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = pgTimetz().notNull();
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
				const column = pgTimetz();
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
				const column = pgTimetz();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const column = pgTimetz();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgTimetz();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgTimetz().defaultTo("11:30");
				const schema = column.zodSchema();
				expect(schema.safeParse("01:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgTimetz().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgTimetz().notNull().defaultTo("11:30");
				const schema = column.zodSchema();
				expect(schema.safeParse("02:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string", () => {
				const column = pgTimetz().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const column = pgTimetz().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgTime().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgTime().defaultTo("11:30").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgTime().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgTime().notNull().defaultTo("11:30").primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgTimetz().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							fatal: true,
							path: [],
							message: "Required",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgTimetz().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							fatal: true,
							path: [],
							message: "Expected string with time format, received null",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a time with time zone", () => {
				const column = pgTimetz();
				const schema = column.zodSchema();
				const result = schema.safeParse(12);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Expected string with time format, received number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a time with time zone string", () => {
				const column = pgTimetz();
				const schema = column.zodSchema();
				const result = schema.safeParse("not a time");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_string",
							path: [],
							message: "Invalid time with time zone",
							validation: "regex",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
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
			expect(pgTimestamp()).toBeInstanceOf(PgTimestampColumn);
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

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgTimestamp() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgTimestamp() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
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

	describe("zod", () => {
		describe("by default", () => {
			test("input type is Date, string, null, or undefined", () => {
				const column = pgTimestamp();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date, null, or undefined", () => {
				const column = pgTimestamp();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Date | null | undefined;
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

			test("input type is Date or string with notNull", () => {
				const column = pgTimestamp().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = Date | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date with notNull", () => {
				const column = pgTimestamp().notNull();
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
				const column = pgTimestamp();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
			});

			test("parses strings that can be coerced into dates", () => {
				const column = pgTimestamp();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date().toISOString()).success).toBe(true);
			});

			test("does not parse other strings", () => {
				const column = pgTimestamp();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const column = pgTimestamp();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgTimestamp();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgTimestamp().defaultTo(new Date());
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgTimestamp().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgTimestamp().notNull().defaultTo(new Date());
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is Date, string", () => {
				const column = pgTimestamp().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date", () => {
				const column = pgTimestamp().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Date;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgTimestamp().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgTimestamp().defaultTo(new Date()).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgTimestamp().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgTimestamp()
					.notNull()
					.defaultTo(new Date())
					.primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgTimestamp().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							fatal: true,
							path: [],
							message: "Required",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgTimestamp().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							fatal: true,
							path: [],
							message:
								"Expected date or string with date format, received null",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a timestamp", () => {
				const column = pgTimestamp();
				const schema = column.zodSchema();
				const result = schema.safeParse(12);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected date or string with date format, received number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a timestamp string", () => {
				const column = pgTimestamp();
				const schema = column.zodSchema();
				const result = schema.safeParse("not a timestamp");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_date",
							path: [],
							message: "Invalid date",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
		});
	});
});

describe("pgTimestampTz", () => {
	test("returns a PgTimestampTz instance", () => {
		const column = pgTimestamptz();
		expect(column).toBeInstanceOf(PgTimestampTz);
	});

	describe("PgTimestampTz", () => {
		test("inherits from PgColumnWithPrecision", () => {
			expect(pgTimestamptz()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to timestamptz", () => {
			const info = Object.fromEntries(Object.entries(pgTimestamptz())).info;
			expect(info.dataType).toBe("timestamptz");
		});

		test("datetimePrecision is set to null", () => {
			const column = pgTimestamptz();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("defaultTo with column data type", () => {
			const column = pgTimestamptz();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(new Date(1));
			expect(info.defaultValue).toBe(
				"'1970-01-01T00:00:00.001Z'::timestamp with time zone",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgTimestamptz() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgTimestamptz() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = pgTimestamptz(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(Object.entries(pgTimestamptz(1))).info;
			expect(info.dataType).toBe("timestamptz(1)");
		});

		test("defaultTo with column data type", () => {
			const column = pgTimestamptz(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.defaultTo(new Date(1));
			expect(info.defaultValue).toBe(
				"'1970-01-01T00:00:00.001Z'::timestamp with time zone",
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is Date, string, null, or undefined", () => {
				const column = pgTimestamptz();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date, null, or undefined", () => {
				const column = pgTimestamptz();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Date | null | undefined;
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

			test("input type is Date or string with notNull", () => {
				const column = pgTimestamptz().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = Date | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date with notNull", () => {
				const column = pgTimestamptz().notNull();
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
				const column = pgTimestamptz();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
			});

			test("parses strings that can be coerced into dates", () => {
				const column = pgTimestamptz();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date().toISOString()).success).toBe(true);
			});

			test("does not parse other strings", () => {
				const column = pgTimestamptz();
				const schema = column.zodSchema();
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const column = pgTimestamptz();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgTimestamptz();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgTimestamptz().defaultTo(new Date());
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgTimestamptz().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgTimestamptz().notNull().defaultTo(new Date());
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is Date, string", () => {
				const column = pgTimestamptz().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date", () => {
				const column = pgTimestamptz().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = Date;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgTimestamptz().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgTimestamptz().defaultTo(new Date()).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgTimestamptz().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgTimestamptz()
					.notNull()
					.defaultTo(new Date())
					.primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgTimestamptz().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							fatal: true,
							path: [],
							message: "Required",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgTimestamptz().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							fatal: true,
							path: [],
							message:
								"Expected date or string with date format, received null",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a timestamp", () => {
				const column = pgTimestamptz();
				const schema = column.zodSchema();
				const result = schema.safeParse(12);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected date or string with date format, received number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a timestamp string", () => {
				const column = pgTimestamptz();
				const schema = column.zodSchema();
				const result = schema.safeParse("not a timestamp");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_date",
							path: [],
							message: "Invalid date",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
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

		test("does not have generatedAlwaysAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgNumeric() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const column = pgNumeric() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
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

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, bigint, string, null or undefined", () => {
				const column = pgNumeric();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null, or undefined", () => {
				const column = pgNumeric();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
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

			test("input type is number, bigint, string with notNull", () => {
				const column = pgNumeric().notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const column = pgNumeric().notNull();
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
				const column = pgNumeric();
				const schema = column.zodSchema();
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = pgNumeric();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const column = pgNumeric();
				const schema = column.zodSchema();
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const column = pgNumeric();
				const schema = column.zodSchema();
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = pgNumeric();
				const schema = column.zodSchema();
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = pgNumeric();
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgNumeric().defaultTo(2);
				const schema = column.zodSchema();
				expect(schema.safeParse(2).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgNumeric().notNull();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgNumeric().notNull().defaultTo(1);
				const schema = column.zodSchema();
				expect(schema.safeParse(2).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("unconstrained", () => {
				const column = pgNumeric();
				const schema = column.zodSchema();
				expect(schema.safeParse(123423442.1).success).toBe(true);
				expect(schema.safeParse(123423442.12345).success).toBe(true);
				expect(schema.safeParse(12342.123452323).success).toBe(true);
			});

			describe("constrained with precision", () => {
				test("parses on digit count before decimal less than precision", () => {
					const column = pgNumeric(5);
					const schema = column.zodSchema();
					expect(schema.safeParse(1234.1).success).toBe(true);
					expect(schema.safeParse(1234).success).toBe(true);
					expect(schema.safeParse("1234.1").success).toBe(true);
					expect(schema.safeParse("1234").success).toBe(true);
				});

				test("parses on digit count before decimal equal to precision", () => {
					const column = pgNumeric(5);
					const schema = column.zodSchema();
					expect(schema.safeParse(12345).success).toBe(true);
					expect(schema.safeParse(12345.1234).success).toBe(true);
					expect(schema.safeParse("12345").success).toBe(true);
					expect(schema.safeParse("12345.1234").success).toBe(true);
				});

				test("does not parse on digit count before decimal greater than precision", () => {
					const column = pgNumeric(5);
					const schema = column.zodSchema();
					expect(schema.safeParse(123456).success).toBe(false);
					expect(schema.safeParse(123456.1234).success).toBe(false);
					expect(schema.safeParse("123456").success).toBe(false);
					expect(schema.safeParse("123456.1234").success).toBe(false);
				});
			});

			describe("constrained with precision and scale", () => {
				test("parses on digit count before decimal less than precision", () => {
					const column = pgNumeric(5, 2);
					const schema = column.zodSchema();
					expect(schema.safeParse(1234.1).success).toBe(true);
					expect(schema.safeParse(1234).success).toBe(true);
					expect(schema.safeParse("1234.1").success).toBe(true);
					expect(schema.safeParse("1234").success).toBe(true);
				});

				test("parses on digit count before decimal equal to precision", () => {
					const column = pgNumeric(5, 4);
					const schema = column.zodSchema();
					expect(schema.safeParse(12345).success).toBe(true);
					expect(schema.safeParse(12345.1234).success).toBe(true);
					expect(schema.safeParse("12345").success).toBe(true);
					expect(schema.safeParse("12345.1234").success).toBe(true);
				});

				test("does not parse on digit count before decimal greater than precision", () => {
					const column = pgNumeric(5, 2);
					const schema = column.zodSchema();
					expect(schema.safeParse(123456).success).toBe(false);
					expect(schema.safeParse(123456.1234).success).toBe(false);
					expect(schema.safeParse("123456").success).toBe(false);
					expect(schema.safeParse("123456.1234").success).toBe(false);
				});

				test("parses on decimal count less than scale", () => {
					const column = pgNumeric(5, 4);
					const schema = column.zodSchema();
					expect(schema.safeParse(1234.1).success).toBe(true);
					expect(schema.safeParse("1234.1").success).toBe(true);
				});

				test("parses on decimal count equal to scale", () => {
					const column = pgNumeric(5, 4);
					const schema = column.zodSchema();
					expect(schema.safeParse(1234.1234).success).toBe(true);
					expect(schema.safeParse("1234.1234").success).toBe(true);
				});

				test("does not parse decimal count grater than scale", () => {
					const column = pgNumeric(5, 4);
					const schema = column.zodSchema();
					expect(schema.safeParse(1234.12345).success).toBe(false);
					expect(schema.safeParse("1234.12345").success).toBe(false);
				});
			});
		});

		describe("as primary key", () => {
			test("input type is number, bigint, string", () => {
				const column = pgNumeric().primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const column = pgNumeric().primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgNumeric().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgNumeric().defaultTo(1).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(2).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgNumeric().notNull().primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgNumeric().notNull().defaultTo(1).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse(2).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgNumeric().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Required",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgNumeric().notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected bigint, number or string that can be converted to a number, received null",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a numeric", () => {
				const column = pgNumeric();
				const schema = column.zodSchema();
				const result = schema.safeParse("hello");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message:
								"Expected bigint, number or string that can be converted to a number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("numeric with greater precision", () => {
				const column = pgNumeric(4);
				const schema = column.zodSchema();
				const result = schema.safeParse(12345);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							message: "Precision of 4 exeeded.",
							path: [],
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("numeric with greater scale", () => {
				const column = pgNumeric(4, 3);
				const schema = column.zodSchema();
				const result = schema.safeParse(1234.1234);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							message: "Maximum scale 3 exeeded.",
							path: [],
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
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
		const columnInfo: ColumnInfo = Object.fromEntries(
			Object.entries(testEnum),
		).info;

		expect(columnInfo.dataType).toBe("myEnum");
	});

	test("enum values", () => {
		const testEnum = pgEnum("myEnum", ["one", "two", "three"]);
		const columnDef = Object.fromEntries(Object.entries(testEnum)) as {
			values: string[];
		};
		expect(columnDef.values).toStrictEqual(["one", "two", "three"]);
	});

	test("default info", () => {
		const testEnum = pgEnum("myEnum", ["one", "two", "three"]);
		const columnInfo: ColumnInfo = Object.fromEntries(
			Object.entries(testEnum),
		).info;

		expect(columnInfo).toStrictEqual({
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
		const columnInfo: ColumnInfo = Object.fromEntries(
			Object.entries(testEnum),
		).info;
		expect(columnInfo.isNullable).toBe(false);
	});

	test("defaultTo()", () => {
		const testEnum = pgEnum("myEnum", ["one", "two", "three"]).defaultTo("one");
		const columnInfo: ColumnInfo = Object.fromEntries(
			Object.entries(testEnum),
		).info;
		expect(columnInfo.defaultValue).toBe("'one'::myEnum");
	});

	test("renameFrom()", () => {
		const testEnum = pgEnum("myEnum", ["one", "two", "three"]).renameFrom(
			"old_name",
		);
		const columnInfo: ColumnInfo = Object.fromEntries(
			Object.entries(testEnum),
		).info;
		expect(columnInfo.renameFrom).toBe("old_name");
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null, or undefined", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]);
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null, or undefined", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]);
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const stringResult = schema.safeParse("user");
				expect(stringResult.success).toBe(true);
				if (stringResult.success) {
					expect(stringResult.data).toBe("user");
				}
				const nullResult = schema.safeParse(null);
				if (!nullResult.success) {
					console.dir(nullResult.error.errors, { depth: null });
				}
				expect(nullResult.success).toBe(true);
				if (nullResult.success) {
					expect(nullResult.data).toBe(null);
				}
			});

			test("input type is string with notNull", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]).notNull();
				const schema = column.zodSchema();
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
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

			test("parses undefined", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]);
				const schema = column.zodSchema();
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]).defaultTo(
					"user",
				);
				const schema = column.zodSchema();
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
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
			test("input type is string", () => {
				const column = pgEnum("role", [
					"user",
					"admin",
					"superuser",
				]).primaryKey();
				const schema = column.zodSchema();
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const column = pgEnum("role", [
					"user",
					"admin",
					"superuser",
				]).primaryKey();
				const schema = column.zodSchema();
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const column = pgEnum("role", [
					"user",
					"admin",
					"superuser",
				]).primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"])
					.defaultTo("user")
					.primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"])
					.notNull()
					.primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"])
					.notNull()
					.defaultTo("user")
					.primaryKey();
				const schema = column.zodSchema();
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]).notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(undefined);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Required",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]).notNull();
				const schema = column.zodSchema();
				const result = schema.safeParse(null);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Expected 'user' | 'admin' | 'superuser', received null",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not an enum", () => {
				const column = pgEnum("role", ["user", "admin", "superuser"]);
				const schema = column.zodSchema();
				const result = schema.safeParse("hello");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_enum_value",
							path: [],
							message:
								"Invalid enum value. Expected 'user' | 'admin' | 'superuser', received 'hello'",
							options: ["user", "admin", "superuser"],
							received: "hello",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
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
