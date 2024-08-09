/* eslint-disable max-lines */
import {
	columnWithType,
	pgColumnWithType,
} from "@monorepo/pg/schema/column/column-with-type.js";
import {
	PgColumn,
	PgColumnBase,
	SerialColumn,
} from "@monorepo/pg/schema/column/column.js";
import {
	PgBigInt,
	bigint,
} from "@monorepo/pg/schema/column/data-types/bigint.js";
import {
	PgBigSerial,
	bigserial,
} from "@monorepo/pg/schema/column/data-types/bigserial.js";
import {
	PgBitVarying,
	bitVarying,
	varbit,
} from "@monorepo/pg/schema/column/data-types/bit-varying.js";
import { PgBit, bit } from "@monorepo/pg/schema/column/data-types/bit.js";
import {
	PgBoolean,
	boolean,
	type Boolish,
} from "@monorepo/pg/schema/column/data-types/boolean.js";
import { PgBytea, bytea } from "@monorepo/pg/schema/column/data-types/bytea.js";
import {
	PgCharacterVarying,
	characterVarying,
	varchar,
} from "@monorepo/pg/schema/column/data-types/character-varying.js";
import {
	PgCharacter,
	char,
	character,
} from "@monorepo/pg/schema/column/data-types/character.js";
import { PgCIDR, cidr } from "@monorepo/pg/schema/column/data-types/cidr.js";
import { PgDate, date } from "@monorepo/pg/schema/column/data-types/date.js";
import {
	PgDoublePrecision,
	doublePrecision,
} from "@monorepo/pg/schema/column/data-types/double-precision.js";
import { enumType } from "@monorepo/pg/schema/column/data-types/enum.js";
import {
	PgEnum,
	enumerated,
} from "@monorepo/pg/schema/column/data-types/enumerated.js";
import { PgInet, inet } from "@monorepo/pg/schema/column/data-types/inet.js";
import {
	PgInteger,
	integer,
} from "@monorepo/pg/schema/column/data-types/integer.js";
import { PgJson, json } from "@monorepo/pg/schema/column/data-types/json.js";
import { PgJsonB, jsonb } from "@monorepo/pg/schema/column/data-types/jsonb.js";
import {
	PgMacaddr,
	macaddr,
} from "@monorepo/pg/schema/column/data-types/macaddr.js";
import {
	PgMacaddr8,
	macaddr8,
} from "@monorepo/pg/schema/column/data-types/macaddr8.js";
import {
	PgNumeric,
	numeric,
} from "@monorepo/pg/schema/column/data-types/numeric.js";
import { PgReal, real } from "@monorepo/pg/schema/column/data-types/real.js";
import {
	PgSerial,
	serial,
} from "@monorepo/pg/schema/column/data-types/serial.js";
import {
	PgSmallint,
	smallint,
} from "@monorepo/pg/schema/column/data-types/smallint.js";
import { PgText, text } from "@monorepo/pg/schema/column/data-types/text.js";
import {
	PgTimeWithTimeZone,
	timeWithTimeZone,
	timetz,
} from "@monorepo/pg/schema/column/data-types/time-with-time-zone.js";
import { PgTime, time } from "@monorepo/pg/schema/column/data-types/time.js";
import {
	PgTimestampWithTimeZone,
	timestampWithTimeZone,
	timestamptz,
} from "@monorepo/pg/schema/column/data-types/timestamp-with-time-zone.js";
import {
	PgTimestamp,
	timestamp,
} from "@monorepo/pg/schema/column/data-types/timestamp.js";
import {
	PgTsquery,
	tsquery,
} from "@monorepo/pg/schema/column/data-types/tsquery.js";
import {
	PgTsvector,
	tsvector,
} from "@monorepo/pg/schema/column/data-types/tsvector.js";
import { PgUuid, uuid } from "@monorepo/pg/schema/column/data-types/uuid.js";
import { PgXML, xml } from "@monorepo/pg/schema/column/data-types/xml.js";
import {
	ColumnInfo,
	type JsonValue,
} from "@monorepo/pg/schema/column/types.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { table } from "@monorepo/pg/schema/table.js";
import { zodSchema } from "@monorepo/pg/schema/zod/zod_schema.js";
import { sql } from "kysely";
import { Equal, Expect } from "type-testing";
import { beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

type ColumnContext = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	column: PgColumnBase<any, any, any>;
	columnInfo: ColumnInfo;
};

type ColumnWithoutDefaultContext = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	column: SerialColumn<any, any>;
	columnInfo: ColumnInfo;
};

const tenCentillionBitInt =
	100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000n;

const elevenCentillionBitInt =
	1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000n;

const tenUnDecillionBigInt = 10000000000000000000000000000000000000n;
const eleventUnDecillionBigInt = 100000000000000000000000000000000000000n;

