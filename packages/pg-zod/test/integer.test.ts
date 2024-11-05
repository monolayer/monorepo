/* eslint-disable max-lines */
import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { table } from "@monorepo/pg/schema/table.js";
import { zodSchema } from "src/zod_schema.js";
import { Equal, Expect } from "type-testing";
import { describe, expect, test } from "vitest";
import z from "zod";

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
		type Expected = z.ZodOptional<z.ZodType<never, z.ZodTypeDef, never>>;
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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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

describe("schema composition", () => {
	test("optional column can be required on another schema", () => {
		const tbl = table({
			columns: {
				id: integer(),
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
			id?: string | number | null;
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
