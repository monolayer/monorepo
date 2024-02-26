import { describe, expect, test } from "vitest";
import { bigint, boolean, serial, text } from "~/database/schema/pg_column.js";
import { zodSchema } from "~/database/schema/zod.js";

describe("zod column schemas", () => {
	describe("PgBoolean", () => {
		describe("by default", () => {
			test("parses boolean", () => {
				const column = boolean();
				const schema = zodSchema(column);
				expect(schema.safeParse(true).success).toBe(true);
			});

			test("parses null", () => {
				const column = boolean();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = boolean();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("parses with coercion only 'true' and 'false'", () => {
				const column = boolean();
				const schema = zodSchema(column);
				expect(schema.safeParse("true").success).toBe(true);
				expect(schema.safeParse("false").success).toBe(true);
				expect(schema.safeParse("TRUE").success).toBe(false);
				expect(schema.safeParse("FALSE").success).toBe(false);
				expect(schema.safeParse("1").success).toBe(false);
				expect(schema.safeParse("0").success).toBe(false);
				expect(schema.safeParse("undefined").success).toBe(false);
				expect(schema.safeParse("null").success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const column = boolean().defaultTo(true);
				const schema = zodSchema(column);
				expect(schema.safeParse(true).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = boolean().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse(true).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = boolean().notNull().defaultTo(true);
				const schema = zodSchema(column);
				expect(schema.safeParse(true).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = boolean();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(true).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = boolean().defaultTo(true);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(true).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = boolean().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(true).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = boolean().notNull().defaultTo(true);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(true).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgText", () => {
		describe("by default", () => {
			test("parses strings", () => {
				const column = text();
				const schema = zodSchema(column);
				expect(schema.safeParse("hello").success).toBe(true);
			});

			test("parses null", () => {
				const column = text();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = text();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("does not parse other types", () => {
				const column = text();
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(false);
				expect(schema.safeParse(1).success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const column = text().defaultTo("1");
				const schema = zodSchema(column);
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = text().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = text().notNull().defaultTo("1");
				const schema = zodSchema(column);
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = text();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = text().defaultTo("hello");
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = text().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = text().notNull().defaultTo("1");
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse("hello").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgBigInt", () => {
		describe("by default", () => {
			test("parses bigint", () => {
				const column = bigint();
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = bigint();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses string", () => {
				const column = bigint();
				const schema = zodSchema(column);
				expect(schema.safeParse("1").success).toBe(true);
			});

			test("parses null", () => {
				const column = bigint();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = bigint();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("fails on invalid string", () => {
				const column = bigint();
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const column = bigint().defaultTo("1");
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("minimumValue is -9223372036854775808n", () => {
				const column = bigint();
				const schema = zodSchema(column);
				expect(schema.safeParse(-9223372036854775808n).success).toBe(true);
				expect(schema.safeParse("-9223372036854775808").success).toBe(true);
				expect(schema.safeParse(-9223372036854775809n).success).toBe(false);
				expect(schema.safeParse("-9223372036854775809").success).toBe(false);
			});

			test("maximumValue is 9223372036854775807n", () => {
				const column = bigint();
				const schema = zodSchema(column);
				expect(schema.safeParse(9223372036854775807n).success).toBe(true);
				expect(schema.safeParse("9223372036854775807").success).toBe(true);
				expect(schema.safeParse(9223372036854775808n).success).toBe(false);
				expect(schema.safeParse("9223372036854775808").success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = bigint().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = bigint().notNull().defaultTo("1");
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = bigint();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = bigint().defaultTo("hello");
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = bigint().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = bigint().notNull().defaultTo("1");
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgSerial", () => {
		describe("by default", () => {
			test("parses number", () => {
				const column = serial();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses string", () => {
				const column = serial();
				const schema = zodSchema(column);
				expect(schema.safeParse("1").success).toBe(true);
			});

			test("parses undefined", () => {
				const column = serial();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("parses coerced strings as number", () => {
				const column = serial();
				const schema = zodSchema(column);
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("is non nullable", () => {
				const column = serial();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(false);
			});

			test("minimum is 1", () => {
				const column = serial();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(0).success).toBe(false);
				expect(schema.safeParse("0").success).toBe(false);
			});

			test("maximum is 2147483648", () => {
				const column = serial();
				const schema = zodSchema(column);
				expect(schema.safeParse(2147483648).success).toBe(true);
				expect(schema.safeParse("2147483648").success).toBe(true);
				expect(schema.safeParse(2147483649).success).toBe(false);
				expect(schema.safeParse("2147483649").success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is optional", () => {
				const column = serial();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});
});