describe("PgGeneratedColumn", () => {
	beforeEach((context: ColumnWithoutDefaultContext) => {
		class TestSerial extends SerialColumn<string, number | string> {
			constructor() {
				super("serial", "integer");
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
}

describe("boolean", () => {
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
			expect(info.defaultValue).toBe("b5bea41b:true");

			column.default(false);
			expect(info.defaultValue).toBe("fcbcf165:false");

			column.default("true");
			expect(info.defaultValue).toBe("b5bea41b:true");

			column.default("false");
			expect(info.defaultValue).toBe("fcbcf165:false");

			column.default("yes");
			expect(info.defaultValue).toBe("8a798890:yes");

			column.default("no");
			expect(info.defaultValue).toBe("9390298f:no");

			column.default("on");
			expect(info.defaultValue).toBe("b8d31e85:on");

			column.default("off");
			expect(info.defaultValue).toBe("b4dc66dd:off");

			column.default("1");
			expect(info.defaultValue).toBe("6b86b273:1");

			column.default("0");
			expect(info.defaultValue).toBe("5feceb66:0");

			column.default(1);
			expect(info.defaultValue).toBe("6b86b273:1");

			column.default(0);
			expect(info.defaultValue).toBe("5feceb66:0");

			const expression = sql`true`;
			column.default(expression);
			expect(info.defaultValue).toBe("b5bea41b:true");
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
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const schema = zodSchema(tbl).shape.id;
					type OutputType = z.output<typeof schema>;
					type Expected = boolean;
					const isEqual: Expect<Equal<OutputType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("input type is boolean, Boolish, and undefined with notNull and default", () => {
					const tbl = table({
						columns: {
							id: boolean().notNull().default(true),
						},
					});
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const schema = zodSchema(tbl).shape.id;
					type InputType = z.input<typeof schema>;
					type Expected = boolean | Boolish | undefined;
					const isEqual: Expect<Equal<InputType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("output type is boolean or undefined with notNull and default", () => {
					const tbl = table({
						columns: {
							id: boolean().notNull().default(true),
						},
					});
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const schema = zodSchema(tbl).shape.id;
					type OutputType = z.output<typeof schema>;
					type Expected = boolean | undefined;
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

				test("does not parse explicit undefined", () => {
					const tbl = table({
						columns: {
							id: boolean(),
						},
					});

					const schema = zodSchema(tbl).shape.id;
					expect(schema.safeParse(undefined).success).toBe(false);
					const tableSchema = zodSchema(tbl);
					expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
					expect(tableSchema.safeParse({}).success).toBe(true);
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
					type InputType = z.input<typeof schema>;
					type ExpectedInputType = boolean | Boolish | null | undefined;
					const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> =
						true;
					expect(isEqualInput).toBe(true);
					type OutputType = z.output<typeof schema>;
					type ExpectedOutputType = boolean | null | undefined;
					const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
						true;
					expect(isEqualOutput).toBe(true);

					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(true);
				});

				test("with notNull is non nullable and required", () => {
					const tbl = table({
						columns: {
							id: boolean().notNull(),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					type InputType = z.input<typeof schema>;
					type ExpectedInputType = boolean | Boolish;
					const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> =
						true;
					expect(isEqualInput).toBe(true);
					type OutputType = z.output<typeof schema>;
					type ExpectedOutputType = boolean;
					const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
						true;
					expect(isEqualOutput).toBe(true);
					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with default and notNull is non nullable and optional", () => {
					const tbl = table({
						columns: {
							id: boolean().notNull().default(true),
						},
					});
					const schema = zodSchema(tbl).shape.id;
					type InputType = z.input<typeof schema>;
					type ExpectedInputType = boolean | Boolish | undefined;
					const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> =
						true;
					expect(isEqualInput).toBe(true);
					type OutputType = z.output<typeof schema>;
					type ExpectedOutputType = boolean | undefined;
					const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
						true;
					expect(isEqualOutput).toBe(true);

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
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

					type InputType = z.input<typeof schema>;
					type ExpectedInputType = boolean | Boolish;
					const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> =
						true;
					expect(isEqualInput).toBe(true);
					type OutputType = z.output<typeof schema>;
					type ExpectedOutputType = boolean;
					const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
						true;
					expect(isEqualOutput).toBe(true);

					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with default value is non nullable and optional", () => {
					const tbl = table({
						columns: {
							id: boolean().default(true),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					const schema = zodSchema(tbl).shape.id;

					type InputType = z.input<typeof schema>;
					type ExpectedInputType = boolean | Boolish | undefined;
					const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> =
						true;
					expect(isEqualInput).toBe(true);

					type OutputType = z.output<typeof schema>;
					type ExpectedOutputType = boolean | undefined;
					const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
						true;
					expect(isEqualOutput).toBe(true);

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

					type InputType = z.input<typeof schema>;
					type ExpectedInputType = boolean | Boolish;
					const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> =
						true;
					expect(isEqualInput).toBe(true);
					type OutputType = z.output<typeof schema>;
					type ExpectedOutputType = boolean;
					const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
						true;
					expect(isEqualOutput).toBe(true);

					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with default and notNull is non nullable and optional", () => {
					const tbl = table({
						columns: {
							id: boolean().notNull().default(true),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					const schema = zodSchema(tbl).shape.id;

					type InputType = z.input<typeof schema>;
					type ExpectedInputType = boolean | Boolish | undefined;
					const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> =
						true;
					expect(isEqualInput).toBe(true);
					type OutputType = z.output<typeof schema>;
					type ExpectedOutputType = boolean | undefined;
					const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
						true;
					expect(isEqualOutput).toBe(true);

					expect(schema.safeParse(true).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});
			});

			describe("errors", () => {
				test("explicit undefined", () => {
					const tbl = table({
						columns: {
							id: boolean(),
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
								message: "Value cannot be undefined",
								fatal: true,
							},
						];
						expect(result.error.errors).toStrictEqual(expected);
					}

					const tableSchema = zodSchema(tbl);
					const tableResult = tableSchema.safeParse({ id: undefined });
					expect(tableResult.success).toBe(false);
					if (!tableResult.success) {
						const expected = [
							{
								code: "custom",
								path: ["id"],
								message: "Value cannot be undefined",
								fatal: true,
							},
						];
						expect(tableResult.error.errors).toStrictEqual(expected);
					}
				});

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

describe("text", () => {
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
			expect(info.defaultValue).toBe("ae72411e:'foo'::text");
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: text().notNull().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("one");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("one");
				}
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: text().notNull().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
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

			test("rejects explicit undefined", () => {
				const tbl = table({
					columns: {
						id: text(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: text().default("hello"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: text().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: text().default("2").notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: text(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
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

describe("bigint", () => {
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
			expect(info.defaultValue).toBe("731746a5:'12234433444444455'::bigint");

			column.default(12);
			expect(info.defaultValue).toBe("0f70dd7f:'12'::bigint");

			column.default("12");
			expect(info.defaultValue).toBe("0f70dd7f:'12'::bigint");
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

			test("input type is bigint, number, string, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: bigint().notNull().default(1),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = bigint | number | string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse(10n);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("10");
				}
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: bigint().notNull().default(1),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
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

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: bigint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: bigint().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: bigint().notNull().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as generated by default as identity", () => {
			test("input type is bigint, number, string | undefined", () => {
				const tbl = table({
					columns: {
						id: bigint().generatedByDefaultAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, or undefined", () => {
				const tbl = table({
					columns: {
						id: bigint().generatedByDefaultAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: bigint().generatedByDefaultAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: bigint().notNull().generatedByDefaultAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as generated always as identity", () => {
			test("input type is never", () => {
				const tbl = table({
					columns: {
						id: bigint().generatedAlwaysAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = never;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is never", () => {
				const tbl = table({
					columns: {
						id: bigint().generatedAlwaysAsIdentity(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = never;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: bigint(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
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

describe("bigserial", () => {
	test("returns a PgBigSerial instance", () => {
		const column = bigserial();
		expect(column).toBeInstanceOf(PgBigSerial);
	});

	describe("PgBigSerial", () => {
		test("inherits from PgColumnWithoutDefault", () => {
			expect(bigserial()).toBeInstanceOf(SerialColumn);
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
		describe("by default", () => {
			test("input type is bigint, number, string, or undefined", () => {
				const tbl = table({
					columns: {
						id: bigserial(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, or undefined", () => {
				const tbl = table({
					columns: {
						id: bigserial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const numberResult = schema.safeParse(1);
				expect(numberResult.success).toBe(true);
				if (numberResult.success) {
					expect(numberResult.data).toEqual("1");
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
						id: bigserial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const tbl = table({
					columns: {
						id: bigserial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses string", () => {
				const tbl = table({
					columns: {
						id: bigserial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
			});

			test("does not parse null", () => {
				const tbl = table({
					columns: {
						id: bigserial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(false);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: bigserial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
			});

			test("does not parse floats", () => {
				const tbl = table({
					columns: {
						id: bigserial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("fails on invalid string", () => {
				const tbl = table({
					columns: {
						id: bigserial(),
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
						id: bigserial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("").success).toBe(false);
			});

			test("minimumValue is -9223372036854775808n", () => {
				const tbl = table({
					columns: {
						id: bigserial(),
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
						id: bigserial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(9223372036854775807n).success).toBe(true);
				expect(schema.safeParse("9223372036854775807").success).toBe(true);
				expect(schema.safeParse(9223372036854775808n).success).toBe(false);
				expect(schema.safeParse("9223372036854775808").success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is bigint, number, string | undefined", () => {
				const tbl = table({
					columns: {
						id: bigserial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = bigint | number | string | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or undefined", () => {
				const tbl = table({
					columns: {
						id: bigserial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: bigserial(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: bigserial(),
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

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Required",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("empty string", () => {
				const tbl = table({
					columns: {
						id: bigserial(),
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
						id: bigserial(),
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
						id: bigserial(),
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

describe("bytea", () => {
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
			expect(info.defaultValue).toBe("65bd0120:'\\x68656c6c6f'::bytea");

			column.default("12");
			expect(info.defaultValue).toBe("f35f708d:'\\x3132'::bytea");

			const expression = sql`\\x7b2261223a312c2262223a327d'::bytea`;
			column.default(expression);
			expect(info.defaultValue).toBe(
				"4aa78882:\\x7b2261223a312c2262223a327d'::bytea",
			);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Buffer | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Buffer or string, or undefined with notNull with default", () => {
				const tbl = table({
					columns: {
						id: bytea().notNull().default(Buffer.from("1")),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = Buffer | string | undefined;
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

			test("input type is Buffer, string, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: bytea().notNull().default(Buffer.from("1")),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Buffer | string | undefined;
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

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: bytea(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | Buffer;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | Buffer;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: bytea().default("1"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | Buffer | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | Buffer | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | Buffer;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | Buffer;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: bytea().notNull().default("1"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | Buffer | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | Buffer | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: bytea(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
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

describe("date", () => {
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
			expect(info.defaultValue).toBe("dd41adb1:'1970-01-01'::date");

			column.default(new Date(1).toISOString());
			expect(info.defaultValue).toBe("dd41adb1:'1970-01-01'::date");
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

			test("input type is Date, string, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: date().notNull().default(new Date(1)),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Date | string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: date().notNull().default(new Date(1)),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = Date | undefined;
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

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: date(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
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

			test("does not parse dates before 4713 BC", () => {
				const tbl = table({
					columns: {
						id: date(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(
					schema.safeParse(new Date("-004713-12-31T23:59:59.999Z")).success,
				).toBe(true);
				expect(
					schema.safeParse(new Date("-004714-01-01T00:00:00.000Z")).success,
				).toBe(false);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | Date;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = Date;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: date().default(new Date()),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = Date | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = Date | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | Date;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = Date;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: date().notNull().default(new Date()),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = Date | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = Date | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: date(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
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

describe("doublePrecision", () => {
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
			expect(info.defaultValue).toBe("c4e1ae94:'10'::double precision");

			column.default("10");
			expect(info.defaultValue).toBe("c4e1ae94:'10'::double precision");

			column.default(102n);
			expect(info.defaultValue).toBe("0ae2ddfa:'102'::double precision");
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

			test("input type is number, bigint, or string with notNull", () => {
				const tbl = table({
					columns: {
						id: doublePrecision().notNull(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

			test("input type is number, bigint, string, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: doublePrecision().notNull().default(1.1),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = bigint | number | string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: doublePrecision().notNull().default(1.1),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
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

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: doublePrecision().default(1.1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: doublePrecision().notNull().default(2.1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: doublePrecision(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
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

describe("smallint", () => {
	test("returns a PgSmallint instance", () => {
		const column = smallint();
		expect(column).toBeInstanceOf(PgSmallint);
	});

	describe("PgSmallint", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(smallint()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to smallint", () => {
			const info = Object.fromEntries(Object.entries(smallint())).info;
			expect(info.dataType).toBe("smallint");
		});

		test("default with column data type", () => {
			const column = smallint();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(10);
			expect(info.defaultValue).toBe("235f517d:'10'::smallint");

			column.default("10");
			expect(info.defaultValue).toBe("235f517d:'10'::smallint");
		});

		test("has have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = smallint() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(true);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = smallint() as any;
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
						id: smallint(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: smallint(),
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
						id: smallint().notNull(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number with notNull", () => {
				const tbl = table({
					columns: {
						id: smallint().notNull(),
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

			test("input type is number, string, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: smallint().notNull().default(1),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = number | string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: smallint().notNull().default(1),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number | undefined;
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
						id: smallint().generatedAlwaysAsIdentity(),
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
						id: smallint().generatedByDefaultAsIdentity(),
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
						id: smallint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("does not parse decimals", () => {
				const tbl = table({
					columns: {
						id: smallint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("does not parse bigint", () => {
				const tbl = table({
					columns: {
						id: smallint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(false);
			});

			test("parses strings that can be coerced to number", () => {
				const tbl = table({
					columns: {
						id: smallint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: smallint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: smallint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: smallint().default(30),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: smallint().notNull(),
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
						id: smallint().notNull().default(11),
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
						id: smallint(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(-32768).success).toBe(true);
				expect(schema.safeParse(-32769).success).toBe(false);
			});

			test("maximum is 32767", () => {
				const tbl = table({
					columns: {
						id: smallint(),
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
						id: smallint(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number", () => {
				const tbl = table({
					columns: {
						id: smallint(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: smallint(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = number | string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = number;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: smallint().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = number | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = number | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: smallint().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = number | string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = number;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: smallint().notNull().default(40),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = number | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = number | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			describe("as generated by default as identity", () => {
				test("input type is number, string | undefined", () => {
					const tbl = table({
						columns: {
							id: smallint().generatedByDefaultAsIdentity(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const schema = zodSchema(tbl).shape.id;
					type InpuType = z.input<typeof schema>;
					type Expected = number | string | undefined;
					const isEqual: Expect<Equal<InpuType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("output type is number, or undefined", () => {
					const tbl = table({
						columns: {
							id: smallint().generatedByDefaultAsIdentity(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const schema = zodSchema(tbl).shape.id;
					type OutputType = z.output<typeof schema>;
					type Expected = number | undefined;
					const isEqual: Expect<Equal<OutputType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("is non nullable and optional", () => {
					const tbl = table({
						columns: {
							id: smallint().generatedByDefaultAsIdentity(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					const schema = zodSchema(tbl).shape.id;

					type InputType = z.input<typeof schema>;
					type ExpectedInputType = number | string | undefined;
					const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> =
						true;
					expect(isEqualInput).toBe(true);
					type OutputType = z.output<typeof schema>;
					type ExpectedOutputType = number | undefined;
					const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
						true;
					expect(isEqualOutput).toBe(true);

					expect(schema.safeParse(1).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with notNull is non nullable and optional", () => {
					const tbl = table({
						columns: {
							id: smallint().notNull().generatedByDefaultAsIdentity(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					const schema = zodSchema(tbl).shape.id;

					type InputType = z.input<typeof schema>;
					type ExpectedInputType = number | string | undefined;
					const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> =
						true;
					expect(isEqualInput).toBe(true);
					type OutputType = z.output<typeof schema>;
					type ExpectedOutputType = number | undefined;
					const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
						true;
					expect(isEqualOutput).toBe(true);

					expect(schema.safeParse(1).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});
			});

			describe("as generated always as identity", () => {
				test("input type is never", () => {
					const tbl = table({
						columns: {
							id: smallint().generatedAlwaysAsIdentity(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const schema = zodSchema(tbl).shape.id;
					type InpuType = z.input<typeof schema>;
					type Expected = never;
					const isEqual: Expect<Equal<InpuType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("output type is never", () => {
					const tbl = table({
						columns: {
							id: smallint().generatedAlwaysAsIdentity(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const schema = zodSchema(tbl).shape.id;
					type OutputType = z.output<typeof schema>;
					type Expected = never;
					const isEqual: Expect<Equal<OutputType, Expected>> = true;
					expect(isEqual).toBe(true);
				});
			});
		});
	});

	describe("errors", () => {
		test("undefined", () => {
			const tbl = table({
				columns: {
					id: smallint().notNull(),
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

		test("explicit undefined", () => {
			const tbl = table({
				columns: {
					id: smallint(),
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
						message: "Value cannot be undefined",
						fatal: true,
					},
				];
				expect(result.error.errors).toStrictEqual(expected);
			}

			const tableSchema = zodSchema(tbl);
			const tableResult = tableSchema.safeParse({ id: undefined });
			expect(tableResult.success).toBe(false);
			if (!tableResult.success) {
				const expected = [
					{
						code: "custom",
						path: ["id"],
						message: "Value cannot be undefined",
						fatal: true,
					},
				];
				expect(tableResult.error.errors).toStrictEqual(expected);
			}
		});

		test("null", () => {
			const tbl = table({
				columns: {
					id: smallint().notNull(),
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

		test("not smallint", () => {
			const tbl = table({
				columns: {
					id: smallint(),
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
					id: smallint(),
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
					id: smallint(),
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
					id: smallint(),
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

describe("integer", () => {
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
			expect(info.defaultValue).toBe("4a44dc15:10");

			column.default("10");
			expect(info.defaultValue).toBe("4a44dc15:10");

			const expression = sql`20`;
			column.default(expression);
			expect(info.defaultValue).toBe("f5ca38f7:20");
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

			test("input type is number, string, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: integer().notNull().default(1),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = number | string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: integer().notNull().default(1),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number | undefined;
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

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: integer(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = number | string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = number;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: integer().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = number | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = number | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = number | string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = number;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: integer().notNull().default(40),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = number | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = number | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			describe("as generated by default as identity", () => {
				test("input type is number, string | undefined", () => {
					const tbl = table({
						columns: {
							id: integer().generatedByDefaultAsIdentity(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const schema = zodSchema(tbl).shape.id;
					type InpuType = z.input<typeof schema>;
					type Expected = number | string | undefined;
					const isEqual: Expect<Equal<InpuType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("output type is number, or undefined", () => {
					const tbl = table({
						columns: {
							id: integer().generatedByDefaultAsIdentity(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const schema = zodSchema(tbl).shape.id;
					type OutputType = z.output<typeof schema>;
					type Expected = number | undefined;
					const isEqual: Expect<Equal<OutputType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("is non nullable and optional", () => {
					const tbl = table({
						columns: {
							id: integer().generatedByDefaultAsIdentity(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});

					const schema = zodSchema(tbl).shape.id;

					type InputType = z.input<typeof schema>;
					type ExpectedInputType = number | string | undefined;
					const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> =
						true;
					expect(isEqualInput).toBe(true);
					type OutputType = z.output<typeof schema>;
					type ExpectedOutputType = number | undefined;
					const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
						true;
					expect(isEqualOutput).toBe(true);

					expect(schema.safeParse(1).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});

				test("with notNull is non nullable and optional", () => {
					const tbl = table({
						columns: {
							id: integer().notNull().generatedByDefaultAsIdentity(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});

					const schema = zodSchema(tbl).shape.id;

					type InputType = z.input<typeof schema>;
					type ExpectedInputType = number | string | undefined;
					const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> =
						true;
					expect(isEqualInput).toBe(true);
					type OutputType = z.output<typeof schema>;
					type ExpectedOutputType = number | undefined;
					const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
						true;
					expect(isEqualOutput).toBe(true);

					expect(schema.safeParse(1).success).toBe(true);
					expect(schema.safeParse(null).success).toBe(false);
					expect(schema.safeParse(undefined).success).toBe(false);
				});
			});

			describe("as generated always as identity", () => {
				test("input type is never", () => {
					const tbl = table({
						columns: {
							id: integer().generatedAlwaysAsIdentity(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const schema = zodSchema(tbl).shape.id;
					type InpuType = z.input<typeof schema>;
					type Expected = never;
					const isEqual: Expect<Equal<InpuType, Expected>> = true;
					expect(isEqual).toBe(true);
				});

				test("output type is never", () => {
					const tbl = table({
						columns: {
							id: integer().generatedAlwaysAsIdentity(),
						},
						constraints: {
							primaryKey: primaryKey(["id"]),
						},
					});
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const schema = zodSchema(tbl).shape.id;
					type OutputType = z.output<typeof schema>;
					type Expected = never;
					const isEqual: Expect<Equal<OutputType, Expected>> = true;
					expect(isEqual).toBe(true);
				});
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: integer(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
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

describe("json", () => {
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
			expect(info.defaultValue).toBe("8db32685:'10'::json");

			column.default('{ "foo": "bar" }');
			expect(info.defaultValue).toBe('b3b793dd:\'{ "foo": "bar" }\'::json');

			column.default({ foo: "bar" });
			expect(info.defaultValue).toBe('e18d3ea6:\'{"foo":"bar"}\'::json');
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
			test("input type is JsonValue, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: json(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = JsonValue | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is JsonValue, null or undefined", () => {
				const tbl = table({
					columns: {
						id: json(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = JsonValue | null | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const objectResult = schema.safeParse({ a: 1 });
				expect(objectResult.success).toBe(true);
				if (objectResult.success) {
					expect(objectResult.data).toEqual({ a: 1 });
				}
				const arrayObjectResult = schema.safeParse({ a: 1 });
				expect(arrayObjectResult.success).toBe(true);
				if (arrayObjectResult.success) {
					expect(arrayObjectResult.data).toEqual({ a: 1 });
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = JsonValue;
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
				type Expected = JsonValue;
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

			test("input type is string, number, boolean, Record<string, any>, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: json().notNull().default({ a: 1 }),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = JsonValue | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, number, boolean, Record<string, any>, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: json().notNull().default({ a: 1 }),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;

				type Expected = JsonValue | undefined;
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

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: json(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;

				type Expected = JsonValue;
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;

				type Expected = JsonValue;
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = JsonValue;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = JsonValue;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("1").success).toBe(true);
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = JsonValue;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = JsonValue;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: json().default("1"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = JsonValue | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = JsonValue | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: json().notNull().default("1"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = JsonValue | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = JsonValue | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("with custom data type", () => {
			type Data = {
				count: number;
				name: string;
			};
			test("input type is custom data type, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: json<Data>(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Data | null | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is custom data type, null or undefined", () => {
				const tbl = table({
					columns: {
						id: json<Data>(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = Data | null | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const objectResult = schema.safeParse({ count: 1, name: "example" });
				expect(objectResult.success).toBe(true);
				if (objectResult.success) {
					expect(objectResult.data).toEqual({ count: 1, name: "example" });
				}
				const arrayObjectResult = schema.safeParse({
					count: 1,
					name: "example",
				});
				expect(arrayObjectResult.success).toBe(true);
				if (arrayObjectResult.success) {
					expect(arrayObjectResult.data).toEqual({ count: 1, name: "example" });
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("input type is custom data type with notNull", () => {
				const tbl = table({
					columns: {
						id: json<Data>().notNull(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Data;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is custom data type with notNull", () => {
				const tbl = table({
					columns: {
						id: json<Data>().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = Data;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const objectResult = schema.safeParse({ count: 1, name: "example" });
				expect(objectResult.success).toBe(true);
				if (objectResult.success) {
					expect(objectResult.data).toEqual({ count: 1, name: "example" });
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("input type is custom data type, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: json<Data>().notNull().default({ count: 1, name: "example" }),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Data | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is custom data type, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: json<Data>().notNull().default({ count: 1, name: "example" }),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;

				type Expected = Data | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const objectResult = schema.safeParse({ count: 2, name: "example" });
				expect(objectResult.success).toBe(true);
				if (objectResult.success) {
					expect(objectResult.data).toEqual({ count: 2, name: "example" });
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: json<Data>(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses objects", () => {
				const tbl = table({
					columns: {
						id: json<Data>(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse({ count: 1, name: "example" }).success).toBe(
					true,
				);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: json<Data>(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: json<Data>().default({ count: 1, name: "example" }),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse({ count: 2, name: "example" }).success).toBe(
					true,
				);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: json<Data>().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse({ count: 1, name: "example" }).success).toBe(
					true,
				);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: json<Data>().notNull().default({ count: 1, name: "example" }),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse({ count: 2, name: "example" }).success).toBe(
					true,
				);
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: json(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
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

describe("jsonb", () => {
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
			expect(info.defaultValue).toBe("fde695d0:'10'::jsonb");

			column.default('{ "foo": "bar" }');
			expect(info.defaultValue).toBe('df3dc0bb:\'{ "foo": "bar" }\'::jsonb');

			column.default({ foo: "bar" });
			expect(info.defaultValue).toBe('8b9f0ea3:\'{"foo":"bar"}\'::jsonb');
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = JsonValue | null | undefined;
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
				type Expected = JsonValue | null | undefined;
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = JsonValue;
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

				type Expected = JsonValue;
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

			test("input type is string, number, boolean, Record<string, any>, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: jsonb().notNull().default({ a: 1 }),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = JsonValue | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, number, boolean, Record<string, any>, or undefined with notNull and undefined", () => {
				const tbl = table({
					columns: {
						id: jsonb().notNull().default({ a: 1 }),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;

				type Expected = JsonValue | undefined;
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

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: jsonb(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = JsonValue;
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;

				type Expected = JsonValue;
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = JsonValue;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = JsonValue;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: jsonb().default("1"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = JsonValue | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = JsonValue | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = JsonValue;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = JsonValue;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: jsonb().notNull().default("1"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = JsonValue | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = JsonValue | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("with custom data type", () => {
			type Data = {
				count: number;
				name: string;
			};
			test("input type is custom data type, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: jsonb<Data>(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Data | null | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is custom data type, null or undefined", () => {
				const tbl = table({
					columns: {
						id: jsonb<Data>(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = Data | null | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const objectResult = schema.safeParse({ count: 1, name: "example" });
				expect(objectResult.success).toBe(true);
				if (objectResult.success) {
					expect(objectResult.data).toEqual({ count: 1, name: "example" });
				}
				const arrayObjectResult = schema.safeParse({
					count: 1,
					name: "example",
				});
				expect(arrayObjectResult.success).toBe(true);
				if (arrayObjectResult.success) {
					expect(arrayObjectResult.data).toEqual({ count: 1, name: "example" });
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(true);
			});

			test("input type is custom data type with notNull", () => {
				const tbl = table({
					columns: {
						id: jsonb<Data>().notNull(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Data;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is custom data type with notNull", () => {
				const tbl = table({
					columns: {
						id: jsonb<Data>().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = Data;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const objectResult = schema.safeParse({ count: 1, name: "example" });
				expect(objectResult.success).toBe(true);
				if (objectResult.success) {
					expect(objectResult.data).toEqual({ count: 1, name: "example" });
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("input type is custom data type, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: jsonb<Data>().notNull().default({ count: 1, name: "example" }),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Data | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is custom data type, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: jsonb<Data>().notNull().default({ count: 1, name: "example" }),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;

				type Expected = Data | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);

				const objectResult = schema.safeParse({ count: 2, name: "example" });
				expect(objectResult.success).toBe(true);
				if (objectResult.success) {
					expect(objectResult.data).toEqual({ count: 2, name: "example" });
				}
				const nullResult = schema.safeParse(null);
				expect(nullResult.success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: jsonb<Data>(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses objects", () => {
				const tbl = table({
					columns: {
						id: jsonb<Data>(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse({ count: 1, name: "example" }).success).toBe(
					true,
				);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: jsonb<Data>(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: jsonb<Data>().default({ count: 1, name: "example" }),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse({ count: 2, name: "example" }).success).toBe(
					true,
				);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: jsonb<Data>().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse({ count: 1, name: "example" }).success).toBe(
					true,
				);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: jsonb<Data>().notNull().default({ count: 1, name: "example" }),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse({ count: 2, name: "example" }).success).toBe(
					true,
				);
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: jsonb(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
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

describe("real", () => {
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
			expect(info.defaultValue).toBe("1c848dd0:'10'::real");

			column.default(10);
			expect(info.defaultValue).toBe("1c848dd0:'10'::real");

			column.default(100n);
			expect(info.defaultValue).toBe("df0c433b:'100'::real");
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

			test("input type is number with notNull", () => {
				const tbl = table({
					columns: {
						id: real().notNull(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | number | bigint;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
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

			test("input type is bigint, number, string, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: real().notNull().default(30),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = bigint | number | string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: real().notNull().default(30),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number | undefined;
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

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: real(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = number;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: real().default(2.2),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = number | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = number;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: real().notNull().default(2.2),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = number | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: real(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
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

describe("serial", () => {
	test("returns a PgSerial instance", () => {
		const column = serial();
		expect(column).toBeInstanceOf(PgSerial);
	});

	describe("PgSerial", () => {
		test("inherits from PgColumnWithoutDefault", () => {
			expect(serial()).toBeInstanceOf(SerialColumn);
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
		describe("by default", () => {
			test("input type is number, string, or undefined", () => {
				const tbl = table({
					columns: {
						id: serial(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | string | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number, or undefined", () => {
				const tbl = table({
					columns: {
						id: serial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number | undefined;
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

			test("parses number", () => {
				const tbl = table({
					columns: {
						id: serial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("does not parse decimals", () => {
				const tbl = table({
					columns: {
						id: serial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("does not parse bigint", () => {
				const tbl = table({
					columns: {
						id: serial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(1n).success).toBe(false);
			});

			test("parses strings that can be coerced to number", () => {
				const tbl = table({
					columns: {
						id: serial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("does not parse null", () => {
				const tbl = table({
					columns: {
						id: serial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(false);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: serial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
			});

			test("minimum is -2147483648", () => {
				const tbl = table({
					columns: {
						id: serial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(-2147483648).success).toBe(true);
				expect(schema.safeParse(-2147483649).success).toBe(false);
			});

			test("maximum is 2147483647", () => {
				const tbl = table({
					columns: {
						id: serial(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(2147483647).success).toBe(true);
				expect(schema.safeParse(2147483648).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is number, string or undefined", () => {
				const tbl = table({
					columns: {
						id: serial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | string | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is number or undefined", () => {
				const tbl = table({
					columns: {
						id: serial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: serial(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = number | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = number | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: serial(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: serial(),
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

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Required",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: serial(),
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
						id: serial(),
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
						id: serial(),
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
						id: serial(),
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
						id: serial(),
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

describe("uuid", () => {
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
				"70020243:'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid",
			);

			const expression = sql`'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid`;
			column.default(expression);
			expect(info.defaultValue).toBe(
				"70020243:'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid",
			);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: uuid()
							.notNull()
							.default("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11"),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: uuid()
							.notNull()
							.default("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
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

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: uuid(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: uuid().default("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(
					schema.safeParse("A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11").success,
				).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

				test("explicit undefined", () => {
					const tbl = table({
						columns: {
							id: uuid(),
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
								message: "Value cannot be undefined",
								fatal: true,
							},
						];
						expect(result.error.errors).toStrictEqual(expected);
					}

					const tableSchema = zodSchema(tbl);
					const tableResult = tableSchema.safeParse({ id: undefined });
					expect(tableResult.success).toBe(false);
					if (!tableResult.success) {
						const expected = [
							{
								code: "custom",
								path: ["id"],
								message: "Value cannot be undefined",
								fatal: true,
							},
						];
						expect(tableResult.error.errors).toStrictEqual(expected);
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

describe("characterVarying", () => {
	test("returns a PgVarChar instance", () => {
		const column = characterVarying();
		expect(column).toBeInstanceOf(PgCharacterVarying);
	});

	test("has varchar as an alias", () => {
		const column = varchar();
		expect(column).toBeInstanceOf(PgCharacterVarying);
	});

	describe("PgVarChar", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(characterVarying()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to character varying", () => {
			const info = Object.fromEntries(Object.entries(characterVarying())).info;
			expect(info.dataType).toBe("character varying");
		});

		test("default with column data type", () => {
			const column = characterVarying();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("26d70a00:'10'::character varying");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = characterVarying() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = characterVarying() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional maximumLength", () => {
		test("characterMaximumLength is set to maximumLength", () => {
			const column = characterVarying(255);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.characterMaximumLength).toBe(255);
		});

		test("data type has maximumLength", () => {
			const info = Object.fromEntries(
				Object.entries(characterVarying(255)),
			).info;
			expect(info.dataType).toBe("character varying(255)");
		});

		test("default with column data type", () => {
			const column = characterVarying(100);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("26d70a00:'10'::character varying");
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: characterVarying(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: characterVarying(),
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
						id: characterVarying().notNull(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: characterVarying().notNull(),
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

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: characterVarying().notNull().default("hello"),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or undefined with notNull and undefined", () => {
				const tbl = table({
					columns: {
						id: characterVarying().notNull().default("hello"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
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
						id: characterVarying(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
			});

			test("does not parse other objects", () => {
				const tbl = table({
					columns: {
						id: characterVarying(),
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
						id: characterVarying(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: characterVarying(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: characterVarying().default("hello"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: characterVarying().notNull(),
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
						id: characterVarying().notNull().default("hello"),
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
						id: characterVarying(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse("hello!").success).toBe(true);
			});

			test("with maximum length", () => {
				const tbl = table({
					columns: {
						id: characterVarying(5),
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
						id: characterVarying(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: characterVarying(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: characterVarying(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});

				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: characterVarying().default("hello"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: characterVarying().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: characterVarying().notNull().default("hello"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: characterVarying().notNull(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: characterVarying(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: characterVarying().notNull(),
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
						id: characterVarying(),
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
						id: characterVarying(5),
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

describe("character", () => {
	test("returns a PgChar instance", () => {
		const column = character();
		expect(column).toBeInstanceOf(PgCharacter);
	});

	test("has char as an alias", () => {
		const column = char();
		expect(column).toBeInstanceOf(PgCharacter);
	});

	describe("PgChar", () => {
		test("inherits from PgColumnWithDefault", () => {
			expect(character()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to character(1)", () => {
			const info = Object.fromEntries(Object.entries(character())).info;
			expect(info.dataType).toBe("character(1)");
		});

		test("characterMaximumLength is set to 1", () => {
			const column = character();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.characterMaximumLength).toBe(1);
		});

		test("default with column data type", () => {
			const column = character();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("2adbd9e9:'10'::character");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = character() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = character() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional maximumLength", () => {
		test("characterMaximumLength is set to maximumLength", () => {
			const column = character(255);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.characterMaximumLength).toBe(255);
		});

		test("data type has maximumLength", () => {
			const info = Object.fromEntries(Object.entries(character(255))).info;
			expect(info.dataType).toBe("character(255)");
		});

		test("default with column data type", () => {
			const column = character(200);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("10");
			expect(info.defaultValue).toBe("2adbd9e9:'10'::character");
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: character(10),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: character(10),
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
						id: character(10).notNull(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: character(10).notNull(),
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

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: character(10).notNull().default("hello"),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: character(10).notNull().default("hello"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
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
						id: character(5),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse("hello!").success).toBe(false);
			});

			test("does not parse other objects", () => {
				const tbl = table({
					columns: {
						id: character(5),
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
						id: character(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: character(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: character(5).default("hello"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: character(5).notNull(),
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
						id: character(5).notNull().default("hello"),
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
						id: character(10),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or null", () => {
				const tbl = table({
					columns: {
						id: character(10),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: character(5),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: character(5).default("hello"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: character(5).notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: character(5).default("hello").notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: character().notNull(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: character(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: character().notNull(),
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
						id: character(),
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
						id: character(10),
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

describe("time", () => {
	test("returns a PgTime instance", () => {
		const column = time();
		expect(column).toBeInstanceOf(PgTime);
	});

	describe("PgTime", () => {
		test("inherits from PgTimeColumn", () => {
			expect(time()).toBeInstanceOf(PgColumn);
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
			expect(info.defaultValue).toBe(
				"48a39507:'04:05 AM'::time without time zone",
			);
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
			expect(info.defaultValue).toBe(
				"48a39507:'04:05 AM'::time without time zone",
			);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: time().notNull().default("11:30"),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: time().notNull().default("11:30"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
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

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: time(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
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
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: time().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: time().default("11:30"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: time().notNull().default("11:30"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: time(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
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

describe("timeWithTimeZone", () => {
	test("returns a PgTimeTz instance", () => {
		const column = timeWithTimeZone();
		expect(column).toBeInstanceOf(PgTimeWithTimeZone);
	});

	test("timetz alias", () => {
		const column = timetz();
		expect(column).toBeInstanceOf(PgTimeWithTimeZone);
	});

	describe("PgTimeTz", () => {
		test("inherits from PgTimeColumn", () => {
			expect(timeWithTimeZone()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to timeWithTimeZone", () => {
			const info = Object.fromEntries(Object.entries(timeWithTimeZone())).info;
			expect(info.dataType).toBe("time with time zone");
		});

		test("datetimePrecision is set to null", () => {
			const column = timeWithTimeZone();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("default with column data type", () => {
			const column = timeWithTimeZone();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("04:05:06-08:00");
			expect(info.defaultValue).toBe(
				"12621bc0:'04:05:06-08:00'::time with time zone",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = timeWithTimeZone() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = timeWithTimeZone() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = timeWithTimeZone(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(Object.entries(timeWithTimeZone(1))).info;
			expect(info.dataType).toBe("time(1) with time zone");
		});

		test("default with column data type", () => {
			const column = timeWithTimeZone(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("04:05:06-08:00");
			expect(info.defaultValue).toBe(
				"12621bc0:'04:05:06-08:00'::time with time zone",
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone(),
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
						id: timeWithTimeZone().notNull(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone().notNull(),
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

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone().notNull().default("11:30"),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone().notNull().default("11:30"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
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
						id: timeWithTimeZone(),
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
						id: timeWithTimeZone(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone().default("11:30"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("01:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone().notNull(),
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
						id: timeWithTimeZone().notNull().default("11:30"),
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
						id: timeWithTimeZone(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone().default("11:30"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone().default("11:30").notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone().notNull(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: timeWithTimeZone().notNull(),
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
						id: timeWithTimeZone(),
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
						id: timeWithTimeZone(),
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

describe("timestamp", () => {
	test("returns a PgTimestamp instance", () => {
		const column = timestamp();
		expect(column).toBeInstanceOf(PgTimestamp);
	});

	describe("PgTimestamp", () => {
		test("inherits from PgTimeColumn", () => {
			expect(timestamp()).toBeInstanceOf(PgColumn);
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
				"36813bcc:'1970-01-01T00:00:00.001Z'::timestamp without time zone",
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
				"36813bcc:'1970-01-01T00:00:00.001Z'::timestamp without time zone",
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

			test("input type is Date, string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: timestamp().notNull().default(new Date(1)),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Date | string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: timestamp().notNull().default(new Date(1)),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = Date | undefined;
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

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: timestamp(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | Date;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = Date;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: timestamp().default(new Date(2)),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = Date | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = Date | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | Date;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = Date;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: timestamp().default(new Date()).notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = Date | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = Date | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: timestamp(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
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

describe("timestampWithTimeZone", () => {
	test("returns a PgTimestampTz instance", () => {
		const column = timestampWithTimeZone();
		expect(column).toBeInstanceOf(PgTimestampWithTimeZone);
	});

	test("inherits from PgTimeColumn", () => {
		expect(timestampWithTimeZone()).toBeInstanceOf(PgColumn);
	});

	test("timestamptz alias", () => {
		const column = timestamptz();
		expect(column).toBeInstanceOf(PgTimestampWithTimeZone);
	});

	describe("PgTimestampTz", () => {
		test("inherits from PgColumnWithPrecision", () => {
			expect(timestampWithTimeZone()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to timestamptz", () => {
			const info = Object.fromEntries(
				Object.entries(timestampWithTimeZone()),
			).info;
			expect(info.dataType).toBe("timestamp with time zone");
		});

		test("datetimePrecision is set to null", () => {
			const column = timestampWithTimeZone();
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(null);
		});

		test("default with column data type", () => {
			const column = timestampWithTimeZone();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(new Date(1));
			expect(info.defaultValue).toBe(
				"e50fefac:'1970-01-01T00:00:00.001Z'::timestamp with time zone",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = timestampWithTimeZone() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = timestampWithTimeZone() as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});
	});

	describe("with optional precision", () => {
		test("datetimePrecision is set to precision", () => {
			const column = timestampWithTimeZone(1);
			const info = Object.fromEntries(Object.entries(column)).info;
			expect(info.datetimePrecision).toBe(1);
		});

		test("data type has precision", () => {
			const info = Object.fromEntries(
				Object.entries(timestampWithTimeZone(1)),
			).info;
			expect(info.dataType).toBe("timestamp(1) with time zone");
		});

		test("default with column data type", () => {
			const column = timestampWithTimeZone(1);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(new Date(1));
			expect(info.defaultValue).toBe(
				"e50fefac:'1970-01-01T00:00:00.001Z'::timestamp with time zone",
			);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is Date, string, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date, null, or undefined", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone(),
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
						id: timestampWithTimeZone().notNull(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Date | string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date with notNull", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone().notNull(),
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

			test("input type is Date, string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone().notNull().default(new Date(1)),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = Date | string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date or undefined with notNull and undefined", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone().notNull().default(new Date(1)),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = Date | undefined;
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
						id: timestampWithTimeZone(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(true);
			});

			test("parses strings that can be coerced into dates", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date().toISOString()).success).toBe(true);
			});

			test("does not parse other strings", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone().default(new Date()),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone().notNull(),
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
						id: timestampWithTimeZone().notNull().default(new Date()),
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
						id: timestampWithTimeZone(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = Date | string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is Date", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = Date;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | Date;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = Date;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone().default(new Date(2)),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = Date | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = Date | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | Date;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = Date;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone().default(new Date(2)).notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = Date | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = Date | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone().notNull(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: timestampWithTimeZone().notNull(),
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
						id: timestampWithTimeZone(),
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
						id: timestampWithTimeZone(),
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

describe("numeric", () => {
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
			expect(info.defaultValue).toBe("4f353dbd:'1'::numeric");

			column.default("1");
			expect(info.defaultValue).toBe("4f353dbd:'1'::numeric");

			column.default(1.1);
			expect(info.defaultValue).toBe("d8bd8ef0:'1.1'::numeric");

			column.default("1.1");
			expect(info.defaultValue).toBe("d8bd8ef0:'1.1'::numeric");

			column.default(100n);
			expect(info.defaultValue).toBe("0fa16167:'100'::numeric");
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
			expect(info.defaultValue).toBe("4f353dbd:'1'::numeric");

			column.default("1");
			expect(info.defaultValue).toBe("4f353dbd:'1'::numeric");

			column.default(1.1);
			expect(info.defaultValue).toBe("d8bd8ef0:'1.1'::numeric");

			column.default("1.1");
			expect(info.defaultValue).toBe("d8bd8ef0:'1.1'::numeric");

			column.default(100n);
			expect(info.defaultValue).toBe("0fa16167:'100'::numeric");
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
			expect(info.defaultValue).toBe("4f353dbd:'1'::numeric");

			column.default("1");
			expect(info.defaultValue).toBe("4f353dbd:'1'::numeric");

			column.default(1.1);
			expect(info.defaultValue).toBe("d8bd8ef0:'1.1'::numeric");

			column.default("1.1");
			expect(info.defaultValue).toBe("d8bd8ef0:'1.1'::numeric");

			column.default(100n);
			expect(info.defaultValue).toBe("0fa16167:'100'::numeric");
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

			test("input type is number, bigint, string, or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: numeric().notNull().default(2),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = number | bigint | string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: numeric().notNull().default(2),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
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

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: numeric(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: numeric().default(1),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = bigint | number | string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: numeric(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
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

describe("enumerated", () => {
	test("returns a PgEnum instance", () => {
		const role = enumType("role", ["user", "admin", "superuser"]);
		const testEnum = enumerated(role);
		expect(testEnum).toBeInstanceOf(PgEnum);
	});

	test("enum name", () => {
		const role = enumType("myEnum", ["one", "two", "three"]);
		const testEnum = enumerated(role);
		const columnInfo: ColumnInfo = Object.fromEntries(
			Object.entries(testEnum),
		).info;

		expect(columnInfo.dataType).toBe("myEnum");
	});

	test("enum values", () => {
		const role = enumType("myEnum", ["one", "two", "three"]);
		const testEnum = enumerated(role);
		const columnDef = Object.fromEntries(Object.entries(testEnum)) as {
			values: string[];
		};
		expect(columnDef.values).toStrictEqual(["one", "two", "three"]);
	});

	test("default info", () => {
		const role = enumType("myEnum", ["one", "two", "three"]);
		const testEnum = enumerated(role);
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
			enum: true,
			volatileDefault: "unknown",
		});
	});

	test("does not have generatedAlwaysAsIdentity", () => {
		const role = enumType("myEnum", ["one", "two", "three"]);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const column = enumerated(role) as any;
		expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(false);
	});

	test("does not have generatedByDefaultAsIdentity", () => {
		const role = enumType("myEnum", ["one", "two", "three"]);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const column = enumerated(role) as any;
		expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
			false,
		);
	});

	test("notNull()", () => {
		const role = enumType("myEnum", ["one", "two", "three"]);
		const testEnum = enumerated(role).notNull();
		const columnInfo: ColumnInfo = Object.fromEntries(
			Object.entries(testEnum),
		).info;
		expect(columnInfo.isNullable).toBe(false);
	});

	test("default()", () => {
		const role = enumType("myEnum", ["one", "two", "three"]);
		const testEnum = enumerated(role).default("one");
		const columnInfo: ColumnInfo = Object.fromEntries(
			Object.entries(testEnum),
		).info;
		expect(columnInfo.defaultValue).toBe("611b3196:'one'::myEnum");
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is enum values, null, or undefined", () => {
				const role = enumType("role", ["user", "admin", "superuser"]);
				const tbl = table({
					columns: {
						id: enumerated(role),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = "user" | "admin" | "superuser" | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is enum values, null, or undefined", () => {
				const role = enumType("role", ["user", "admin", "superuser"]);
				const tbl = table({
					columns: {
						id: enumerated(role),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = "user" | "admin" | "superuser" | null | undefined;
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

			test("input type is enum values with notNull", () => {
				const tbl = table({
					columns: {
						id: enumerated(
							enumType("role", ["user", "admin", "superuser"]),
						).notNull(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = "user" | "admin" | "superuser";
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is enum values with notNull", () => {
				const tbl = table({
					columns: {
						id: enumerated(
							enumType("role", ["user", "admin", "superuser"]),
						).notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = "user" | "admin" | "superuser";
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

			test("input type is enum values or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"]))
							.notNull()
							.default("user"),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = "user" | "admin" | "superuser" | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is enum values or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"]))
							.notNull()
							.default("admin"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = "user" | "admin" | "superuser" | undefined;
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

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"])),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
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
			test("input type is enum values", () => {
				const role = enumType("role", ["user", "admin", "superuser"]);
				const tbl = table({
					columns: {
						id: enumerated(role),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = "user" | "admin" | "superuser";
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is enum values", () => {
				const enumRole = enumType("role", ["user", "admin", "superuser"]);
				const tbl = table({
					columns: {
						id: enumerated(enumRole),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = "user" | "admin" | "superuser";
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const enumRole = enumType("role", ["user", "admin", "superuser"]);
				const tbl = table({
					columns: {
						id: enumerated(enumRole),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = "user" | "admin" | "superuser";
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = "user" | "admin" | "superuser";
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = "user" | "admin" | "superuser" | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = "user" | "admin" | "superuser" | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = "user" | "admin" | "superuser";
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = "user" | "admin" | "superuser";
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("user").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
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

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = "user" | "admin" | "superuser" | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = "user" | "admin" | "superuser" | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: enumerated(enumType("role", ["user", "admin", "superuser"])),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
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

describe("tsvector", () => {
	test("returns a PgTsvector instance", () => {
		const column = tsvector();
		expect(column).toBeInstanceOf(PgTsvector);
	});

	describe("PgTsvector", () => {
		test("inherits from PgColumn", () => {
			expect(tsvector()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to tsvector", () => {
			const info = Object.fromEntries(Object.entries(tsvector())).info;
			expect(info.dataType).toBe("tsvector");
		});

		test("default with string", () => {
			const column = tsvector();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("foo");
			expect(info.defaultValue).toBe("8dfffe81:'foo'::tsvector");
		});

		test("default with expression", () => {
			const column = tsvector();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`to_tsvector("foo")`);
			expect(info.defaultValue).toBe('67fea042:to_tsvector("foo")');
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = tsvector() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = tsvector() as any;
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
						id: tsvector(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: tsvector(),
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
						id: tsvector().notNull(),
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
						id: tsvector().notNull(),
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

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: tsvector()
							.notNull()
							.default(sql`to_tsvector("foo")`),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("one");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("one");
				}
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: tsvector()
							.notNull()
							.default(sql`to_tsvector("foo")`),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
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
						id: tsvector(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: tsvector(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: tsvector(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("does not parse other types", () => {
				const tbl = table({
					columns: {
						id: tsvector(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: tsvector().default(sql`to_tsvector("foo")`),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: tsvector().notNull(),
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
						id: tsvector()
							.notNull()
							.default(sql`to_tsvector("foo")`),
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
						id: tsvector(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: tsvector(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: tsvector(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: tsvector().default(sql`to_tsvector("foo")`),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: tsvector().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: tsvector()
							.default(sql`to_tsvector("foo")`)
							.notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: tsvector().notNull(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: tsvector(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: tsvector().notNull(),
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
							message: "Expected string with tsvector format, received null",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a string", () => {
				const tbl = table({
					columns: {
						id: tsvector(),
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
							message: "Expected string with tsvector format, received number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
		});
	});
});

describe("tsquery", () => {
	test("returns a PgTsquery instance", () => {
		const column = tsquery();
		expect(column).toBeInstanceOf(PgTsquery);
	});

	describe("PgTsquery", () => {
		test("inherits from PgColumn", () => {
			expect(tsquery()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to tsquery", () => {
			const info = Object.fromEntries(Object.entries(tsquery())).info;
			expect(info.dataType).toBe("tsquery");
		});

		test("default with string", () => {
			const column = tsquery();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default("foo");
			expect(info.defaultValue).toBe("21f473ad:'foo'::tsquery");
		});

		test("default with expression", () => {
			const column = tsquery();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`to_tsquery("foo")`);
			expect(info.defaultValue).toBe('4212752c:to_tsquery("foo")');
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = tsquery() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = tsquery() as any;
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
						id: tsquery(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: tsquery(),
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
						id: tsquery().notNull(),
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
						id: tsquery().notNull(),
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

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: tsquery()
							.notNull()
							.default(sql`to_tsquery("foo")`),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("one");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("one");
				}
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: tsquery()
							.notNull()
							.default(sql`to_tsquery("foo")`),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
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
						id: tsquery(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: tsquery(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: tsquery(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("does not parse other types", () => {
				const tbl = table({
					columns: {
						id: tsquery(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: tsquery().default(sql`to_tsquery("foo")`),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: tsquery().notNull(),
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
						id: tsquery()
							.notNull()
							.default(sql`to_tsquery("foo")`),
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
						id: tsquery(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: tsquery(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: tsquery(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: tsquery().default(sql`to_tsquery("foo")`),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: tsquery().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: tsquery()
							.default(sql`to_tsquery("foo")`)
							.notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: tsquery().notNull(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: tsquery(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: tsquery().notNull(),
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
							message: "Expected string with tsquery format, received null",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a string", () => {
				const tbl = table({
					columns: {
						id: tsquery(),
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
							message: "Expected string with tsquery format, received number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
		});
	});
});

describe("xml", () => {
	test("returns a PgXML instance", () => {
		const column = xml();
		expect(column).toBeInstanceOf(PgXML);
	});

	describe("PgXML", () => {
		test("inherits from PgColumn", () => {
			expect(xml()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to xml", () => {
			const info = Object.fromEntries(Object.entries(xml())).info;
			expect(info.dataType).toBe("xml");
		});

		test("default with string", () => {
			const column = xml().default(
				'<?xml version="1.0"?><book><title>Manual</title></book>',
			);
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.defaultValue).toBe(
				"a0c8e47f:'<?xml version=\"1.0\"?><book><title>Manual</title></book>'::xml",
			);
		});

		test("default with expression", () => {
			const column = xml();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(
				sql`'<?xml version="1.0"?><book><title>Manual</title></book>'`,
			);
			expect(info.defaultValue).toBe(
				"ed4277f6:'<?xml version=\"1.0\"?><book><title>Manual</title></book>'",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = xml() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = xml() as any;
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
						id: xml(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: xml(),
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
						id: xml().notNull(),
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
						id: xml().notNull(),
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

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: xml()
							.notNull()
							.default(
								'<?xml version="1.0"?><book><title>Manual</title></book>',
							),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("one");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("one");
				}
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: xml()
							.notNull()
							.default(
								'<?xml version="1.0"?><book><title>Manual</title></book>',
							),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
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
						id: xml(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: xml(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: xml(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("does not parse other types", () => {
				const tbl = table({
					columns: {
						id: xml(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: xml().default(sql`to_xml("foo")`),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: xml().notNull(),
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
						id: xml()
							.notNull()
							.default(sql`to_xml("foo")`),
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
						id: xml(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: xml(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: xml(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("foo").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: xml().default(sql`to_xml("foo")`),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: xml().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: xml()
							.default(sql`to_xml("foo")`)
							.notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: xml().notNull(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: xml(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: xml().notNull(),
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
							message: "Expected string with xml format, received null",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("not a string", () => {
				const tbl = table({
					columns: {
						id: xml(),
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
							message: "Expected string with xml format, received number",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
		});
	});
});

describe("bit", () => {
	test("returns a PgBit instance", () => {
		const column = bit();
		expect(column).toBeInstanceOf(PgBit);
	});

	describe("PgBit", () => {
		test("inherits from PgColumn", () => {
			expect(bit()).toBeInstanceOf(PgColumn);
		});

		test("default dataType is bit", () => {
			const info = Object.fromEntries(Object.entries(bit())).info;
			expect(info.dataType).toBe("bit(1)");
		});

		test("dataType with fixed length", () => {
			const info = Object.fromEntries(Object.entries(bit(10))).info;
			expect(info.dataType).toBe("bit(10)");
		});

		test("can set characterMaximumLength", () => {
			const column = bit(5);
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.characterMaximumLength).toBe(5);
		});

		test("default with string", () => {
			const column = bit().default("0");
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.defaultValue).toBe("e96fd7d9:'0'::bit");
		});

		test("default with expression", () => {
			const column = bit();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`'0101'::bit(4)`);
			expect(info.defaultValue).toBe("bb1177bb:'0101'::bit(4)");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bit() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bit() as any;
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
						id: bit(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: bit(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				const result = schema.safeParse("1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("1");
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
						id: bit().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("1");
				}
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: bit().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("1");
				}
			});

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: bit().notNull().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("1");
				}
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: bit().notNull().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("1");
				}
			});

			test("parses strings", () => {
				const tbl = table({
					columns: {
						id: bit(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: bit(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: bit(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("does not parse other types", () => {
				const tbl = table({
					columns: {
						id: bit(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: bit().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: bit().notNull(),
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
						id: bit()
							.notNull()
							.default(sql`to_bit("foo")`),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string with primary key", () => {
				const tbl = table({
					columns: {
						id: bit(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: bit(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: bit(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: bit().default("0"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: bit().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("0").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: bit().default("1").notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("0").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: bit().notNull(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: bit(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: bit().notNull(),
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
						id: bit(),
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

			test("not a bit value", () => {
				const tbl = table({
					columns: {
						id: bit(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse("a");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_string",
							path: [],
							message: "Invalid bit",
							validation: "regex",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
		});

		test("bit value exceed default length", () => {
			const tbl = table({
				columns: {
					id: bit(),
				},
			});
			const schema = zodSchema(tbl).shape.id;
			const result = schema.safeParse("11");
			expect(result.success).toBe(false);
			if (!result.success) {
				const expected = [
					{
						code: "too_big",
						type: "string",
						exact: false,
						inclusive: true,
						maximum: 1,
						path: [],
						message: "Bit string length does not match type",
					},
				];
				expect(result.error.errors).toStrictEqual(expected);
			}
		});

		test("bit value exceed specified length", () => {
			const tbl = table({
				columns: {
					id: bit(5),
				},
			});
			const schema = zodSchema(tbl).shape.id;
			const result = schema.safeParse("110010");
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
						message: "Bit string length does not match type",
					},
				];
				expect(result.error.errors).toStrictEqual(expected);
			}
		});
	});
});

describe("bit varying", () => {
	test("returns a PgVarbit instance", () => {
		const column = bitVarying();
		expect(column).toBeInstanceOf(PgBitVarying);
	});

	test("has varbit as alias", () => {
		const column = varbit();
		expect(column).toBeInstanceOf(PgBitVarying);
	});

	describe("PgVarbit", () => {
		test("inherits from PgColumn", () => {
			expect(bitVarying()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to bit varying", () => {
			const info = Object.fromEntries(Object.entries(bitVarying())).info;
			expect(info.dataType).toBe("bit varying");
		});

		test("can set characterMaximumLength", () => {
			const column = bitVarying(5);
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.characterMaximumLength).toBe(5);
		});

		test("default with string", () => {
			const column = bitVarying().default("0101");
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.defaultValue).toBe("f86fb28d:'0101'::bit varying");
		});

		test("default with expression", () => {
			const column = bitVarying(4);
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`'0101'::varbit(4)`);
			expect(info.defaultValue).toBe("f84a42e2:'0101'::varbit(4)");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bitVarying() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = bitVarying() as any;
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
						id: bitVarying(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: bitVarying(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				const result = schema.safeParse("1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("1");
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
						id: bitVarying().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("1");
				}
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: bitVarying().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("1");
				}
			});

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: bitVarying().notNull().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("1");
				}
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: bitVarying().notNull().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("1");
				}
			});

			test("parses strings", () => {
				const tbl = table({
					columns: {
						id: bitVarying(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
			});

			test("parses bit string of arbitrary length", () => {
				const tbl = table({
					columns: {
						id: bitVarying(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("11100").success).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: bitVarying(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: bitVarying(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("does not parse other types", () => {
				const tbl = table({
					columns: {
						id: bitVarying(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: bitVarying().default("1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: bitVarying().notNull(),
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
						id: bitVarying()
							.notNull()
							.default(sql`to_varbit("foo")`),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string with primary key", () => {
				const tbl = table({
					columns: {
						id: bitVarying(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: bitVarying(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: bitVarying(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: bitVarying().default("0"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: bitVarying().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("0").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: bitVarying().default("1").notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("0").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: bitVarying().notNull(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: bitVarying(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: bitVarying().notNull(),
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
						id: bitVarying(),
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

			test("not a bit value", () => {
				const tbl = table({
					columns: {
						id: bitVarying(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse("a");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_string",
							path: [],
							message: "Invalid bit",
							validation: "regex",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
		});

		test("bit value exceed maximum length", () => {
			const tbl = table({
				columns: {
					id: bitVarying(5),
				},
			});
			const schema = zodSchema(tbl).shape.id;
			const result = schema.safeParse("111011");
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
						message: "Bit string length does not match type",
					},
				];
				expect(result.error.errors).toStrictEqual(expected);
			}
		});

		test("bit value exceed specified length", () => {
			const tbl = table({
				columns: {
					id: bitVarying(5),
				},
			});
			const schema = zodSchema(tbl).shape.id;
			const result = schema.safeParse("110010");
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
						message: "Bit string length does not match type",
					},
				];
				expect(result.error.errors).toStrictEqual(expected);
			}
		});
	});
});

describe("inet", () => {
	test("returns a PgInet instance", () => {
		const column = inet();
		expect(column).toBeInstanceOf(PgInet);
	});

	describe("PgInet", () => {
		test("inherits from PgColumn", () => {
			expect(inet()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to inet", () => {
			const info = Object.fromEntries(Object.entries(inet())).info;
			expect(info.dataType).toBe("inet");
		});

		test("default with string", () => {
			const column = inet().default("192.168.0.1");
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.defaultValue).toBe("840df336:'192.168.0.1'::inet");
		});

		test("default with expression", () => {
			const column = inet();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`'192.168.0.1'::inet`);
			expect(info.defaultValue).toBe("840df336:'192.168.0.1'::inet");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = inet() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = inet() as any;
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
						id: inet(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: inet(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				const result = schema.safeParse("192.168.0.1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("192.168.0.1");
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
						id: inet().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("192.168.0.1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("192.168.0.1");
				}
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: inet().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("192.168.0.1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("192.168.0.1");
				}
			});

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: inet().notNull().default("192.168.0.1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("192.168.0.1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("192.168.0.1");
				}
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: inet().notNull().default("192.168.0.1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("192.168.0.1");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("192.168.0.1");
				}
			});

			test("parses IPv4 addresses", () => {
				const tbl = table({
					columns: {
						id: inet(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("192.168.0.1").success).toBe(true);
			});

			test("parses IPv4 addresses with subnet", () => {
				const tbl = table({
					columns: {
						id: inet(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("192.168.0.1/24").success).toBe(true);
			});

			test("parses IPv6 addresses", () => {
				const tbl = table({
					columns: {
						id: inet(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(
					schema.safeParse("84d5:51a0:9114:1855:4cfa:f2d7:1f12:7003").success,
				).toBe(true);
				expect(schema.safeParse("2001:db8:85a3::8a2e:370:7334").success).toBe(
					true,
				);
				expect(
					schema.safeParse("fe80:0000:0000:0000:0204:61ff:fe9d:f156").success,
				).toBe(true);
				expect(schema.safeParse("::1").success).toBe(true);
			});

			test("parses IPv6 addresses with subnet", () => {
				const tbl = table({
					columns: {
						id: inet(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(
					schema.safeParse("84d5:51a0:9114:1855:4cfa:f2d7:1f12:7003/64")
						.success,
				).toBe(true);
				expect(
					schema.safeParse("2001:db8:85a3::8a2e:370:7334/48").success,
				).toBe(true);
				expect(
					schema.safeParse("fe80:0000:0000:0000:0204:61ff:fe9d:f156/46")
						.success,
				).toBe(true);
				expect(schema.safeParse("::1/128").success).toBe(true);
			});

			test("does not parse invalid ip addresses", () => {
				const tbl = table({
					columns: {
						id: inet(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(false);
				expect(schema.safeParse("256.1").success).toBe(false);
				expect(schema.safeParse("256.1.1.1").success).toBe(false);
				expect(schema.safeParse(" 256.1.1.1").success).toBe(false);
				expect(schema.safeParse("2001:db8::8a2e:370:7334:").success).toBe(
					false,
				);
				expect(schema.safeParse(" 2001:db8::8a2e:370:7334:").success).toBe(
					false,
				);
				expect(schema.safeParse("2001:db8::8a2e:0370:7334/129").success).toBe(
					false,
				);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: inet(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: inet(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("does not parse other types", () => {
				const tbl = table({
					columns: {
						id: inet(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: inet().default("192.168.0.1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("192.168.0.2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: inet().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("192.168.0.1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: inet().notNull().default("192.168.0.1"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("192.168.0.1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string with primary key", () => {
				const tbl = table({
					columns: {
						id: inet(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: inet(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: inet(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("192.168.1.1").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: inet().default("192.168.1.1"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("192.168.1.2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: inet().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("192.168.1.2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: inet().default("192.168.1.1").notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("192.168.1.2").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: inet().notNull(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: inet(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: inet().notNull(),
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
						id: inet(),
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

			test("not a valid ip", () => {
				const tbl = table({
					columns: {
						id: inet(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse("192.23");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_string",
							path: [],
							message: "Invalid inet",
							validation: "regex",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
		});
	});
});

describe("cidr", () => {
	test("returns a PgCIDR instance", () => {
		const column = cidr();
		expect(column).toBeInstanceOf(PgCIDR);
	});

	describe("PgCIDR", () => {
		test("inherits from PgColumn", () => {
			expect(cidr()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to inet", () => {
			const info = Object.fromEntries(Object.entries(cidr())).info;
			expect(info.dataType).toBe("cidr");
		});

		test("default with string", () => {
			const column = cidr().default("192.168.100.128/25");
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.defaultValue).toBe("720ecbec:'192.168.100.128/25'::cidr");
		});

		test("default with expression", () => {
			const column = cidr();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`'192.168.100.128/25'::cidr`);
			expect(info.defaultValue).toBe("720ecbec:'192.168.100.128/25'::cidr");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = cidr() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = cidr() as any;
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
						id: cidr(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: cidr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				const result = schema.safeParse("192.168.100.128/25");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("192.168.100.128/25");
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
						id: cidr().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("192.0.2.0/24");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("192.0.2.0/24");
				}
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: cidr().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("192.0.2.0/24");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("192.0.2.0/24");
				}
			});

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: cidr().notNull().default("192.168.100.128/25"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("192.0.2.0/24");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("192.0.2.0/24");
				}
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: cidr().notNull().default("192.168.100.128/25"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("192.0.2.0/24");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("192.0.2.0/24");
				}
			});

			test("parses CIDRs (IPv4 and IPv6)", () => {
				const tbl = table({
					columns: {
						id: cidr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("192.168.0.0/16").success).toBe(true);
				expect(schema.safeParse("10.0.0.0/8").success).toBe(true);
				expect(schema.safeParse("172.16.0.0/12").success).toBe(true);
				expect(schema.safeParse("10.10.0.0/23").success).toBe(true);
				expect(schema.safeParse("192.168.1.0/24").success).toBe(true);
				expect(schema.safeParse("2001:db8::/32").success).toBe(true);
				expect(schema.safeParse("fd00::/8").success).toBe(true);
				expect(schema.safeParse("fe80::/10").success).toBe(true);
				expect(schema.safeParse("2001:0db8:85a3::/48").success).toBe(true);
				expect(schema.safeParse("2607:f0d0:1002:51::/64").success).toBe(true);
			});

			test("does not parse invalid CIDR", () => {
				const tbl = table({
					columns: {
						id: cidr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(false);
				expect(schema.safeParse("256.1.1.1").success).toBe(false);
				expect(schema.safeParse(" 192.0.2.0/24").success).toBe(false);
				expect(schema.safeParse("::8/129").success).toBe(false);
				expect(schema.safeParse("2001:4f8:3:ba::/129").success).toBe(false);
			});

			test("does not parse CIDR with nonzero bits to the right of the netmask", () => {
				const tbl = table({
					columns: {
						id: cidr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				expect(schema.safeParse("192.168.0.1/16").success).toBe(false);
				expect(schema.safeParse("10.0.1.255/8").success).toBe(false);
				expect(schema.safeParse("172.16.255.128/12").success).toBe(false);
				expect(schema.safeParse("192.168.1.128/24").success).toBe(false);
				expect(schema.safeParse("10.10.1.1/23").success).toBe(false);
				expect(schema.safeParse("2001:db8::1/64").success).toBe(false);
				expect(schema.safeParse("2001:db8::1234/32").success).toBe(false);
				expect(
					schema.safeParse("fd00:abcd:ef01:2345:6789:abcd:ef01:2345/8").success,
				).toBe(false);
				expect(schema.safeParse("fe80:0000:0000:0001::1/10").success).toBe(
					false,
				);
				expect(
					schema.safeParse("2001:0db8:85a3:0000:0000:8a2e:0370:7334/48")
						.success,
				).toBe(false);
				expect(
					schema.safeParse("2607:f0d0:1002:51::dead:beef/64").success,
				).toBe(false);
			});

			//
			test("parses null", () => {
				const tbl = table({
					columns: {
						id: cidr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: cidr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("does not parse other types", () => {
				const tbl = table({
					columns: {
						id: cidr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: cidr().default("192.168.0.0/24"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("192.168.0.0/24").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: cidr().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("192.168.0.0/24").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: cidr().notNull().default("192.168.0.0/24"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("192.168.0.0/24").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string with primary key", () => {
				const tbl = table({
					columns: {
						id: cidr(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: cidr(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: cidr(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("192.168.0.0/24").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: cidr().default("192.168.0.0/24"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("192.168.0.0/24").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: cidr().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("192.168.0.0/24").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: cidr().default("192.168.0.0/24").notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("192.168.0.0/24").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: cidr().notNull(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: cidr(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: cidr().notNull(),
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
						id: cidr(),
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

			test("not a valid cidr", () => {
				const tbl = table({
					columns: {
						id: cidr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse("192.23");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_string",
							path: [],
							message: "Invalid cidr",
							validation: "regex",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});

			test("Value has bits set to right of mask", () => {
				const tbl = table({
					columns: {
						id: cidr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse("10.10.1.1/23");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Invalid cidr. Value has bits set to right of mask",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const anotherResult = schema.safeParse("2001:db8::1/64");
				expect(anotherResult.success).toBe(false);
				if (!anotherResult.success) {
					const expected = [
						{
							code: "custom",
							path: [],
							message: "Invalid cidr. Value has bits set to right of mask",
						},
					];
					expect(anotherResult.error.errors).toStrictEqual(expected);
				}
			});
		});
	});
});

describe("macaddr", () => {
	test("returns a PgMacaddr instance", () => {
		const column = macaddr();
		expect(column).toBeInstanceOf(PgMacaddr);
	});

	describe("PgMacaddr", () => {
		test("inherits from PgColumn", () => {
			expect(macaddr()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to macaddr", () => {
			const info = Object.fromEntries(Object.entries(macaddr())).info;
			expect(info.dataType).toBe("macaddr");
		});

		test("default with string", () => {
			const column = macaddr().default("08:00:2b:01:02:03");
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.defaultValue).toBe("c14cc2c9:'08:00:2b:01:02:03'::macaddr");
		});

		test("default with expression", () => {
			const column = macaddr();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`'08:00:2b:01:02:03'::macaddr`);
			expect(info.defaultValue).toBe("c14cc2c9:'08:00:2b:01:02:03'::macaddr");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = macaddr() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = macaddr() as any;
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
						id: macaddr(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: macaddr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				const result = schema.safeParse("08:00:2b:01:02:03");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("08:00:2b:01:02:03");
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
						id: macaddr().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("08:00:2b:01:02:03");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("08:00:2b:01:02:03");
				}
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: macaddr().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("08:00:2b:01:02:03");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("08:00:2b:01:02:03");
				}
			});

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: macaddr().notNull().default("08:00:2b:01:02:03"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("08:00:2b:01:02:03");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("08:00:2b:01:02:03");
				}
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: macaddr().notNull().default("08:00:2b:01:02:03"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("08:00:2b:01:02:03");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("08:00:2b:01:02:03");
				}
			});

			test("parses 48 bit mac addresses", () => {
				const tbl = table({
					columns: {
						id: macaddr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("08:00:2b:01:02:03").success).toBe(true);
				expect(schema.safeParse("08-00-2b-01-02-03").success).toBe(true);
			});

			test("does not parse invalid 48 bit mac addresses", () => {
				const tbl = table({
					columns: {
						id: macaddr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(false);
				expect(schema.safeParse("256.1.1.1").success).toBe(false);
				expect(schema.safeParse("08:00:2b:01:02").success).toBe(false);
				expect(schema.safeParse("08:00:2b:01:02:03:04:05").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: macaddr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: macaddr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("does not parse other types", () => {
				const tbl = table({
					columns: {
						id: macaddr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: macaddr().default("08:00:2b:01:02:03"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("08:00:2b:01:02:03").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: macaddr().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("08:00:2b:01:02:03").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: macaddr().notNull().default("08:00:2b:01:02:03"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("08:00:2b:01:02:03").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string with primary key", () => {
				const tbl = table({
					columns: {
						id: macaddr(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: macaddr(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: macaddr(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("08:00:2b:01:02:03").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: macaddr().default("08:00:2b:01:02:03"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("08:00:2b:01:02:03").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: macaddr().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("08:00:2b:01:02:03").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: macaddr().default("08:00:2b:01:02:03").notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("08:00:2b:01:02:03").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: macaddr().notNull(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: macaddr(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: macaddr().notNull(),
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
						id: macaddr(),
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

			test("not a valid mac address", () => {
				const tbl = table({
					columns: {
						id: macaddr(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse("192.23");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_string",
							path: [],
							message: "Invalid macaddr",
							validation: "regex",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
		});
	});
});

describe("macaddr8", () => {
	test("returns a PgMacaddr8 instance", () => {
		const column = macaddr8();
		expect(column).toBeInstanceOf(PgMacaddr8);
	});

	describe("PgMacaddr8", () => {
		test("inherits from PgColumn", () => {
			expect(macaddr8()).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to macaddr8", () => {
			const info = Object.fromEntries(Object.entries(macaddr8())).info;
			expect(info.dataType).toBe("macaddr8");
		});

		test("default with string", () => {
			const column = macaddr8().default("08:00:2b:01:02:03:04:05");
			const info = Object.fromEntries(Object.entries(column)).info;

			expect(info.defaultValue).toBe(
				"d2247d08:'08:00:2b:01:02:03:04:05'::macaddr8",
			);
		});

		test("default with expression", () => {
			const column = macaddr8();
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`'08:00:2b:01:02:03:04:05'::macaddr8`);
			expect(info.defaultValue).toBe(
				"d2247d08:'08:00:2b:01:02:03:04:05'::macaddr8",
			);
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = macaddr8() as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = macaddr8() as any;
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
						id: macaddr8(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string, null or undefined", () => {
				const tbl = table({
					columns: {
						id: macaddr8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | null | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				const result = schema.safeParse("08:00:2b:01:02:03:04:05");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("08:00:2b:01:02:03:04:05");
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
						id: macaddr8().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("08:00:2b:01:02:03:04:05");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("08:00:2b:01:02:03:04:05");
				}
			});

			test("output type is string with notNull", () => {
				const tbl = table({
					columns: {
						id: macaddr8().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("08:00:2b:01:02:03:04:05");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("08:00:2b:01:02:03:04:05");
				}
			});

			test("input type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: macaddr8().notNull().default("08:00:2b:01:02:03:04:05"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("08:00:2b:01:02:03:04:05");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("08:00:2b:01:02:03:04:05");
				}
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: macaddr8().notNull().default("08:00:2b:01:02:03:04:05"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
				const result = schema.safeParse("08:00:2b:01:02:03:04:05");
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data).toBe("08:00:2b:01:02:03:04:05");
				}
			});

			test("parses 64 bit mac addresses", () => {
				const tbl = table({
					columns: {
						id: macaddr8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("08:00:2b:01:02:03:04:05").success).toBe(true);
				expect(schema.safeParse("08-00-2b-01-02-03-04-05").success).toBe(true);
			});

			test("does not parse invalid mac 64 bit addresses", () => {
				const tbl = table({
					columns: {
						id: macaddr8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("hello").success).toBe(false);
				expect(schema.safeParse("256.1.1.1").success).toBe(false);
				expect(schema.safeParse("08:00:2b:01:02").success).toBe(false);
				expect(schema.safeParse("08:00:2b:01:02:05").success).toBe(false);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: macaddr8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: macaddr8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("does not parse other types", () => {
				const tbl = table({
					columns: {
						id: macaddr8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: macaddr8().default("08:00:2b:01:02:03:04:05"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("08:00:2b:01:02:03:04:05").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: macaddr8().notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("08:00:2b:01:02:03:04:05").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: macaddr8().notNull().default("08:00:2b:01:02:03:04:05"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("08:00:2b:01:02:03:04:05").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is string with primary key", () => {
				const tbl = table({
					columns: {
						id: macaddr8(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string", () => {
				const tbl = table({
					columns: {
						id: macaddr8(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: macaddr8(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("08:00:2b:01:02:03:04:05").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: macaddr8().default("08:00:2b:01:02:03:04:05"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("08:00:2b:01:02:03:04:05").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: macaddr8().notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("08:00:2b:01:02:03:04:05").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: macaddr8().default("08:00:2b:01:02:03:04:05").notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("08:00:2b:01:02:03:04:05").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: macaddr8().notNull(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: macaddr8(),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: macaddr8().notNull(),
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
						id: macaddr8(),
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

			test("not a valid mac address", () => {
				const tbl = table({
					columns: {
						id: macaddr8(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				const result = schema.safeParse("192.23");
				expect(result.success).toBe(false);
				if (!result.success) {
					const expected = [
						{
							code: "invalid_string",
							path: [],
							message: "Invalid macaddr8",
							validation: "regex",
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}
			});
		});
	});
});

describe("generic column", () => {
	test("returns a PgGenericColumn instance", () => {
		const column = columnWithType("money");
		expect(column).toBeInstanceOf(pgColumnWithType);
	});

	describe("PgGenericColumn", () => {
		test("inherits from PgColumn", () => {
			expect(columnWithType("money")).toBeInstanceOf(PgColumn);
		});

		test("dataType is set to constructor", () => {
			const info = Object.fromEntries(
				Object.entries(columnWithType("money")),
			).info;
			expect(info.dataType).toBe("money");
		});

		test("default with expression", () => {
			const column = columnWithType("money");
			const info = Object.fromEntries(Object.entries(column)).info;

			column.default(sql`'12.34'::float8::numeric::money`);
			expect(info.defaultValue).toBe(
				"2523bc04:'12.34'::float8::numeric::money",
			);
			expect(info.volatileDefault).toBe("unknown");
		});

		test("does not have generatedAlwaysAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = columnWithType("money") as any;
			expect(typeof column.generatedAlwaysAsIdentity === "function").toBe(
				false,
			);
		});

		test("does not have generatedByDefaultAsIdentity", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const column = columnWithType("money") as any;
			expect(typeof column.generatedByDefaultAsIdentity === "function").toBe(
				false,
			);
		});

		test("select and insert types are unknown by default", () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const column = columnWithType("money");

			type ExpectedType = pgColumnWithType<unknown, unknown>;
			type ColumnType = typeof column;
			const isEqual: Expect<Equal<ColumnType, ExpectedType>> = true;
			expect(isEqual).toBe(true);
		});

		test("select and insert types can be customized", () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const column = columnWithType<string>("money");

			type ExpectedType = pgColumnWithType<string, string>;
			type ColumnType = typeof column;
			const isEqual: Expect<Equal<ColumnType, ExpectedType>> = true;
			expect(isEqual).toBe(true);

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const anotherColumn = columnWithType<number, number>("money");
			const isEqualAnother: Expect<
				Equal<typeof anotherColumn, pgColumnWithType<number, number>>
			> = true;
			expect(isEqualAnother).toBe(true);
		});
	});

	describe("zod", () => {
		describe("by default", () => {
			test("input type is any without type", () => {
				const tbl = table({
					columns: {
						id: columnWithType("money"),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				type Expected = any;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});
			test("output type is any without type", () => {
				const tbl = table({
					columns: {
						id: columnWithType("money"),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.output<typeof schema>;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				type Expected = any;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("input type is any without type", () => {
				const tbl = table({
					columns: {
						id: columnWithType("money"),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				type Expected = any;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("input type is defined type, null or undefined", () => {
				const tbl = table({
					columns: {
						id: columnWithType<number>("money"),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number | null | undefined;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is defined type, null or undefined", () => {
				const tbl = table({
					columns: {
						id: columnWithType<number>("money"),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number | null | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("input type is defined type with notNull", () => {
				const tbl = table({
					columns: {
						id: columnWithType<number>("money").notNull(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is defined type with notNull", () => {
				const tbl = table({
					columns: {
						id: columnWithType<number>("money").notNull(),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("input type is defined type or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: columnWithType<string>("money")
							.notNull()
							.default(sql`'12.34'::float8::numeric::money`),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InputType = z.input<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<InputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is string or undefined with notNull and default", () => {
				const tbl = table({
					columns: {
						id: columnWithType<string>("money")
							.notNull()
							.default(sql`'12.34'::float8::numeric::money`),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = string | undefined;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("parses null", () => {
				const tbl = table({
					columns: {
						id: columnWithType<string>("money"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("does not parse explicit undefined", () => {
				const tbl = table({
					columns: {
						id: columnWithType<string>("money"),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse(undefined).success).toBe(false);
				const tableSchema = zodSchema(tbl);
				expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
				expect(tableSchema.safeParse({}).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const tbl = table({
					columns: {
						id: columnWithType<string>("money").default(
							sql`'12.34'::float8::numeric::money`,
						),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("12.35").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: columnWithType<string>("money").notNull(),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("12.35").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable", () => {
				const tbl = table({
					columns: {
						id: columnWithType<string>("money")
							.notNull()
							.default(sql`'12.34'::float8::numeric::money`),
					},
				});
				const schema = zodSchema(tbl).shape.id;
				expect(schema.safeParse("12.35").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("input type is defined type with primary key", () => {
				const tbl = table({
					columns: {
						id: columnWithType<number>("money"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type InpuType = z.input<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<InpuType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("output type is defined type", () => {
				const tbl = table({
					columns: {
						id: columnWithType<number>("money"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const schema = zodSchema(tbl).shape.id;
				type OutputType = z.output<typeof schema>;
				type Expected = number;
				const isEqual: Expect<Equal<OutputType, Expected>> = true;
				expect(isEqual).toBe(true);
			});

			test("is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: columnWithType<number>("money"),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = number;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = number;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse(12.23).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: columnWithType<string>("money").default(
							sql`'12.34'::float8::numeric::money`,
						),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("12.23").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const tbl = table({
					columns: {
						id: columnWithType<string>("money").notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("12.55").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const tbl = table({
					columns: {
						id: columnWithType<string>("money")
							.default(sql`'12.34'::float8::numeric::money`)
							.notNull(),
					},
					constraints: {
						primaryKey: primaryKey(["id"]),
					},
				});
				const schema = zodSchema(tbl).shape.id;

				type InputType = z.input<typeof schema>;
				type ExpectedInputType = string | undefined;
				const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
				expect(isEqualInput).toBe(true);
				type OutputType = z.output<typeof schema>;
				type ExpectedOutputType = string | undefined;
				const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> =
					true;
				expect(isEqualOutput).toBe(true);

				expect(schema.safeParse("23.32").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});
		});

		describe("errors", () => {
			test("undefined", () => {
				const tbl = table({
					columns: {
						id: columnWithType<string>("money").notNull(),
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

			test("explicit undefined", () => {
				const tbl = table({
					columns: {
						id: columnWithType<string>("money"),
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
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(result.error.errors).toStrictEqual(expected);
				}

				const tableSchema = zodSchema(tbl);
				const tableResult = tableSchema.safeParse({ id: undefined });
				expect(tableResult.success).toBe(false);
				if (!tableResult.success) {
					const expected = [
						{
							code: "custom",
							path: ["id"],
							message: "Value cannot be undefined",
							fatal: true,
						},
					];
					expect(tableResult.error.errors).toStrictEqual(expected);
				}
			});

			test("null", () => {
				const tbl = table({
					columns: {
						id: columnWithType<string>("money").notNull(),
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
							message: "Expected value, received null",
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

		test("identity is null", (context: ColumnContext) => {
			expect(context.columnInfo.identity).toBe(null);
		});
	});
}
