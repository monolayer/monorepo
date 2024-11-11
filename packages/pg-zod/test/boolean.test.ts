/* eslint-disable max-lines */
import {
	boolean,
	type Boolish,
} from "@monorepo/pg/schema/column/data-types/boolean.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { table } from "@monorepo/pg/schema/table.js";
import { zodSchema } from "src/zod_schema.js";
import { Equal, Expect } from "type-testing";
import { assert, describe, expect, test } from "vitest";
import z from "zod";

describe("by default", () => {
	test("input type is boolean, Boolish, null or undefined", () => {
		const tbl = table({
			columns: {
				id: boolean(),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InpuType = z.input<typeof schema>;
		type Expected = boolean | Boolish | null | undefined;
		const isEqual: Expect<Equal<InpuType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is boolean, null or undefined", () => {
		const tb = table({
			columns: {
				id: boolean(),
			},
		});

		const schema = zodSchema(tb).shape.id;
		type OutputType = z.output<typeof schema>;
		type Expected = boolean | null | undefined;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		const booleanResult = schema.safeParse(true);
		expect(booleanResult.success).toBe(true);
		if (booleanResult.success) {
			expect(booleanResult.data).toBe(true);
		}
		const nullResult = schema.safeParse(null);
		expect(nullResult.success).toBe(true);
		if (nullResult.success) {
			expect(nullResult.data).toBe(null);
		}
		expect(isEqual).toBe(true);
	});

	test("input type is boolean, Boolish with notNull", () => {
		const tbl = table({
			columns: {
				id: boolean().notNull(),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type Expected = boolean | Boolish;
		const isEqual: Expect<Equal<InputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is boolean with notNull", () => {
		const tbl = table({
			columns: {
				id: boolean().notNull(),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;
		type Expected = boolean;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("input type is boolean, Boolish, and undefined with notNull and default", () => {
		const tbl = table({
			columns: {
				id: boolean().notNull().default(true),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type Expected = boolean | Boolish | undefined;
		const isEqual: Expect<Equal<InputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is boolean or undefined with notNull and default", () => {
		const tbl = table({
			columns: {
				id: boolean().notNull().default(true),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;
		type Expected = boolean | undefined;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("parses boolean", () => {
		const tbl = table({
			columns: {
				id: boolean(),
			},
		});

		const schema = zodSchema(tbl).shape.id;
		const result = schema.safeParse(true);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBe(true);
		}
	});

	test("parses null", () => {
		const tbl = table({
			columns: {
				id: boolean(),
			},
		});

		const schema = zodSchema(tbl).shape.id;
		const result = schema.safeParse(null);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBe(null);
		}
	});

	test("does not parse explicit undefined", () => {
		const tbl = table({
			columns: {
				id: boolean(),
			},
		});

		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse(undefined).success).toBe(false);
		const tableSchema = zodSchema(tbl);
		expect(tableSchema.safeParse({ id: undefined }).success).toBe(false);
		expect(tableSchema.safeParse({}).success).toBe(true);
	});

	test("parses with coercion with boolish values", () => {
		const column = boolean();
		const tbl = table({
			columns: {
				true: column,
				false: column,
				yes: column,
				no: column,
				one: column,
				zero: column,
				oneString: column,
				zeroString: column,
				on: column,
				off: column,
			},
		});
		const schema = zodSchema(tbl);
		const data = {
			true: "true",
			false: "false",
			yes: "yes",
			no: "no",
			one: 1,
			zero: 0,
			oneString: "1",
			zeroString: "0",
			on: "on",
			off: "off",
		};

		const result = schema.safeParse(data);

		expect(result.success).toBe(true);
		if (result.success) {
			const expected = {
				true: true,
				false: false,
				yes: true,
				no: false,
				one: true,
				zero: false,
				oneString: true,
				zeroString: false,
				on: true,
				off: false,
			};
			expect(result.data).toStrictEqual(expected);
		}
	});

	test("does not parse non boolish values", () => {
		const tbl = table({
			columns: {
				id: boolean(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse("TRUE").success).toBe(false);
		expect(schema.safeParse("FALSE").success).toBe(false);
		expect(schema.safeParse("undefined").success).toBe(false);
		expect(schema.safeParse("null").success).toBe(false);
		expect(schema.safeParse(2).success).toBe(false);
	});

	test("with default value is nullable and optional", () => {
		const tbl = table({
			columns: {
				id: boolean().default(true),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type ExpectedInputType = boolean | Boolish | null | undefined;
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);
		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = boolean | null | undefined;
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);

		expect(schema.safeParse(true).success).toBe(true);
		expect(schema.safeParse(null).success).toBe(true);
	});

	test("with notNull is non nullable and required", () => {
		const tbl = table({
			columns: {
				id: boolean().notNull(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type ExpectedInputType = boolean | Boolish;
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);
		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = boolean;
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);
		expect(schema.safeParse(true).success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with default and notNull is non nullable and optional", () => {
		const tbl = table({
			columns: {
				id: boolean().notNull().default(true),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type ExpectedInputType = boolean | Boolish | undefined;
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);
		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = boolean | undefined;
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);

		expect(schema.safeParse(true).success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});
});

describe("as primary key", () => {
	test("input type is boolean, Boolish", () => {
		const tbl = table({
			columns: {
				id: boolean(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InpuType = z.input<typeof schema>;
		type Expected = boolean | Boolish;
		const isEqual: Expect<Equal<InpuType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("input type is boolean", () => {
		const tbl = table({
			columns: {
				id: boolean(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;
		type Expected = boolean;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("is non nullable and required", () => {
		const tbl = table({
			columns: {
				id: boolean(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		const schema = zodSchema(tbl).shape.id;

		type InputType = z.input<typeof schema>;
		type ExpectedInputType = boolean | Boolish;
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);
		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = boolean;
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);

		expect(schema.safeParse(true).success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with default value is non nullable and optional", () => {
		const tbl = table({
			columns: {
				id: boolean().default(true),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		const schema = zodSchema(tbl).shape.id;

		type InputType = z.input<typeof schema>;
		type ExpectedInputType = boolean | Boolish | undefined;
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);

		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = boolean | undefined;
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);

		expect(schema.safeParse(true).success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with notNull is non nullable and required", () => {
		const tbl = table({
			columns: {
				id: boolean().notNull(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		const schema = zodSchema(tbl).shape.id;

		type InputType = z.input<typeof schema>;
		type ExpectedInputType = boolean | Boolish;
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);
		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = boolean;
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);

		expect(schema.safeParse(true).success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with default and notNull is non nullable and optional", () => {
		const tbl = table({
			columns: {
				id: boolean().notNull().default(true),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		const schema = zodSchema(tbl).shape.id;

		type InputType = z.input<typeof schema>;
		type ExpectedInputType = boolean | Boolish | undefined;
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);
		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = boolean | undefined;
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);

		expect(schema.safeParse(true).success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});
});

describe("errors", () => {
	test("explicit undefined", () => {
		const tbl = table({
			columns: {
				id: boolean(),
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

	test("undefined", () => {
		const tbl = table({
			columns: {
				id: boolean().notNull(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		const result = schema.safeParse(undefined);
		expect(result.success).toBe(false);
		if (!result.success) {
			const expected = [
				{
					code: "invalid_type",
					expected: "boolean",
					received: "undefined",
					path: [],
					message: "Required",
				},
			];
			expect(result.error.errors).toStrictEqual(expected);
		}
	});

	test("null", () => {
		const tbl = table({
			columns: {
				id: boolean().notNull(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		const result = schema.safeParse(null);
		expect(result.success).toBe(false);
		if (!result.success) {
			const expected = [
				{
					code: "invalid_type",
					expected: "boolean",
					received: "null",
					path: [],
					message: "Expected boolean, received null",
				},
			];
			expect(result.error.errors).toStrictEqual(expected);
		}
	});

	test("not a boolean", () => {
		const tbl = table({
			columns: {
				id: boolean(),
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
					message: "Invalid boolean",
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
				id: boolean(),
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
				expected: "boolean",
				received: "undefined",
				message: "Required",
				path: ["id"],
			},
		]);

		type RequiredSchemaInput = z.input<typeof requiredSchema>;
		type RequiredSchemaExpectedInput = {
			id: boolean | Boolish | null;
		};
		const requiredSchemaIsEqualInput: Expect<
			Equal<RequiredSchemaInput, RequiredSchemaExpectedInput>
		> = true;
		expect(requiredSchemaIsEqualInput).toBe(true);

		type RequiredSchemaOutput = z.output<typeof requiredSchema>;
		type RequiredSchemaExpectedOutput = { id: boolean | null };
		const requiredSchemaIsEqualOutput: Expect<
			Equal<RequiredSchemaOutput, RequiredSchemaExpectedOutput>
		> = true;
		expect(requiredSchemaIsEqualOutput).toBe(true);
	});
});
