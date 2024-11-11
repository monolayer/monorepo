/* eslint-disable max-lines */
import { timeWithTimeZone } from "@monorepo/pg/schema/column/data-types/time-with-time-zone.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { table } from "@monorepo/pg/schema/table.js";
import { zodSchema } from "src/zod_schema.js";
import { Equal, Expect } from "type-testing";
import { assert, describe, expect, test } from "vitest";
import z from "zod";

describe("by default", () => {
	test("input type is string, null, or undefined", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone(),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InpuType = z.input<typeof schema>;
		type Expected = string | null | undefined;
		const isEqual: Expect<Equal<InpuType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is string, null, or undefined", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type Expected = string | null | undefined;
		const isEqual: Expect<Equal<InputType, Expected>> = true;
		expect(isEqual).toBe(true);

		const stringResult = schema.safeParse("04:05:06-08:00");
		expect(stringResult.success).toBe(true);
		if (stringResult.success) {
			expect(stringResult.data).toBe("04:05:06-08:00");
		}
		const nullResult = schema.safeParse(null);
		expect(nullResult.success).toBe(true);
	});

	test("input type is string with notNull", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone().notNull(),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type Expected = string;
		const isEqual: Expect<Equal<InputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is string with notNull", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone().notNull(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;
		type Expected = string;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);
		const stringResult = schema.safeParse("04:05:06-08:00");
		expect(stringResult.success).toBe(true);
		if (stringResult.success) {
			expect(stringResult.data).toBe("04:05:06-08:00");
		}
		const nullResult = schema.safeParse(null);
		expect(nullResult.success).toBe(false);
	});

	test("input type is string or undefined with notNull and default", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone().notNull().default("11:30"),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type Expected = string | undefined;
		const isEqual: Expect<Equal<InputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is string or undefined with notNull and default", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone().notNull().default("11:30"),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;
		type Expected = string | undefined;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);
		const stringResult = schema.safeParse("04:05:06-08:00");
		expect(stringResult.success).toBe(true);
		if (stringResult.success) {
			expect(stringResult.data).toBe("04:05:06-08:00");
		}
		const nullResult = schema.safeParse(null);
		expect(nullResult.success).toBe(false);
	});

	test("parses time strings", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse("11:30").success).toBe(true);
		expect(schema.safeParse("11:30:01").success).toBe(true);
		expect(schema.safeParse("11:30:01.129").success).toBe(true);
		expect(schema.safeParse("040506").success).toBe(true);
		expect(schema.safeParse("040506-08").success).toBe(true);
		expect(schema.safeParse("04:05:06.789-8").success).toBe(true);
		expect(schema.safeParse("04:05:06-08:00").success).toBe(true);
		expect(schema.safeParse("04:05-08:00").success).toBe(true);
		expect(schema.safeParse("040506+0730").success).toBe(true);
		expect(schema.safeParse("040506-0730").success).toBe(true);
		expect(schema.safeParse("040506+07:30:00").success).toBe(true);
	});

	test("does not parse other strings", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse("hello").success).toBe(false);
	});

	test("parses null", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse(null).success).toBe(true);
	});

	test("does not parse explicit undefined", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone(),
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
				id: timeWithTimeZone().default("11:30"),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse("01:30").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(true);
	});

	test("with notNull is non nullable and required", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone().notNull(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse("11:30").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with default and notNull is non nullable", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone().notNull().default("11:30"),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse("02:30").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});
});

describe("as primary key", () => {
	test("input type is string", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone(),
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
				id: timeWithTimeZone(),
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
				id: timeWithTimeZone(),
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

		expect(schema.safeParse("11:30").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with default value is non nullable and optional", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone().default("11:30"),
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

		expect(schema.safeParse("10:30").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with notNull is non nullable and required", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone().notNull(),
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

		expect(schema.safeParse("11:30").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with default and notNull is non nullable and optional", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone().default("11:30").notNull(),
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

		expect(schema.safeParse("10:30").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});
});

describe("errors", () => {
	test("undefined", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone().notNull(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		const result = schema.safeParse(undefined);
		expect(result.success).toBe(false);
		if (!result.success) {
			const expected = [
				{
					code: "custom",
					fatal: true,
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
				id: timeWithTimeZone(),
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
				id: timeWithTimeZone().notNull(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		const result = schema.safeParse(null);
		expect(result.success).toBe(false);
		if (!result.success) {
			const expected = [
				{
					code: "custom",
					fatal: true,
					path: [],
					message: "Expected string with time format, received null",
				},
			];
			expect(result.error.errors).toStrictEqual(expected);
		}
	});

	test("not a time with time zone", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		const result = schema.safeParse(12);
		expect(result.success).toBe(false);
		if (!result.success) {
			const expected = [
				{
					code: "custom",
					path: [],
					message: "Expected string with time format, received number",
				},
			];
			expect(result.error.errors).toStrictEqual(expected);
		}
	});

	test("not a time with time zone string", () => {
		const tbl = table({
			columns: {
				id: timeWithTimeZone(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		const result = schema.safeParse("not a time");
		expect(result.success).toBe(false);
		if (!result.success) {
			const expected = [
				{
					code: "invalid_string",
					path: [],
					message: "Invalid time with time zone",
					validation: "regex",
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
				id: timeWithTimeZone(),
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
