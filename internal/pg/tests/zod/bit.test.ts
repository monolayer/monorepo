/* eslint-disable max-lines */
import { sql } from "kysely";
import { Equal, Expect } from "type-testing";
import { assert, describe, expect, test } from "vitest";
import z from "zod";
import { bit } from "~pg/schema/column/data-types/bit.js";
import { primaryKey } from "~pg/schema/primary-key.js";
import { table } from "~pg/schema/table.js";
import { zodSchema } from "~pg/zod/zod_schema.js";

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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
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

describe("schema composition", () => {
	test("optional column can be required on another schema", () => {
		const tbl = table({
			columns: {
				id: bit(),
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
				code: "invalid_type",
				expected: "string",
				received: "undefined",
				message: "Required",
				path: ["id"],
			},
		]);

		type RequiredSchemaInput = z.input<typeof requiredSchema>;
		type RequiredSchemaExpectedInput = {
			id: string | null;
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
