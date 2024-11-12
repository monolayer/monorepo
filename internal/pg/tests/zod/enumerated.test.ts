/* eslint-disable max-lines */
import { Equal, Expect } from "type-testing";
import { assert, describe, expect, test } from "vitest";
import z from "zod";
import { enumType } from "~pg/schema/column/data-types/enum.js";
import { enumerated } from "~pg/schema/column/data-types/enumerated.js";
import { primaryKey } from "~pg/schema/primary-key.js";
import { table } from "~pg/schema/table.js";
import { zodSchema } from "~pg/zod/zod_schema.js";

describe("by default", () => {
	test("input type is enum values, null, or undefined", () => {
		const role = enumType("role", ["user", "admin", "superuser"]);
		const tbl = table({
			columns: {
				id: enumerated(role),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InpuType = z.input<typeof schema>;
		type Expected = "user" | "admin" | "superuser" | null | undefined;
		const isEqual: Expect<Equal<InpuType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is enum values, null, or undefined", () => {
		const role = enumType("role", ["user", "admin", "superuser"]);
		const tbl = table({
			columns: {
				id: enumerated(role),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;
		type Expected = "user" | "admin" | "superuser" | null | undefined;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);
		const stringResult = schema.safeParse("user");
		expect(stringResult.success).toBe(true);
		if (stringResult.success) {
			expect(stringResult.data).toBe("user");
		}
		const nullResult = schema.safeParse(null);
		expect(nullResult.success).toBe(true);
		if (nullResult.success) {
			expect(nullResult.data).toBe(null);
		}
	});

	test("input type is enum values with notNull", () => {
		const tbl = table({
			columns: {
				id: enumerated(
					enumType("role", ["user", "admin", "superuser"]),
				).notNull(),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type Expected = "user" | "admin" | "superuser";
		const isEqual: Expect<Equal<InputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is enum values with notNull", () => {
		const tbl = table({
			columns: {
				id: enumerated(
					enumType("role", ["user", "admin", "superuser"]),
				).notNull(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;
		type Expected = "user" | "admin" | "superuser";
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);
		const stringResult = schema.safeParse("user");
		expect(stringResult.success).toBe(true);
		if (stringResult.success) {
			expect(stringResult.data).toBe("user");
		}
		const nullResult = schema.safeParse(null);
		expect(nullResult.success).toBe(false);
	});

	test("input type is enum values or undefined with notNull and default", () => {
		const tbl = table({
			columns: {
				id: enumerated(enumType("role", ["user", "admin", "superuser"]))
					.notNull()
					.default("user"),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InputType = z.input<typeof schema>;
		type Expected = "user" | "admin" | "superuser" | undefined;
		const isEqual: Expect<Equal<InputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is enum values or undefined with notNull and default", () => {
		const tbl = table({
			columns: {
				id: enumerated(enumType("role", ["user", "admin", "superuser"]))
					.notNull()
					.default("admin"),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;
		type Expected = "user" | "admin" | "superuser" | undefined;
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);
		const stringResult = schema.safeParse("user");
		expect(stringResult.success).toBe(true);
		if (stringResult.success) {
			expect(stringResult.data).toBe("user");
		}
		const nullResult = schema.safeParse(null);
		expect(nullResult.success).toBe(false);
	});

	test("parses enum members", () => {
		const tbl = table({
			columns: {
				id: enumerated(enumType("role", ["user", "admin", "superuser"])),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse("user").success).toBe(true);
		expect(schema.safeParse("admin").success).toBe(true);
		expect(schema.safeParse("superuser").success).toBe(true);
	});

	test("does not parse other objects", () => {
		const tbl = table({
			columns: {
				id: enumerated(enumType("role", ["user", "admin", "superuser"])),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse("1").success).toBe(false);
		expect(schema.safeParse(1).success).toBe(false);
		expect(schema.safeParse(10.123).success).toBe(false);
		expect(schema.safeParse(true).success).toBe(false);
		expect(schema.safeParse(new Date()).success).toBe(false);
		expect(schema.safeParse({ a: 1 }).success).toBe(false);
		expect(schema.safeParse(Date).success).toBe(false);
	});

	test("parses null", () => {
		const tbl = table({
			columns: {
				id: enumerated(enumType("role", ["user", "admin", "superuser"])),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse(null).success).toBe(true);
	});

	test("does not parse explicit undefined", () => {
		const tbl = table({
			columns: {
				id: enumerated(enumType("role", ["user", "admin", "superuser"])),
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
				id: enumerated(
					enumType("role", ["user", "admin", "superuser"]),
				).default("user"),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse("user").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(true);
	});

	test("with notNull is non nullable and required", () => {
		const tbl = table({
			columns: {
				id: enumerated(
					enumType("role", ["user", "admin", "superuser"]),
				).notNull(),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse("user").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with default and notNull is non nullable", () => {
		const tbl = table({
			columns: {
				id: enumerated(enumType("role", ["user", "admin", "superuser"]))
					.notNull()
					.default("user"),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		expect(schema.safeParse("user").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});
});

describe("as primary key", () => {
	test("input type is enum values", () => {
		const role = enumType("role", ["user", "admin", "superuser"]);
		const tbl = table({
			columns: {
				id: enumerated(role),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type InpuType = z.input<typeof schema>;
		type Expected = "user" | "admin" | "superuser";
		const isEqual: Expect<Equal<InpuType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("output type is enum values", () => {
		const enumRole = enumType("role", ["user", "admin", "superuser"]);
		const tbl = table({
			columns: {
				id: enumerated(enumRole),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const schema = zodSchema(tbl).shape.id;
		type OutputType = z.output<typeof schema>;
		type Expected = "user" | "admin" | "superuser";
		const isEqual: Expect<Equal<OutputType, Expected>> = true;
		expect(isEqual).toBe(true);
	});

	test("is non nullable and required", () => {
		const enumRole = enumType("role", ["user", "admin", "superuser"]);
		const tbl = table({
			columns: {
				id: enumerated(enumRole),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		const schema = zodSchema(tbl).shape.id;

		type InputType = z.input<typeof schema>;
		type ExpectedInputType = "user" | "admin" | "superuser";
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);
		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = "user" | "admin" | "superuser";
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);

		expect(schema.safeParse("user").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with default value is non nullable and optional", () => {
		const tbl = table({
			columns: {
				id: enumerated(
					enumType("role", ["user", "admin", "superuser"]),
				).default("user"),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		const schema = zodSchema(tbl).shape.id;

		type InputType = z.input<typeof schema>;
		type ExpectedInputType = "user" | "admin" | "superuser" | undefined;
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);
		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = "user" | "admin" | "superuser" | undefined;
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);

		expect(schema.safeParse("user").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with notNull is non nullable and required", () => {
		const tbl = table({
			columns: {
				id: enumerated(
					enumType("role", ["user", "admin", "superuser"]),
				).notNull(),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		const schema = zodSchema(tbl).shape.id;

		type InputType = z.input<typeof schema>;
		type ExpectedInputType = "user" | "admin" | "superuser";
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);
		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = "user" | "admin" | "superuser";
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);

		expect(schema.safeParse("user").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});

	test("with default and notNull is non nullable and optional", () => {
		const tbl = table({
			columns: {
				id: enumerated(enumType("role", ["user", "admin", "superuser"]))
					.notNull()
					.default("user"),
			},
			constraints: {
				primaryKey: primaryKey(["id"]),
			},
		});
		const schema = zodSchema(tbl).shape.id;

		type InputType = z.input<typeof schema>;
		type ExpectedInputType = "user" | "admin" | "superuser" | undefined;
		const isEqualInput: Expect<Equal<InputType, ExpectedInputType>> = true;
		expect(isEqualInput).toBe(true);
		type OutputType = z.output<typeof schema>;
		type ExpectedOutputType = "user" | "admin" | "superuser" | undefined;
		const isEqualOutput: Expect<Equal<OutputType, ExpectedOutputType>> = true;
		expect(isEqualOutput).toBe(true);

		expect(schema.safeParse("user").success).toBe(true);
		expect(schema.safeParse(null).success).toBe(false);
		expect(schema.safeParse(undefined).success).toBe(false);
	});
});

describe("errors", () => {
	test("undefined", () => {
		const tbl = table({
			columns: {
				id: enumerated(
					enumType("role", ["user", "admin", "superuser"]),
				).notNull(),
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
				id: enumerated(enumType("role", ["user", "admin", "superuser"])),
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
				id: enumerated(
					enumType("role", ["user", "admin", "superuser"]),
				).notNull(),
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
					message: "Expected 'user' | 'admin' | 'superuser', received null",
					fatal: true,
				},
			];
			expect(result.error.errors).toStrictEqual(expected);
		}
	});

	test("not an enum", () => {
		const tbl = table({
			columns: {
				id: enumerated(enumType("role", ["user", "admin", "superuser"])),
			},
		});
		const schema = zodSchema(tbl).shape.id;
		const result = schema.safeParse("hello");
		expect(result.success).toBe(false);
		if (!result.success) {
			const expected = [
				{
					code: "invalid_enum_value",
					path: [],
					message:
						"Invalid enum value. Expected 'user' | 'admin' | 'superuser', received 'hello'",
					options: ["user", "admin", "superuser"],
					received: "hello",
				},
			];
			expect(result.error.errors).toStrictEqual(expected);
		}
	});
});

describe("schema composition", () => {
	test("optional column can be required on another schema", () => {
		const roleEnum = enumType("role", ["user", "admin", "superuser"]);

		const tbl = table({
			columns: {
				id: enumerated(roleEnum),
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
			id: "user" | "admin" | "superuser" | null;
		};
		const requiredSchemaIsEqualInput: Expect<
			Equal<RequiredSchemaInput, RequiredSchemaExpectedInput>
		> = true;
		expect(requiredSchemaIsEqualInput).toBe(true);

		type RequiredSchemaOutput = z.output<typeof requiredSchema>;
		type RequiredSchemaExpectedOutput = {
			id: "user" | "admin" | "superuser" | null;
		};
		const requiredSchemaIsEqualOutput: Expect<
			Equal<RequiredSchemaOutput, RequiredSchemaExpectedOutput>
		> = true;
		expect(requiredSchemaIsEqualOutput).toBe(true);
	});
});
