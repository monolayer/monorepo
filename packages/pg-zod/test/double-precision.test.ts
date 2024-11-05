/* eslint-disable max-lines */
import { doublePrecision } from "@monorepo/pg/schema/column/data-types/double-precision.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { table } from "@monorepo/pg/schema/table.js";
import { zodSchema } from "src/zod_schema.js";
import { Equal, Expect } from "type-testing";
import { describe, expect, test } from "vitest";
import z from "zod";

const tenCentillionBitInt =
	100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000n;

const elevenCentillionBitInt =
	1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000n;

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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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

	describe("schema composition", () => {
		test("optional column can be required on another schema", () => {
			const tbl = table({
				columns: {
					id: doublePrecision(),
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
				id?: string | number | bigint | null;
			};
			const requiredSchemaIsEqualInput: Expect<
				Equal<RequiredSchemaInput, RequiredSchemaExpectedInput>
			> = true;
			expect(requiredSchemaIsEqualInput).toBe(true);

			type RequiredSchemaOutput = z.output<typeof requiredSchema>;
			type RequiredSchemaExpectedOutput = { id: string | null };
			const requiredSchemaIsEqualOutput: Expect<
				Equal<RequiredSchemaOutput, RequiredSchemaExpectedOutput>
			> = true;
			expect(requiredSchemaIsEqualOutput).toBe(true);
		});
	});
});
