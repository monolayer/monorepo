/* eslint-disable max-lines */
import { real } from "@monorepo/pg/schema/column/data-types/real.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { table } from "@monorepo/pg/schema/table.js";
import { zodSchema } from "src/zod_schema.js";
import { Equal, Expect } from "type-testing";
import { assert, describe, expect, test } from "vitest";
import z from "zod";

const tenUnDecillionBigInt = 10000000000000000000000000000000000000n;
const eleventUnDecillionBigInt = 100000000000000000000000000000000000000n;

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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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

describe("schema composition", () => {
	test("optional column can be required on another schema", () => {
		const tbl = table({
			columns: {
				id: real(),
			},
		});
		const requiredSchema = z
			.object({})
			.extend({
				id: zodSchema(tbl).shape.id,
			})
			.required();
		const requiredSchemaResult = requiredSchema.safeParse({});
		expect(requiredSchemaResult.success).toBe(false);
		assert(requiredSchemaResult.success === false);
		expect(requiredSchemaResult.error?.errors).toStrictEqual([
			{
				code: "custom",
				fatal: true,
				message: "Required",
				path: ["id"],
			},
		]);

		type RequiredSchemaInput = z.input<typeof requiredSchema>;
		type RequiredSchemaExpectedInput = {
			id: string | number | bigint | null;
		};
		const requiredSchemaIsEqualInput: Expect<
			Equal<RequiredSchemaInput, RequiredSchemaExpectedInput>
		> = true;
		expect(requiredSchemaIsEqualInput).toBe(true);

		type RequiredSchemaOutput = z.output<typeof requiredSchema>;
		type RequiredSchemaExpectedOutput = { id: number | null };
		const requiredSchemaIsEqualOutput: Expect<
			Equal<RequiredSchemaOutput, RequiredSchemaExpectedOutput>
		> = true;
		expect(requiredSchemaIsEqualOutput).toBe(true);
	});
});
