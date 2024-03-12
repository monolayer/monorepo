/* eslint-disable max-lines */
import { sql } from "kysely";
import { Equal, Expect } from "type-testing";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { z } from "zod";
import { enumType, enumerated } from "~/schema/pg_enumerated.js";
import { primaryKey } from "~/schema/pg_primary_key.js";
import { table } from "~/schema/pg_table.js";
import { zodSchema } from "~/zod/zod_schema.js";
import {
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
	PgEnum,
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
	pgEnum,
	real,
	serial,
	text,
	time,
	timestamp,
	timestamptz,
	timetz,
	uuid,
	varchar,
	type Boolish,
} from "../../src/schema/pg_column.js";

type ColumnContext = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	column: PgColumnBase<any, any, any>;
	columnInfo: ColumnInfo;
};

type ColumnWithoutDefaultContext = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

describe("PgGeneratedColumn", () => {
	beforeEach((context: ColumnWithoutDefaultContext) => {
		class TestSerial extends PgGeneratedColumn<string, number | string> {
			constructor() {
				super("serial", DefaultValueDataTypes.serial);
			}
		}
		context.column = new TestSerial();
		context.columnInfo = Object.fromEntries(
			Object.entries(context.column),
		).info;
	});

	testBase("serial");

	test("does not have default", (context: ColumnWithoutDefaultContext) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(typeof (context.column as any).default === "function").toBe(false);
	});

	test("does not have notNull", (context: ColumnWithoutDefaultContext) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(typeof (context.column as any).notNull === "function").toBe(false);
	});

	test("does not have generatedAlwaysAsIdentity", (context: ColumnWithoutDefaultContext) => {
		expect(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			typeof (context.column as any).generatedAlwaysAsIdentity === "function",
		).toBe(false);
	});

	test("does not have generatedByDefaultAsIdentity", (context: ColumnWithoutDefaultContext) => {
		expect(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			typeof (context.column as any).generatedByDefaultAsIdentity ===
				"function",
		).toBe(false);
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

		test("default with column data type", () => {
			const column = boolean();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(true);
			expect(info.defaultValue).toBe("true");

			column.default(false);
			expect(info.defaultValue).toBe("false");

			column.default("true");
			expect(info.defaultValue).toBe("true");

			column.default("false");
			expect(info.defaultValue).toBe("false");

			column.default("yes");
			expect(info.defaultValue).toBe("yes");

			column.default("no");
			expect(info.defaultValue).toBe("no");

			column.default("on");
			expect(info.defaultValue).toBe("on");

			column.default("off");
			expect(info.defaultValue).toBe("off");

			column.default("1");
			expect(info.defaultValue).toBe("1");

			column.default("0");
			expect(info.defaultValue).toBe("0");

			column.default(1);
			expect(info.defaultValue).toBe("1");

			column.default(0);
			expect(info.defaultValue).toBe("0");

			const expression = sql`true`;
			column.default(expression);
			expect(info.defaultValue).toBe(expression);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = boolean() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = boolean() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});

		describe("Zod", () => {
			describe("by default", () => {
				test("input type is boolean, Boolish, null or undefined", () => {
					const tbl = table({
						columns: {
							id: boolean(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					type InpuType = z.input<typeof schema>;
					type Expected = boolean | Boolish | null | undefined;
					const isEqual: Expect<Equal<InpuType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("output type is boolean, null or undefined", () => {
					const tb = table({
						columns: {
							id: boolean(),
						},
					});
					const schema = zodSchema(tb).shape.id;
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
					const tbl = table({
						columns: {
							id: boolean().notNull(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					type InputType = z.input<typeof schema>;
					type Expected = boolean | Boolish;
					const isEqual: Expect<Equal<InputType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("output type is boolean with notNull", () => {
					const tbl = table({
						columns: {
							id: boolean().notNull(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					type OutputType = z.output<typeof schema>;
					type Expected = boolean;
					const isEqual: Expect<Equal<OutputType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("parses boolean", () => {
					const tbl = table({
						columns: {
							id: boolean(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					const result = schema.safeParse(true);
					expect(result.success).toBe(true);
					if (result.success) {
						expect(result.data).toBe(true);
					}
				});

				test("parses null", () => {
					const tbl = table({
						columns: {
							id: boolean(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					const result = schema.safeParse(null);
					expect(result.success).toBe(true);
					if (result.success) {
						expect(result.data).toBe(null);
					}
				});

				test("parses undefined", () => {
					const tbl = table({
						columns: {
							id: boolean(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(undefined).success).toBe(true);
				});

				test("parses with coercion with boolish values", () => {
					const column = boolean();
					const tbl = table({
						columns: {
							true: column,
							false: column,
							yes: column,
							no: column,
							one: column,
							zero: column,
							oneString: column,
							zeroString: column,
							on: column,
							off: column,
						},
					});
					const schema = zodSchema(tbl);
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
					const tbl = table({
						columns: {
							id: boolean(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse("TRUE").success).toBe(false);
					expect(schema.safeParse("FALSE").success).toBe(false);
					expect(schema.safeParse("undefined").success).toBe(false);
					expect(schema.safeParse("null").success).toBe(false);
					expect(schema.safeParse(2).success).toBe(false);
				});

				test("with default value is nullable and optional", () => {
					const tbl = table({
						columns: {
							id: boolean().default(true),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(true);
					expect(schema.safeParse(undefined).success).toBe(true);
				});

				test("with notNull is non nullable and required", () => {
					const tbl = table({
						columns: {
							id: boolean().notNull(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with default and notNull is non nullable", () => {
					const tbl = table({
						columns: {
							id: boolean().notNull().default(true),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});
			});

			describe("as primary key", () => {
				test("input type is boolean, Boolish", () => {
					const tbl = table({
						columns: {
							id: boolean(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					type InpuType = z.input<typeof schema>;
					type Expected = boolean | Boolish;
					const isEqual: Expect<Equal<InpuType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("input type is boolean", () => {
					const tbl = table({
						columns: {
							id: boolean(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					type OutputType = z.output<typeof schema>;
					type Expected = boolean;
					const isEqual: Expect<Equal<OutputType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("is non nullable and required", () => {
					const tbl = table({
						columns: {
							id: boolean(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with default value is non nullable", () => {
					const tbl = table({
						columns: {
							id: boolean().default(true),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with notNull is non nullable and required", () => {
					const tbl = table({
						columns: {
							id: boolean().notNull(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with default and notNull is non nullable", () => {
					const tbl = table({
						columns: {
							id: boolean().notNull().default(true),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});
			});

			describe("errors", () => {
				test("undefined", () => {
					const tbl = table({
						columns: {
							id: boolean().notNull(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
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
					const tbl = table({
						columns: {
							id: boolean().notNull(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
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
					const tbl = table({
						columns: {
							id: boolean(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
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

		test("default with column data type", () => {
			const column = text();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("foo");
			expect(info.defaultValue).toBe("'foo'::text");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = text() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = text() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: text(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: text(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: text().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: text().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: text(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: text(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: text(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("does not parse other types", () => {
				const tbl = table({
					columns: {
						id: text(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: text().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: text().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: text().notNull().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string with primary key", () => {
				const tbl = table({
					columns: {
						id: text(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: text(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: text(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: text().default("hello"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: text().notNull().default("hello"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: text().default("2").notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: text().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: text().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: text(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

		test("default with column data type", () => {
			const column = bigint();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(12234433444444455n);
			expect(info.defaultValue).toBe("'12234433444444455'::bigint");

			column.default(12);
			expect(info.defaultValue).toBe("'12'::bigint");

			column.default("12");
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
			test("input type is bigint, number, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: bigint().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: bigint().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: bigint().generatedAlwaysAsIdentity(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("input type is bigint, number, string, or undefined with generatedByDefaultAsIdentity", () => {
				const tbl = table({
					columns: {
						id: bigint().generatedByDefaultAsIdentity(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: bigint().generatedByDefaultAsIdentity(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses string", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("does not parse floats", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("fails on invalid string", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("fails on empty string", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("").success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: bigint().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("minimumValue is -9223372036854775808n", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(-9223372036854775808n).success).toBe(true);
				expect(schema.safeParse("-9223372036854775808").success).toBe(true);
				expect(schema.safeParse(-9223372036854775809n).success).toBe(false);
				expect(schema.safeParse("-9223372036854775809").success).toBe(false);
			});

			test("maximumValue is 9223372036854775807n", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(9223372036854775807n).success).toBe(true);
				expect(schema.safeParse("9223372036854775807").success).toBe(true);
				expect(schema.safeParse(9223372036854775808n).success).toBe(false);
				expect(schema.safeParse("9223372036854775808").success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: bigint().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: bigint().notNull().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is bigint, number, string", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: bigint().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: bigint().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: bigint().notNull().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: bigint().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

			test("empty string", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse("");
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

			test("null", () => {
				const tbl = table({
					columns: {
						id: bigint().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bigserial() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bigserial() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		test("has never type", () => {
			const tbl = table({
				columns: {
					id: bigserial(),
				},
			});
			const schema = zodSchema(tbl).shape.id;

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

		test("default with column data type", () => {
			const column = bytea();
			const info = Object.fromEntries(Object.entries(column)).info;

			const buffer = Buffer.from("hello");
			column.default(buffer);
			expect(info.defaultValue).toBe("'\\x68656c6c6f'::bytea");

			column.default("12");
			expect(info.defaultValue).toBe("'\\x3132'::bytea");

			const expression = sql`\\x7b2261223a312c2262223a327d'::bytea`;
			column.default(expression);
			expect(info.defaultValue).toBe(expression);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bytea() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bytea() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is Buffer, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: bytea(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = Buffer | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Buffer, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: bytea(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: bytea().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Buffer | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Buffer or string with notNull", () => {
				const tbl = table({
					columns: {
						id: bytea().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: bytea(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(Buffer.from("hello")).success).toBe(true);
			});

			test("parses strings", () => {
				const tbl = table({
					columns: {
						id: bytea(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: bytea(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse other objects", () => {
				const tbl = table({
					columns: {
						id: bytea(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(false);
				expect(schema.safeParse(10.123).success).toBe(false);
				expect(schema.safeParse(true).success).toBe(false);
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse({ a: 1 }).success).toBe(false);
				expect(schema.safeParse(Date).success).toBe(false);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: bytea(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable, and optional", () => {
				const tbl = table({
					columns: {
						id: bytea().default(Buffer.from("1")),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: bytea().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: bytea().notNull().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is Buffer or string", () => {
				const tbl = table({
					columns: {
						id: bytea(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = Buffer | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Buffer or string", () => {
				const tbl = table({
					columns: {
						id: bytea(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = Buffer | string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: bytea(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: bytea().default("1"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: bytea().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: bytea().notNull().default("1"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: bytea().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: bytea().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: bytea(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

		test("default with column data type", () => {
			const column = date();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(new Date(1));
			expect(info.defaultValue).toBe("'1970-01-01'::date");

			column.default(new Date(1).toISOString());
			expect(info.defaultValue).toBe("'1970-01-01'::date");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = date() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = date() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is Date, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: date(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: date(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: date().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Date | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date with notNull", () => {
				const tbl = table({
					columns: {
						id: date().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: date(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
			});

			test("parses strings that can be coerced into dates", () => {
				const tbl = table({
					columns: {
						id: date(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date().toISOString()).success).toBe(true);
				expect(schema.safeParse("not a date").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: date(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: date(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: date().default(new Date()),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: date().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: date().notNull().default(new Date()),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is Date, string", () => {
				const tbl = table({
					columns: {
						id: date(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date", () => {
				const tbl = table({
					columns: {
						id: date(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = Date;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: date(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: date().default(new Date()),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: date().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: date().notNull().default(new Date()),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: date().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: date().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: date(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

		test("default with column data type", () => {
			const column = doublePrecision();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(10);
			expect(info.defaultValue).toBe("'10'::double precision");

			column.default("10");
			expect(info.defaultValue).toBe("'10'::double precision");

			column.default(102n);
			expect(info.defaultValue).toBe("'102'::double precision");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = doublePrecision() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = doublePrecision() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, bigint, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: doublePrecision().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = bigint | number | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: doublePrecision().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses string that can be parsed as a float but not as a bigint", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("0.00000").success).toBe(true);
			});

			test("parses NaN, Infinity, and -Infinity strings", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("NaN").success).toBe(true);
				expect(schema.safeParse("Infinity").success).toBe(true);
				expect(schema.safeParse("-Infinity").success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("fails on empty string", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("").success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: doublePrecision().default(30),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: doublePrecision().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: doublePrecision().notNull().default(1.1),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -1e308", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(-tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(-elevenCentillionBitInt).success).toBe(false);
			});

			test("maximum is 1e308", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(elevenCentillionBitInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is number, bigint, string", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: doublePrecision().default(1.1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: doublePrecision().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: doublePrecision().notNull().default(2.1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: doublePrecision().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

			test("empty string", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse("");
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

			test("null", () => {
				const tbl = table({
					columns: {
						id: doublePrecision().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse(-elevenCentillionBitInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							message:
								"Value must be between -1e+308 and 1e+308, NaN, Infinity, or -Infinity",
							path: [],
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("greater than maximum", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse(elevenCentillionBitInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							message:
								"Value must be between -1e+308 and 1e+308, NaN, Infinity, or -Infinity",
							path: [],
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

		test("default with column data type", () => {
			const column = float4();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(10.4);
			expect(info.defaultValue).toBe("'10.4'::real");

			column.default("10.4");
			expect(info.defaultValue).toBe("'10.4'::real");

			column.default(102n);
			expect(info.defaultValue).toBe("'102'::real");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = float4() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = float4() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, bigint, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: float4().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number with notNull", () => {
				const tbl = table({
					columns: {
						id: float4().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses string that can be parsed as a float but not as a bigint", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("0.00000").success).toBe(true);
			});

			test("does parses NaN, Infinity, and -Infinity strings", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("NaN").success).toBe(true);
				expect(schema.safeParse("Infinity").success).toBe(true);
				expect(schema.safeParse("-Infinity").success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("fails on empty string", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("").success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: float4().default(30),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: float4().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: float4().notNull().default(1.1),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -1e37", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(-tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(-eleventUnDecillionBigInt).success).toBe(false);
			});

			test("maximum is 1e37", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(eleventUnDecillionBigInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is number, bigint, string", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: float4().default(1.1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: float4().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: float4().notNull().default(2.1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: float4().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

			test("empty string", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse("");
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

			test("null", () => {
				const tbl = table({
					columns: {
						id: float4().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse(-eleventUnDecillionBigInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							message:
								"Value must be between -1e+37 and 1e+37, NaN, Infinity, or -Infinity",
							path: [],
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("greater than maximum", () => {
				const tbl = table({
					columns: {
						id: float4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse(eleventUnDecillionBigInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							message:
								"Value must be between -1e+37 and 1e+37, NaN, Infinity, or -Infinity",
							path: [],
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

		test("default with column data type", () => {
			const column = float8();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(10.4);
			expect(info.defaultValue).toBe("'10.4'::double precision");

			column.default("10.4");
			expect(info.defaultValue).toBe("'10.4'::double precision");

			column.default(102n);
			expect(info.defaultValue).toBe("'102'::double precision");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = float8() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = float8() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, bigint, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: float8().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number with notNull", () => {
				const tbl = table({
					columns: {
						id: float8().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("passes on strings that can be parsed as a float but not as a bigint", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("0.00000").success).toBe(true);
			});

			test("parses NaN, Infinity, and -Infinity strings", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("NaN").success).toBe(true);
				expect(schema.safeParse("Infinity").success).toBe(true);
				expect(schema.safeParse("-Infinity").success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("fails on empty string", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("").success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: float8().default(30),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: float8().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: float8().notNull().default(1.1),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -1e308", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(-tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(-elevenCentillionBitInt).success).toBe(false);
			});

			test("maximum is 1e308", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(elevenCentillionBitInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is number, bigint, string", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: float8().default(1.1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: float8().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: float8().notNull().default(2.1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: float8().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

			test("empty string", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse("");
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

			test("null", () => {
				const tbl = table({
					columns: {
						id: float8().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse(-elevenCentillionBitInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							message:
								"Value must be between -1e+308 and 1e+308, NaN, Infinity, or -Infinity",
							path: [],
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("greater than maximum", () => {
				const tbl = table({
					columns: {
						id: float8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse(elevenCentillionBitInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							message:
								"Value must be between -1e+308 and 1e+308, NaN, Infinity, or -Infinity",
							path: [],
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

		test("default with column data type", () => {
			const column = int2();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(10);
			expect(info.defaultValue).toBe("'10'::smallint");

			column.default("10");
			expect(info.defaultValue).toBe("'10'::smallint");
		});

		test("has have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = int2() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = int2() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: int2(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: int2(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int2().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number with notNull", () => {
				const tbl = table({
					columns: {
						id: int2().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int2().generatedAlwaysAsIdentity(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("output type is number with generatedByDefaultAsIdentity", () => {
				const tbl = table({
					columns: {
						id: int2().generatedByDefaultAsIdentity(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int2(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("does not parse decimals", () => {
				const tbl = table({
					columns: {
						id: int2(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("does not parse bigint", () => {
				const tbl = table({
					columns: {
						id: int2(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(false);
			});

			test("parses strings that can be coerced to number", () => {
				const tbl = table({
					columns: {
						id: int2(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: int2(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: int2(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: int2().default(30),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: int2().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: int2().notNull().default(11),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -32768", () => {
				const tbl = table({
					columns: {
						id: int2(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(-32768).success).toBe(true);
				expect(schema.safeParse(-32769).success).toBe(false);
			});

			test("maximum is 32767", () => {
				const tbl = table({
					columns: {
						id: int2(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(32767).success).toBe(true);
				expect(schema.safeParse(32768).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is number, string", () => {
				const tbl = table({
					columns: {
						id: int2(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const tbl = table({
					columns: {
						id: int2(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: int2(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: int2().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: int2().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: int2().notNull().default(40),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});
	});

	describe("errors", () => {
		test("undefined", () => {
			const tbl = table({
				columns: {
					id: int2().notNull(),
				},
			});
			const schema = zodSchema(tbl).shape.id;

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
			const tbl = table({
				columns: {
					id: int2().notNull(),
				},
			});
			const schema = zodSchema(tbl).shape.id;

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
			const tbl = table({
				columns: {
					id: int2(),
				},
			});
			const schema = zodSchema(tbl).shape.id;

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
			const tbl = table({
				columns: {
					id: int2(),
				},
			});
			const schema = zodSchema(tbl).shape.id;

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
			const tbl = table({
				columns: {
					id: int2(),
				},
			});
			const schema = zodSchema(tbl).shape.id;

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
			const tbl = table({
				columns: {
					id: int2(),
				},
			});
			const schema = zodSchema(tbl).shape.id;

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

		test("default with column data type", () => {
			const column = int4();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(10);
			expect(info.defaultValue).toBe("10");

			column.default("10");
			expect(info.defaultValue).toBe("10");

			const expression = sql`20`;
			column.default(expression);
			expect(info.defaultValue).toBe(expression);
		});

		test("has generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = int4() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("has generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = int4() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: int4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: int4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int4().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number with notNull", () => {
				const tbl = table({
					columns: {
						id: int4().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int4().generatedAlwaysAsIdentity(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("output type is number with generatedByDefaultAsIdentity", () => {
				const tbl = table({
					columns: {
						id: int4().generatedByDefaultAsIdentity(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("does not parse decimals", () => {
				const tbl = table({
					columns: {
						id: int4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("does not parse bigint", () => {
				const tbl = table({
					columns: {
						id: int4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(false);
			});

			test("parses strings that can be coerced to number", () => {
				const tbl = table({
					columns: {
						id: int4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: int4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: int4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: int4().default(30),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: int4().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: int4().notNull().default(1.1),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -2147483648", () => {
				const tbl = table({
					columns: {
						id: int4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(-2147483648).success).toBe(true);
				expect(schema.safeParse(-2147483649).success).toBe(false);
			});

			test("maximum is 2147483647", () => {
				const tbl = table({
					columns: {
						id: int4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(2147483647).success).toBe(true);
				expect(schema.safeParse(2147483648).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is number, string", () => {
				const tbl = table({
					columns: {
						id: int4(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const tbl = table({
					columns: {
						id: int4(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: int4(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: int4().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: int4().notNull().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: int4().default(1).notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: int4().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int4().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int4(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

		test("default with column data type", () => {
			const column = int8();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(10);
			expect(info.defaultValue).toBe("'10'::bigint");

			column.default(100n);
			expect(info.defaultValue).toBe("'100'::bigint");

			column.default("10");
			expect(info.defaultValue).toBe("'10'::bigint");
		});

		test("has generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = int8() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("has generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = int8() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is bigint, number, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: int8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: int8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int8().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is bigint, number, or string with notNull", () => {
				const tbl = table({
					columns: {
						id: int8().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int8().generatedAlwaysAsIdentity(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("output type is number with generatedByDefaultAsIdentity", () => {
				const tbl = table({
					columns: {
						id: int8().generatedByDefaultAsIdentity(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const tbl = table({
					columns: {
						id: int8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses string", () => {
				const tbl = table({
					columns: {
						id: int8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: int8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: int8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("does not parse floats", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("fails on invalid string", () => {
				const tbl = table({
					columns: {
						id: int8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("fails on empty string", () => {
				const tbl = table({
					columns: {
						id: int8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("").success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: int8().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("minimumValue is -9223372036854775808n", () => {
				const tbl = table({
					columns: {
						id: int8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(-9223372036854775808n).success).toBe(true);
				expect(schema.safeParse("-9223372036854775808").success).toBe(true);
				expect(schema.safeParse(-9223372036854775809n).success).toBe(false);
				expect(schema.safeParse("-9223372036854775809").success).toBe(false);
			});

			test("maximumValue is 9223372036854775807n", () => {
				const tbl = table({
					columns: {
						id: int8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(9223372036854775807n).success).toBe(true);
				expect(schema.safeParse("9223372036854775807").success).toBe(true);
				expect(schema.safeParse(9223372036854775808n).success).toBe(false);
				expect(schema.safeParse("9223372036854775808").success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: int8().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: int8().notNull().default(1),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is bigint, number, string", () => {
				const tbl = table({
					columns: {
						id: int8(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const tbl = table({
					columns: {
						id: int8(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: int8(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: int8().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: int8().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: int8().notNull().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: int8().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

			test("empty string", () => {
				const tbl = table({
					columns: {
						id: int8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse("");
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

			test("null", () => {
				const tbl = table({
					columns: {
						id: int8().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: int8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

		test("default with column data type", () => {
			const column = integer();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(10);
			expect(info.defaultValue).toBe("10");

			column.default("10");
			expect(info.defaultValue).toBe("10");

			const expression = sql`20`;
			column.default(expression);
			expect(info.defaultValue).toBe(expression);
		});

		test("has generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = integer() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("has generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = integer() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				true,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number with notNull", () => {
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: integer().generatedAlwaysAsIdentity(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type SchemaType = typeof schema;
				type Expected = z.ZodType<never, z.ZodTypeDef, never>;
				const isEqual: Expect<Equal<SchemaType, Expected>> = true;
				expect(isEqual).toBe(true);

				const result = schema.safeParse(1);
				expect(result.success).toBe(false);
			});

			test("output type is number with generatedByDefaultAsIdentity", () => {
				const tbl = table({
					columns: {
						id: integer().generatedByDefaultAsIdentity(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("does not parse decimals", () => {
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("does not parse bigint", () => {
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(false);
			});

			test("parses strings that can be coerced to number", () => {
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: integer().default(30),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: integer().notNull().default(1.1),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -2147483648", () => {
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(-2147483648).success).toBe(true);
				expect(schema.safeParse(-2147483649).success).toBe(false);
			});

			test("maximum is 2147483647", () => {
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(2147483647).success).toBe(true);
				expect(schema.safeParse(2147483648).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is number or string", () => {
				const tbl = table({
					columns: {
						id: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const tbl = table({
					columns: {
						id: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: integer(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: integer().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: integer().notNull().default(40),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: integer().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

		test("default with column data type", () => {
			const column = json();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("'10'::json");

			column.default('{ "foo": "bar" }');
			expect(info.defaultValue).toBe('\'{ "foo": "bar" }\'::json');
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = json() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = json() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, number, boolean, Record<string, any>, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: json(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected =
					| string
					| number
					| boolean
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					| Record<string, any>
					| null
					| undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, number, boolean, Record<string, any>, null or undefined", () => {
				const tbl = table({
					columns: {
						id: json(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected =
					| string
					| number
					| boolean
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
				const tbl = table({
					columns: {
						id: json().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				type Expected = string | number | boolean | Record<string, any>;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, number, boolean, Record<string, any> with notNull", () => {
				const tbl = table({
					columns: {
						id: json().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
				const tbl = table({
					columns: {
						id: json(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("12").success).toBe(true);
				expect(schema.safeParse('{"foo": "bar"}').success).toBe(true);
				expect(schema.safeParse('{"foo"}').success).toBe(false);
				expect(schema.safeParse("foo").success).toBe(false);
			});

			test("parses numbers", () => {
				const tbl = table({
					columns: {
						id: json(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(10.123).success).toBe(true);
			});

			test("parses boolean", () => {
				const tbl = table({
					columns: {
						id: json(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(true).success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: json(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses objects", () => {
				const tbl = table({
					columns: {
						id: json(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse({ a: 1 }).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: json(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: json().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse({ a: 1 }).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: json().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: json().notNull().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string, number, boolean, or Record<string, any>", () => {
				const tbl = table({
					columns: {
						id: json(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				type Expected = string | number | boolean | Record<string, any>;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is JsonArray, JsonObject, or JsonPrimitive", () => {
				const tbl = table({
					columns: {
						id: json(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				type Expected = string | number | boolean | Record<string, any>;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: json(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: json().default("1"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: json().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: json().notNull().default("1"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: json().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: json().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: json(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

		test("default with column data type", () => {
			const column = jsonb();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("'10'::jsonb");

			column.default('{ "foo": "bar" }');
			expect(info.defaultValue).toBe('\'{ "foo": "bar" }\'::jsonb');
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = jsonb() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = jsonb() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, number, boolean, Record<string, any>, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: jsonb(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected =
					| string
					| number
					| boolean
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					| Record<string, any>
					| null
					| undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, number, boolean, Record<string, any>, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: jsonb(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected =
					| string
					| number
					| boolean
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
				const tbl = table({
					columns: {
						id: jsonb().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				type Expected = string | number | boolean | Record<string, any>;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, number, boolean, Record<string, any> with notNull", () => {
				const tbl = table({
					columns: {
						id: jsonb().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
				const tbl = table({
					columns: {
						id: jsonb(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("12").success).toBe(true);
				expect(schema.safeParse('{"foo": "bar"}').success).toBe(true);
				expect(schema.safeParse('{"foo"}').success).toBe(false);
				expect(schema.safeParse("foo").success).toBe(false);
			});

			test("parses numbers", () => {
				const tbl = table({
					columns: {
						id: jsonb(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(10.123).success).toBe(true);
			});

			test("parses boolean", () => {
				const tbl = table({
					columns: {
						id: jsonb(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(true).success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: jsonb(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses objects", () => {
				const tbl = table({
					columns: {
						id: jsonb(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse({ a: 1 }).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: jsonb(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: jsonb().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse({ a: 1 }).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: jsonb().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: jsonb().notNull().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string, number, boolean, or Record<string, any>", () => {
				const tbl = table({
					columns: {
						id: jsonb(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				type Expected = string | number | boolean | Record<string, any>;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is JsonArray, JsonObject, JsonPrimitive", () => {
				const tbl = table({
					columns: {
						id: jsonb(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				type Expected = string | number | boolean | Record<string, any>;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: jsonb(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: jsonb().default("1"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: jsonb().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: jsonb().notNull().default("1"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: jsonb().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: jsonb().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: jsonb(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

		test("default with column data type", () => {
			const column = real();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("'10'::real");

			column.default(10);
			expect(info.defaultValue).toBe("'10'::real");

			column.default(100n);
			expect(info.defaultValue).toBe("'100'::real");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = real() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = real() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is bigint, number, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: real().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("passes on strings that can be parsed as a float but not as a bigint", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("0.00000").success).toBe(true);
			});

			test("parses NaN, Infinity, and -Infinity strings", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("NaN").success).toBe(true);
				expect(schema.safeParse("Infinity").success).toBe(true);
				expect(schema.safeParse("-Infinity").success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("fails on empty string", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("").success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: real().default(30),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: real().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: real().notNull().default(1.1),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("minimum is -1e37", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(-tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(-eleventUnDecillionBigInt).success).toBe(false);
			});

			test("maximum is 1e37", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(eleventUnDecillionBigInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is bigint, number, or string", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: real().default(2.2),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: real().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: real().notNull().default(2.2),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: real().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

			test("empty string", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse("");
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

			test("null", () => {
				const tbl = table({
					columns: {
						id: real().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse(-eleventUnDecillionBigInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							message:
								"Value must be between -1e+37 and 1e+37, NaN, Infinity, or -Infinity",
							path: [],
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("greater than maximum", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse(eleventUnDecillionBigInt);
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							message:
								"Value must be between -1e+37 and 1e+37, NaN, Infinity, or -Infinity",
							path: [],
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = serial() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = serial() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		test("has never type", () => {
			const tbl = table({
				columns: {
					id: serial(),
				},
			});
			const schema = zodSchema(tbl).shape.id;

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

		test("default with column data type", () => {
			const column = uuid();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11");
			expect(info.defaultValue).toBe(
				"'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid",
			);

			const expression = sql`'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid`;
			column.default(expression);
			expect(info.defaultValue).toBe(expression);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = uuid() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = uuid() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: uuid(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: uuid(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: uuid().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: uuid().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: uuid(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
			});

			test("does not parse other strings", () => {
				const tbl = table({
					columns: {
						id: uuid(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: uuid(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: uuid(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: uuid().default("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(
					schema.safeParse("B0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: uuid().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: uuid()
							.notNull()
							.default("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A12").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string", () => {
				const tbl = table({
					columns: {
						id: uuid(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: uuid(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: uuid(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: uuid().default("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A12").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: uuid().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: uuid()
							.notNull()
							.default("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A12").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			describe("errors", () => {
				test("undefined", () => {
					const tbl = table({
						columns: {
							id: uuid().notNull(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
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
					const tbl = table({
						columns: {
							id: uuid().notNull(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
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
					const tbl = table({
						columns: {
							id: uuid(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
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

		test("default with column data type", () => {
			const column = varchar();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("'10'::character varying");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = varchar() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

		test("default with column data type", () => {
			const column = varchar(100);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("'10'::character varying");
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: varchar(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: varchar(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: varchar().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: varchar().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: varchar(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
			});

			test("does not parse other objects", () => {
				const tbl = table({
					columns: {
						id: varchar(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(false);
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse({ foo: "bar" }).success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: varchar(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: varchar(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: varchar().default("hello"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: varchar().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: varchar().notNull().default("hello"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("without maximum length", () => {
				const tbl = table({
					columns: {
						id: varchar(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse("hello!").success).toBe(true);
			});

			test("with maximum length", () => {
				const tbl = table({
					columns: {
						id: varchar(5),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse("hello!").success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string", () => {
				const tbl = table({
					columns: {
						id: varchar(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: varchar(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: varchar(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: varchar().default("hello"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: varchar().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: varchar().notNull().default("hello"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: varchar().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: varchar().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: varchar(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: varchar(5),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

		test("default with column data type", () => {
			const column = char();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("'10'::character(1)");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = char() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

		test("default with column data type", () => {
			const column = char(200);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("'10'::character(1)");
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: char(10),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: char(10),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: char(10).notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: char(10).notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: char(5),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse("hello!").success).toBe(false);
			});

			test("does not parse other objects", () => {
				const tbl = table({
					columns: {
						id: char(5),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(false);
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse({ foo: "bar" }).success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: char(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: char(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: char(5).default("hello"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: char(5).notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: char(5).notNull().default("hello"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string", () => {
				const tbl = table({
					columns: {
						id: char(10),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or null", () => {
				const tbl = table({
					columns: {
						id: char(10),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: char(5),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: char(5).default("hello"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: char(5).notNull().default("hello"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: char(5).default("hello").notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: char().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: char().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: char(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: char(10),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
		class PgTimeTest extends PgTimeColumn<string, string> {
			constructor() {
				super("time", 1);
			}
		}
		const column = new PgTimeTest();
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
		const column = time();
		expect(column).toBeInstanceOf(PgTime);
	});

	describe("PgTime", () => {
		test("inherits from PgTimeColumn", () => {
			expect(time()).toBeInstanceOf(PgTimeColumn);
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

		test("default with column data type", () => {
			const column = time();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("04:05 AM");
			expect(info.defaultValue).toBe("'04:05 AM'::time without time zone");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = time() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

		test("default with column data type", () => {
			const column = time(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("04:05 AM");
			expect(info.defaultValue).toBe("'04:05 AM'::time without time zone");
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: time(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: time(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: time().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: time().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: time(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: time(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: time(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: time(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: time().default("11:30"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("01:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: time().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: time().notNull().default("11:30"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("02:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string", () => {
				const tbl = table({
					columns: {
						id: time(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: time(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: time(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: time().default("11:30"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: time().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: time().notNull().default("11:30"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: time().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: time().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: time(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: time(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
		const column = timetz();
		expect(column).toBeInstanceOf(PgTimeTz);
	});

	describe("PgTimeTz", () => {
		test("inherits from PgTimeColumn", () => {
			expect(timetz()).toBeInstanceOf(PgTimeColumn);
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

		test("default with column data type", () => {
			const column = timetz();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("04:05:06-08:00");
			expect(info.defaultValue).toBe("'04:05:06-08:00'::time with time zone");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = timetz() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

		test("default with column data type", () => {
			const column = timetz(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("04:05:06-08:00");
			expect(info.defaultValue).toBe("'04:05:06-08:00'::time with time zone");
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: timetz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: timetz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timetz().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: timetz().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timetz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timetz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: timetz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: timetz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: timetz().default("11:30"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("01:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timetz().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: timetz().notNull().default("11:30"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("02:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string", () => {
				const tbl = table({
					columns: {
						id: timetz(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: timetz(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timetz(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: timetz().default("11:30"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timetz().notNull().default("11:30"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: timetz().default("11:30").notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: timetz().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timetz().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timetz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timetz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
		const column = timestamp();
		expect(column).toBeInstanceOf(PgTimestamp);
	});

	describe("PgTimestamp", () => {
		test("inherits from PgColumnWithPrecision", () => {
			expect(timestamp()).toBeInstanceOf(PgTimestampColumn);
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

		test("default with column data type", () => {
			const column = timestamp();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(new Date(1));
			expect(info.defaultValue).toBe(
				"'1970-01-01T00:00:00.001Z'::timestamp without time zone",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = timestamp() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

		test("default with column data type", () => {
			const column = timestamp(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(new Date(1));
			expect(info.defaultValue).toBe(
				"'1970-01-01T00:00:00.001Z'::timestamp without time zone",
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is Date, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: timestamp(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: timestamp(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timestamp().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Date | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date with notNull", () => {
				const tbl = table({
					columns: {
						id: timestamp().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timestamp(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
			});

			test("parses strings that can be coerced into dates", () => {
				const tbl = table({
					columns: {
						id: timestamp(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date().toISOString()).success).toBe(true);
			});

			test("does not parse other strings", () => {
				const tbl = table({
					columns: {
						id: timestamp(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: timestamp(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: timestamp(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: timestamp().default(new Date()),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timestamp().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: timestamp().notNull().default(new Date()),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is Date, string", () => {
				const tbl = table({
					columns: {
						id: timestamp(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date", () => {
				const tbl = table({
					columns: {
						id: timestamp(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = Date;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timestamp(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: timestamp().default(new Date(2)),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timestamp().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: timestamp().default(new Date()).notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: timestamp().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timestamp().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timestamp(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timestamp(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
		const column = timestamptz();
		expect(column).toBeInstanceOf(PgTimestampTz);
	});

	describe("PgTimestampTz", () => {
		test("inherits from PgColumnWithPrecision", () => {
			expect(timestamptz()).toBeInstanceOf(PgColumn);
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

		test("default with column data type", () => {
			const column = timestamptz();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(new Date(1));
			expect(info.defaultValue).toBe(
				"'1970-01-01T00:00:00.001Z'::timestamp with time zone",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = timestamptz() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

		test("default with column data type", () => {
			const column = timestamptz(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(new Date(1));
			expect(info.defaultValue).toBe(
				"'1970-01-01T00:00:00.001Z'::timestamp with time zone",
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is Date, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: timestamptz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: timestamptz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timestamptz().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Date | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date with notNull", () => {
				const tbl = table({
					columns: {
						id: timestamptz().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timestamptz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
			});

			test("parses strings that can be coerced into dates", () => {
				const tbl = table({
					columns: {
						id: timestamptz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date().toISOString()).success).toBe(true);
			});

			test("does not parse other strings", () => {
				const tbl = table({
					columns: {
						id: timestamptz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: timestamptz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: timestamptz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: timestamptz().default(new Date()),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timestamptz().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: timestamptz().notNull().default(new Date()),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is Date, string", () => {
				const tbl = table({
					columns: {
						id: timestamptz(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date", () => {
				const tbl = table({
					columns: {
						id: timestamptz(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = Date;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timestamptz(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: timestamptz().default(new Date(2)),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timestamptz().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: timestamptz().default(new Date(2)).notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: timestamptz().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timestamptz().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timestamptz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: timestamptz(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

		test("default with column data type", () => {
			const column = numeric();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(1);
			expect(info.defaultValue).toBe("'1'::numeric");

			column.default("1");
			expect(info.defaultValue).toBe("'1'::numeric");

			column.default(1.1);
			expect(info.defaultValue).toBe("'1.1'::numeric");

			column.default("1.1");
			expect(info.defaultValue).toBe("'1.1'::numeric");

			column.default(100n);
			expect(info.defaultValue).toBe("'100'::numeric");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = numeric() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

		test("default with column data type", () => {
			const column = numeric(5);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(1);
			expect(info.defaultValue).toBe("'1'::numeric");

			column.default("1");
			expect(info.defaultValue).toBe("'1'::numeric");

			column.default(1.1);
			expect(info.defaultValue).toBe("'1.1'::numeric");

			column.default("1.1");
			expect(info.defaultValue).toBe("'1.1'::numeric");

			column.default(100n);
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

		test("default with column data type", () => {
			const column = numeric(5, 1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(1);
			expect(info.defaultValue).toBe("'1'::numeric");

			column.default("1");
			expect(info.defaultValue).toBe("'1'::numeric");

			column.default(1.1);
			expect(info.defaultValue).toBe("'1.1'::numeric");

			column.default("1.1");
			expect(info.defaultValue).toBe("'1.1'::numeric");

			column.default(100n);
			expect(info.defaultValue).toBe("'100'::numeric");
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is number, bigint, string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: numeric(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: numeric(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: numeric().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: numeric().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: numeric(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const tbl = table({
					columns: {
						id: numeric(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const tbl = table({
					columns: {
						id: numeric(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const tbl = table({
					columns: {
						id: numeric(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: numeric(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: numeric(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("fails on empty string", () => {
				const tbl = table({
					columns: {
						id: numeric(4, 5),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("").success).toBe(false);
			});

			test("parses string that can be parsed as a float but not as a bigint", () => {
				const tbl = table({
					columns: {
						id: numeric(4, 5),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("0.00000").success).toBe(true);
			});

			test("parses NaN, Infinity, and -Infinity strings", () => {
				const tbl = table({
					columns: {
						id: numeric(4, 5),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("NaN").success).toBe(true);
				expect(schema.safeParse("Infinity").success).toBe(true);
				expect(schema.safeParse("-Infinity").success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: numeric().default(2),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(2).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: numeric().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: numeric().notNull().default(1),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(2).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("unconstrained", () => {
				const tbl = table({
					columns: {
						id: numeric(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(123423442.1).success).toBe(true);
				expect(schema.safeParse(123423442.12345).success).toBe(true);
				expect(schema.safeParse(12342.123452323).success).toBe(true);
			});

			describe("constrained with precision", () => {
				test("parses on digit count before decimal less than precision", () => {
					const tbl = table({
						columns: {
							id: numeric(5),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(1234.1).success).toBe(true);
					expect(schema.safeParse(1234).success).toBe(true);
					expect(schema.safeParse("1234.1").success).toBe(true);
					expect(schema.safeParse("1234").success).toBe(true);
				});

				test("parses on digit count before decimal equal to precision", () => {
					const tbl = table({
						columns: {
							id: numeric(5),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(12345).success).toBe(true);
					expect(schema.safeParse(12345.1234).success).toBe(true);
					expect(schema.safeParse("12345").success).toBe(true);
					expect(schema.safeParse("12345.1234").success).toBe(true);
				});

				test("does not parse on digit count before decimal greater than precision", () => {
					const tbl = table({
						columns: {
							id: numeric(5),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(123456).success).toBe(false);
					expect(schema.safeParse(123456.1234).success).toBe(false);
					expect(schema.safeParse("123456").success).toBe(false);
					expect(schema.safeParse("123456.1234").success).toBe(false);
				});
			});

			describe("constrained with precision and scale", () => {
				test("parses on digit count before decimal less than precision", () => {
					const tbl = table({
						columns: {
							id: numeric(5, 2),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(1234.1).success).toBe(true);
					expect(schema.safeParse(1234).success).toBe(true);
					expect(schema.safeParse("1234.1").success).toBe(true);
					expect(schema.safeParse("1234").success).toBe(true);
				});

				test("parses on digit count before decimal equal to precision", () => {
					const tbl = table({
						columns: {
							id: numeric(5, 4),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(12345).success).toBe(true);
					expect(schema.safeParse(12345.1234).success).toBe(true);
					expect(schema.safeParse("12345").success).toBe(true);
					expect(schema.safeParse("12345.1234").success).toBe(true);
				});

				test("does not parse on digit count before decimal greater than precision", () => {
					const tbl = table({
						columns: {
							id: numeric(5, 2),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(123456).success).toBe(false);
					expect(schema.safeParse(123456.1234).success).toBe(false);
					expect(schema.safeParse("123456").success).toBe(false);
					expect(schema.safeParse("123456.1234").success).toBe(false);
				});

				test("parses on decimal count less than scale", () => {
					const tbl = table({
						columns: {
							id: numeric(5, 4),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(1234.1).success).toBe(true);
					expect(schema.safeParse("1234.1").success).toBe(true);
				});

				test("parses on decimal count equal to scale", () => {
					const tbl = table({
						columns: {
							id: numeric(5, 4),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(1234.1234).success).toBe(true);
					expect(schema.safeParse("1234.1234").success).toBe(true);
				});

				test("does not parse decimal count grater than scale", () => {
					const tbl = table({
						columns: {
							id: numeric(5, 4),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(1234.12345).success).toBe(false);
					expect(schema.safeParse("1234.12345").success).toBe(false);
				});
			});
		});

		describe("as primary key", () => {
			test("input type is number, bigint, string", () => {
				const tbl = table({
					columns: {
						id: numeric(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | bigint | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: numeric(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: numeric(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: numeric().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(2).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: numeric().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: numeric().notNull().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(2).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: numeric().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: numeric().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

			test("empty string", () => {
				const tbl = table({
					columns: {
						id: numeric(4, 5),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse("");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Invalid decimal",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a numeric", () => {
				const tbl = table({
					columns: {
						id: numeric(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: numeric(4),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: numeric(4, 3),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const column = pgEnum("myEnum", ["one", "two", "three"]) as any;
		expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(false);
	});

	test("does not have generatedByDefaultAsIdentity", () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

	test("default()", () => {
		const testEnum = pgEnum("myEnum", ["one", "two", "three"]).default("one");
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
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"])),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"])),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				expect(nullResult.success).toBe(true);
				if (nullResult.success) {
					expect(nullResult.data).toBe(null);
				}
			});

			test("input type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: enumerated(
							enumType("role", ["user", "admin", "superuser"]),
						).notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: enumerated(
							enumType("role", ["user", "admin", "superuser"]),
						).notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"])),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse("admin").success).toBe(true);
				expect(schema.safeParse("superuser").success).toBe(true);
			});

			test("does not parse other objects", () => {
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"])),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
				expect(schema.safeParse(10.123).success).toBe(false);
				expect(schema.safeParse(true).success).toBe(false);
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse({ a: 1 }).success).toBe(false);
				expect(schema.safeParse(Date).success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"])),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"])),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: enumerated(
							enumType("role", ["user", "admin", "superuser"]),
						).default("user"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: enumerated(
							enumType("role", ["user", "admin", "superuser"]),
						).notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"]))
							.notNull()
							.default("user"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string", () => {
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"])),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"])),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"])),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable", () => {
				const tbl = table({
					columns: {
						id: enumerated(
							enumType("role", ["user", "admin", "superuser"]),
						).default("user"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: enumerated(
							enumType("role", ["user", "admin", "superuser"]),
						).notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"]))
							.notNull()
							.default("user"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: enumerated(
							enumType("role", ["user", "admin", "superuser"]),
						).notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: enumerated(
							enumType("role", ["user", "admin", "superuser"]),
						).notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"])),
					},
				});
				const schema = zodSchema(tbl).shape.id;
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

function testColumnMethods() {
	test("renameFrom() sets renameFrom", (context: ColumnContext) => {
		context.column.renameFrom("old_name");
		expect(context.columnInfo.renameFrom).toBe("old_name");
	});
}
