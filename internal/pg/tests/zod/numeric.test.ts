/* eslint-disable max-lines */
import { Equal, Expect } from "type-testing";
import { assert, describe, expect, test } from "vitest";
import z from "zod";
import { numeric } from "~pg/schema/column/data-types/numeric.js";
import { primaryKey } from "~pg/schema/primary-key.js";
import { table } from "~pg/schema/table.js";
import { zodSchema } from "~pg/zod/zod_schema.js";

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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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

describe("schema composition", () => {
	test("optional column can be required on another schema", () => {
		const tbl = table({
			columns: {
				id: numeric(),
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
		type RequiredSchemaExpectedOutput = { id: string | null };
		const requiredSchemaIsEqualOutput: Expect<
			Equal<RequiredSchemaOutput, RequiredSchemaExpectedOutput>
		> = true;
		expect(requiredSchemaIsEqualOutput).toBe(true);
	});
});
