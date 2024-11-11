/* eslint-disable max-lines */
import { jsonb } from "@monorepo/pg/schema/column/data-types/jsonb.js";
import type { JsonValue } from "@monorepo/pg/schema/column/types.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { table } from "@monorepo/pg/schema/table.js";
import { zodSchema } from "src/zod_schema.js";
import { Equal, Expect } from "type-testing";
import { assert, describe, expect, test } from "vitest";
import z from "zod";

describe("by default", () => {
	test("input type is string, number, boolean, Record<string, any>, null, or undefined", () => {
		const tbl = table({
			columns: {
				id: jsonb(),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InpuType = z.input<typeof schema>;
		type Expected = JsonValue | null | undefined;
		const isEqual: Expect<Equal<InpuType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is string, number, boolean, Record<string, any>, null, or undefined", () => {
		const tbl = table({
			columns: {
				id: jsonb(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;
		type Expected = JsonValue | null | undefined;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);

		const objectResult = schema.safeParse({ a: 1 });
		expect(objectResult.success).toBe(true);
		if (objectResult.success) {
			expect(objectResult.data).toEqual({ a: 1 });
		}
		const numberResult = schema.safeParse(1);
		expect(numberResult.success).toBe(true);
		if (numberResult.success) {
			expect(numberResult.data).toEqual(1);
		}
		const stringResult = schema.safeParse("10");
		expect(stringResult.success).toBe(true);
		if (stringResult.success) {
			expect(stringResult.data).toBe("10");
		}
		const nullResult = schema.safeParse(null);
		expect(nullResult.success).toBe(true);
	});

	test("input type is string, number, boolean, Record<string, any> with notNull", () => {
		const tbl = table({
			columns: {
				id: jsonb().notNull(),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type Expected = JsonValue;
		const isEqual: Expect<Equal<InputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is string, number, boolean, Record<string, any> with notNull", () => {
		const tbl = table({
			columns: {
				id: jsonb().notNull(),
			},
		});

		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;

		type Expected = JsonValue;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);

		const objectResult = schema.safeParse({ a: 1 });
		expect(objectResult.success).toBe(true);
		if (objectResult.success) {
			expect(objectResult.data).toEqual({ a: 1 });
		}
		const numberResult = schema.safeParse(1);
		expect(numberResult.success).toBe(true);
		if (numberResult.success) {
			expect(numberResult.data).toEqual(1);
		}
		const stringResult = schema.safeParse("10");
		expect(stringResult.success).toBe(true);
		if (stringResult.success) {
			expect(stringResult.data).toBe("10");
		}
		const nullResult = schema.safeParse(null);
		expect(nullResult.success).toBe(false);
	});

	test("input type is string, number, boolean, Record<string, any>, or undefined with notNull and default", () => {
		const tbl = table({
			columns: {
				id: jsonb().notNull().default({ a: 1 }),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type Expected = JsonValue | undefined;
		const isEqual: Expect<Equal<InputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is string, number, boolean, Record<string, any>, or undefined with notNull and undefined", () => {
		const tbl = table({
			columns: {
				id: jsonb().notNull().default({ a: 1 }),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;

		type Expected = JsonValue | undefined;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);

		const objectResult = schema.safeParse({ a: 1 });
		expect(objectResult.success).toBe(true);
		if (objectResult.success) {
			expect(objectResult.data).toEqual({ a: 1 });
		}
		const numberResult = schema.safeParse(1);
		expect(numberResult.success).toBe(true);
		if (numberResult.success) {
			expect(numberResult.data).toEqual(1);
		}
		const stringResult = schema.safeParse("10");
		expect(stringResult.success).toBe(true);
		if (stringResult.success) {
			expect(stringResult.data).toBe("10");
		}
		const nullResult = schema.safeParse(null);
		expect(nullResult.success).toBe(false);
	});

	test("parses strings that can be coerced into JSON objects", () => {
		const tbl = table({
			columns: {
				id: jsonb(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse("12").success).toBe(true);
		expect(schema.safeParse('{"foo": "bar"}').success).toBe(true);
		expect(schema.safeParse('{"foo"}').success).toBe(false);
		expect(schema.safeParse("foo").success).toBe(false);
	});

	test("parses numbers", () => {
		const tbl = table({
			columns: {
				id: jsonb(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse(1).success).toBe(true);
		expect(schema.safeParse(10.123).success).toBe(true);
	});

	test("parses boolean", () => {
		const tbl = table({
			columns: {
				id: jsonb(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse(true).success).toBe(true);
	});

	test("parses null", () => {
		const tbl = table({
			columns: {
				id: jsonb(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse(null).success).toBe(true);
	});

	test("parses objects", () => {
		const tbl = table({
			columns: {
				id: jsonb(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse({ a: 1 }).success).toBe(true);
	});

	test("does not parse explicit undefined", () => {
		const tbl = table({
			columns: {
				id: jsonb(),
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
				id: jsonb().default("1"),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse({ a: 1 }).success).toBe(true);
		expect(schema.safeParse(null).success).toBe(true);
	});

	test("with notNull is non nullable and required", () => {
		const tbl = table({
			columns: {
				id: jsonb().notNull(),
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
				id: jsonb().notNull().default("1"),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse("2").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});
});

describe("as primary key", () => {
	test("input type is string, number, boolean, or Record<string, any>", () => {
		const tbl = table({
			columns: {
				id: jsonb(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InpuType = z.input<typeof schema>;
		type Expected = JsonValue;
		const isEqual: Expect<Equal<InpuType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is JsonArray, JsonObject, JsonPrimitive", () => {
		const tbl = table({
			columns: {
				id: jsonb(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;

		type Expected = JsonValue;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("is non nullable and required", () => {
		const tbl = table({
			columns: {
				id: jsonb(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		const schema = zodSchema(tbl).shape.id;

		type InputType = z.input<typeof schema>;
		type ExpectedInputType = JsonValue;
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);
		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = JsonValue;
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);

		expect(schema.safeParse("1").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with default value is non nullable and optional", () => {
		const tbl = table({
			columns: {
				id: jsonb().default("1"),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		const schema = zodSchema(tbl).shape.id;

		type InputType = z.input<typeof schema>;
		type ExpectedInputType = JsonValue | undefined;
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);
		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = JsonValue | undefined;
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);

		expect(schema.safeParse("2").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with notNull is non nullable and required", () => {
		const tbl = table({
			columns: {
				id: jsonb().notNull(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		const schema = zodSchema(tbl).shape.id;

		type InputType = z.input<typeof schema>;
		type ExpectedInputType = JsonValue;
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);
		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = JsonValue;
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);

		expect(schema.safeParse("1").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with default and notNull is non nullable and optional", () => {
		const tbl = table({
			columns: {
				id: jsonb().notNull().default("1"),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		const schema = zodSchema(tbl).shape.id;

		type InputType = z.input<typeof schema>;
		type ExpectedInputType = JsonValue | undefined;
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);
		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = JsonValue | undefined;
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);

		expect(schema.safeParse("2").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});
});

describe("with custom data type", () => {
	type Data = {
		count: number;
		name: string;
	};
	test("input type is custom data type, null, or undefined", () => {
		const tbl = table({
			columns: {
				id: jsonb<Data>(),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type Expected = Data | null | undefined;
		const isEqual: Expect<Equal<InputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is custom data type, null or undefined", () => {
		const tbl = table({
			columns: {
				id: jsonb<Data>(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;
		type Expected = Data | null | undefined;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);

		const objectResult = schema.safeParse({ count: 1, name: "example" });
		expect(objectResult.success).toBe(true);
		if (objectResult.success) {
			expect(objectResult.data).toEqual({ count: 1, name: "example" });
		}
		const arrayObjectResult = schema.safeParse({
			count: 1,
			name: "example",
		});
		expect(arrayObjectResult.success).toBe(true);
		if (arrayObjectResult.success) {
			expect(arrayObjectResult.data).toEqual({ count: 1, name: "example" });
		}
		const nullResult = schema.safeParse(null);
		expect(nullResult.success).toBe(true);
	});

	test("input type is custom data type with notNull", () => {
		const tbl = table({
			columns: {
				id: jsonb<Data>().notNull(),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type Expected = Data;
		const isEqual: Expect<Equal<InputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is custom data type with notNull", () => {
		const tbl = table({
			columns: {
				id: jsonb<Data>().notNull(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;
		type Expected = Data;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);

		const objectResult = schema.safeParse({ count: 1, name: "example" });
		expect(objectResult.success).toBe(true);
		if (objectResult.success) {
			expect(objectResult.data).toEqual({ count: 1, name: "example" });
		}
		const nullResult = schema.safeParse(null);
		expect(nullResult.success).toBe(false);
	});

	test("input type is custom data type, or undefined with notNull and default", () => {
		const tbl = table({
			columns: {
				id: jsonb<Data>().notNull().default({ count: 1, name: "example" }),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type Expected = Data | undefined;
		const isEqual: Expect<Equal<InputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is custom data type, or undefined with notNull and default", () => {
		const tbl = table({
			columns: {
				id: jsonb<Data>().notNull().default({ count: 1, name: "example" }),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;

		type Expected = Data | undefined;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);

		const objectResult = schema.safeParse({ count: 2, name: "example" });
		expect(objectResult.success).toBe(true);
		if (objectResult.success) {
			expect(objectResult.data).toEqual({ count: 2, name: "example" });
		}
		const nullResult = schema.safeParse(null);
		expect(nullResult.success).toBe(false);
	});

	test("parses null", () => {
		const tbl = table({
			columns: {
				id: jsonb<Data>(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse(null).success).toBe(true);
	});

	test("parses objects", () => {
		const tbl = table({
			columns: {
				id: jsonb<Data>(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse({ count: 1, name: "example" }).success).toBe(true);
	});

	test("does not parse explicit undefined", () => {
		const tbl = table({
			columns: {
				id: jsonb<Data>(),
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
				id: jsonb<Data>().default({ count: 1, name: "example" }),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse({ count: 2, name: "example" }).success).toBe(true);
		expect(schema.safeParse(null).success).toBe(true);
	});

	test("with notNull is non nullable and required", () => {
		const tbl = table({
			columns: {
				id: jsonb<Data>().notNull(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse({ count: 1, name: "example" }).success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with default and notNull is non nullable", () => {
		const tbl = table({
			columns: {
				id: jsonb<Data>().notNull().default({ count: 1, name: "example" }),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse({ count: 2, name: "example" }).success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});
});

describe("errors", () => {
	test("undefined", () => {
		const tbl = table({
			columns: {
				id: jsonb().notNull(),
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
				id: jsonb(),
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
				id: jsonb().notNull(),
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
						"Expected value that can be converted to JSON, received null",
					fatal: true,
				},
			];
			expect(result.error.errors).toStrictEqual(expected);
		}
	});

	test("not an json", () => {
		const tbl = table({
			columns: {
				id: jsonb(),
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
					message: "Invalid JSON",
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
				id: jsonb(),
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
			id: JsonValue | null;
		};
		const requiredSchemaIsEqualInput: Expect<
			Equal<RequiredSchemaInput, RequiredSchemaExpectedInput>
		> = true;
		expect(requiredSchemaIsEqualInput).toBe(true);

		type RequiredSchemaOutput = z.output<typeof requiredSchema>;
		type RequiredSchemaExpectedOutput = { id: JsonValue | null };
		const requiredSchemaIsEqualOutput: Expect<
			Equal<RequiredSchemaOutput, RequiredSchemaExpectedOutput>
		> = true;
		expect(requiredSchemaIsEqualOutput).toBe(true);
	});
});
