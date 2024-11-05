/* eslint-disable max-lines */
import { date } from "@monorepo/pg/schema/column/data-types/date.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { table } from "@monorepo/pg/schema/table.js";
import { zodSchema } from "src/zod_schema.js";
import { Equal, Expect } from "type-testing";
import { describe, expect, test } from "vitest";
import z from "zod";

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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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

	describe("schema composition", () => {
		test("optional column can be required on another schema", () => {
			const tbl = table({
				columns: {
					id: date(),
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
				id?: string | Date | null;
			};
			const requiredSchemaIsEqualInput: Expect<
				Equal<RequiredSchemaInput, RequiredSchemaExpectedInput>
			> = true;
			expect(requiredSchemaIsEqualInput).toBe(true);

			type RequiredSchemaOutput = z.output<typeof requiredSchema>;
			type RequiredSchemaExpectedOutput = { id: Date | null };
			const requiredSchemaIsEqualOutput: Expect<
				Equal<RequiredSchemaOutput, RequiredSchemaExpectedOutput>
			> = true;
			expect(requiredSchemaIsEqualOutput).toBe(true);
		});
	});
});
