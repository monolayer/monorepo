/* eslint-disable max-lines */
import { bigserial } from "@monorepo/pg/schema/column/data-types/bigserial.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { table } from "@monorepo/pg/schema/table.js";
import { zodSchema } from "src/zod_schema.js";
import { Equal, Expect } from "type-testing";
import { describe, expect, test } from "vitest";
import z from "zod";

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

describe("schema composition", () => {
	test("optional column can be required on another schema", () => {
		const tbl = table({
			columns: {
				id: bigserial(),
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
			id?: string | number | bigint;
		};
		const requiredSchemaIsEqualInput: Expect<
			Equal<RequiredSchemaInput, RequiredSchemaExpectedInput>
		> = true;
		expect(requiredSchemaIsEqualInput).toBe(true);

		type RequiredSchemaOutput = z.output<typeof requiredSchema>;
		type RequiredSchemaExpectedOutput = {
			id: string;
		};
		const requiredSchemaIsEqualOutput: Expect<
			Equal<RequiredSchemaOutput, RequiredSchemaExpectedOutput>
		> = true;
		expect(requiredSchemaIsEqualOutput).toBe(true);
	});
});
