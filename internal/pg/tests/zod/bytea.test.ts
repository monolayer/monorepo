/* eslint-disable max-lines */
import { Equal, Expect } from "type-testing";
import { assert, describe, expect, test } from "vitest";
import z from "zod";
import { bytea } from "~pg/schema/column/data-types/bytea.js";
import { primaryKey } from "~pg/schema/primary-key.js";
import { table } from "~pg/schema/table.js";
import { zodSchema } from "~pg/zod/zod_schema.js";

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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
			const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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

	describe("schema composition", () => {
		test("optional column can be required on another schema", () => {
			const tbl = table({
				columns: {
					id: bytea(),
				},
			});
			const requiredSchema = z
				.object({
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
				id: string | Buffer | null;
			};
			const requiredSchemaIsEqualInput: Expect<
				Equal<RequiredSchemaInput, RequiredSchemaExpectedInput>
			> = true;
			expect(requiredSchemaIsEqualInput).toBe(true);

			type RequiredSchemaOutput = z.output<typeof requiredSchema>;
			type RequiredSchemaExpectedOutput = {
				id: string | Buffer | null;
			};
			const requiredSchemaIsEqualOutput: Expect<
				Equal<RequiredSchemaOutput, RequiredSchemaExpectedOutput>
			> = true;
			expect(requiredSchemaIsEqualOutput).toBe(true);
		});
	});
});
