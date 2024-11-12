/* eslint-disable max-lines */
import { Equal, Expect } from "type-testing";
import { assert, describe, expect, test } from "vitest";
import z from "zod";
import { bigint } from "~pg/schema/column/data-types/bigint.js";
import { text } from "~pg/schema/column/data-types/text.js";
import { primaryKey } from "~pg/schema/primary-key.js";
import { table } from "~pg/schema/table.js";
import { zodSchema } from "~pg/zod/zod_schema.js";

describe("bigint", () => {
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
			type Expected = z.ZodOptional<z.ZodType<never, z.ZodTypeDef, never>>;
			const isEqual: Expect<Equal<SchemaType, Expected>> = true;
			expect(isEqual).toBe(true);

			const result = schema.safeParse(1);
			expect(result.success).toBe(false);
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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
			expect(isEqualOutput).toBe(true);

			expect(schema.safeParse(1n).success).toBe(true);
			expect(schema.safeParse(null).success).toBe(false);
			expect(schema.safeParse(undefined).success).toBe(false);
			expect(zodSchema(tbl).safeParse({}).success).toBe(true);
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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
					email: text().notNull(),
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

		test("passes parsing without value", () => {
			const tbl = table({
				columns: {
					id: bigint().generatedAlwaysAsIdentity(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const schema = zodSchema(tbl);
			const result = schema.safeParse({});
			assert(result.success);
		});

		test("fails parsing with value", () => {
			const tbl = table({
				columns: {
					id: bigint().generatedAlwaysAsIdentity(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const schema = zodSchema(tbl);
			const result = schema.safeParse({ id: 12 });
			assert(result.success === false);
			expect(result.error.formErrors.fieldErrors).toStrictEqual({
				id: ["Expected undefined, received number"],
			});
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

	describe("schema composition", () => {
		test("optional column can be required on another schema", () => {
			const tbl = table({
				columns: {
					id: bigint(),
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
});
