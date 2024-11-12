/* eslint-disable max-lines */
import { Equal, Expect } from "type-testing";
import { assert, describe, expect, test } from "vitest";
import z from "zod";
import { serial } from "~pg/schema/column/data-types/serial.js";
import { primaryKey } from "~pg/schema/primary-key.js";
import { table } from "~pg/schema/table.js";
import { zodSchema } from "~pg/zod/zod_schema.js";

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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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

describe("schema composition", () => {
	test("optional column can be required on another schema", () => {
		const tbl = table({
			columns: {
				id: serial(),
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
			id: string | number;
		};
		const requiredSchemaIsEqualInput: Expect<
			Equal<RequiredSchemaInput, RequiredSchemaExpectedInput>
		> = true;
		expect(requiredSchemaIsEqualInput).toBe(true);

		type RequiredSchemaOutput = z.output<typeof requiredSchema>;
		type RequiredSchemaExpectedOutput = { id: number };
		const requiredSchemaIsEqualOutput: Expect<
			Equal<RequiredSchemaOutput, RequiredSchemaExpectedOutput>
		> = true;
		expect(requiredSchemaIsEqualOutput).toBe(true);
	});
});
