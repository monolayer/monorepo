import { describe, expect, test } from "vitest";
import {
	bigint,
	bigserial,
	boolean,
	date,
	doublePrecision,
	float4,
	float8,
	int2,
	int4,
	int8,
	integer,
	real,
	serial,
	text,
	time,
	timestamp,
	timestamptz,
	timetz,
} from "~/database/schema/pg_column.js";
import { zodSchema } from "~/database/schema/zod.js";

const tenCentillionBitInt =
	100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000n;

const elevenCentillionBitInt =
	1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000n;

const tenUnDecillionBigInt = 10000000000000000000000000000000000000n;
const eleventUnDecillionBigInt = 100000000000000000000000000000000000000n;

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

			test("does not parse floats", () => {
				const column = bigint();
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(false);
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
				const column = bigint().defaultTo(1);
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

	describe("PgInt8", () => {
		describe("by default", () => {
			test("parses bigint", () => {
				const column = int8();
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = int8();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses string", () => {
				const column = int8();
				const schema = zodSchema(column);
				expect(schema.safeParse("1").success).toBe(true);
			});

			test("parses null", () => {
				const column = int8();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = int8();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("does not parse floats", () => {
				const column = bigint();
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("fails on invalid string", () => {
				const column = int8();
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("with default value is nullable and optional", () => {
				const column = int8().defaultTo("1");
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("minimumValue is -9223372036854775808n", () => {
				const column = int8();
				const schema = zodSchema(column);
				expect(schema.safeParse(-9223372036854775808n).success).toBe(true);
				expect(schema.safeParse("-9223372036854775808").success).toBe(true);
				expect(schema.safeParse(-9223372036854775809n).success).toBe(false);
				expect(schema.safeParse("-9223372036854775809").success).toBe(false);
			});

			test("maximumValue is 9223372036854775807n", () => {
				const column = int8();
				const schema = zodSchema(column);
				expect(schema.safeParse(9223372036854775807n).success).toBe(true);
				expect(schema.safeParse("9223372036854775807").success).toBe(true);
				expect(schema.safeParse(9223372036854775808n).success).toBe(false);
				expect(schema.safeParse("9223372036854775808").success).toBe(false);
			});

			test("with notNull is non nullable and required", () => {
				const column = int8().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = int8().notNull().defaultTo(1);
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = int8();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = int8().defaultTo(1);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = int8().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = int8().notNull().defaultTo("1");
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

	describe("PgBigSerial", () => {
		describe("by default", () => {
			test("parses bigint", () => {
				const column = bigserial();
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = bigserial();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses strings that can be coerced to bigint", () => {
				const column = bigserial();
				const schema = zodSchema(column);
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("is non nullable", () => {
				const column = bigserial();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(false);
			});

			test("minimum is 1", () => {
				const column = bigserial();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse(0).success).toBe(false);
				expect(schema.safeParse("0").success).toBe(false);
			});

			test("maximum is 9223372036854775807", () => {
				const column = bigserial();
				const schema = zodSchema(column);
				expect(schema.safeParse(9223372036854775807n).success).toBe(true);
				expect(schema.safeParse("9223372036854775807").success).toBe(true);
				expect(schema.safeParse(9223372036854775808n).success).toBe(false);
				expect(schema.safeParse("9223372036854775808").success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is optional", () => {
				const column = bigserial();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgDate", () => {
		describe("by default", () => {
			test("parses dates", () => {
				const column = date();
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
			});

			test("parses strings that can be coerced into dates", () => {
				const column = date();
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date().toISOString()).success).toBe(true);
				expect(schema.safeParse("not a date").success).toBe(false);
			});

			test("parses null", () => {
				const column = date();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = date();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = date().defaultTo(new Date());
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = date().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = date().notNull().defaultTo(new Date());
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = date();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = date().defaultTo(new Date());
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = date().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = date().notNull().defaultTo(new Date());
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgDoublePrecision", () => {
		describe("by default", () => {
			test("parses bigint", () => {
				const column = doublePrecision();
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = doublePrecision();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const column = doublePrecision();
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const column = doublePrecision();
				const schema = zodSchema(column);
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = doublePrecision();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = doublePrecision();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = doublePrecision().defaultTo(30);
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = doublePrecision().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = doublePrecision().notNull().defaultTo(1.1);
				const schema = zodSchema(column);
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("minimum is -1e308", () => {
				const column = doublePrecision();
				const schema = zodSchema(column);
				expect(schema.safeParse(-tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(-elevenCentillionBitInt).success).toBe(false);
			});

			test("maximum is 1e308", () => {
				const column = doublePrecision();
				const schema = zodSchema(column);
				expect(schema.safeParse(tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(elevenCentillionBitInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = doublePrecision();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = doublePrecision().defaultTo(1.1);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = doublePrecision().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = doublePrecision().notNull().defaultTo(2.2);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgFloat8", () => {
		describe("by default", () => {
			test("parses bigint", () => {
				const column = float8();
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = float8();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const column = float8();
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const column = float8();
				const schema = zodSchema(column);
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = float8();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = float8();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = float8().defaultTo(30);
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = float8().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = float8().notNull().defaultTo(1.1);
				const schema = zodSchema(column);
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("minimum is -1e308", () => {
				const column = float8();
				const schema = zodSchema(column);
				expect(schema.safeParse(-tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(-elevenCentillionBitInt).success).toBe(false);
			});

			test("maximum is 1e308", () => {
				const column = float8();
				const schema = zodSchema(column);
				expect(schema.safeParse(tenCentillionBitInt).success).toBe(true);
				expect(schema.safeParse(elevenCentillionBitInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = float8();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = float8().defaultTo(1.1);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = float8().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = float8().notNull().defaultTo(2.2);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgReal", () => {
		describe("by default", () => {
			test("parses bigint", () => {
				const column = real();
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = real();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const column = real();
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const column = real();
				const schema = zodSchema(column);
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = real();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = real();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = real().defaultTo(30);
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = real().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = real().notNull().defaultTo(1.1);
				const schema = zodSchema(column);
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("minimum is -1e37", () => {
				const column = real();
				const schema = zodSchema(column);
				expect(schema.safeParse(-tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(-eleventUnDecillionBigInt).success).toBe(false);
			});

			test("maximum is 1e37", () => {
				const column = real();
				const schema = zodSchema(column);
				expect(schema.safeParse(tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(eleventUnDecillionBigInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = real();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = real().defaultTo(1.1);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = real().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = real().notNull().defaultTo(2.2);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgFloat4", () => {
		describe("by default", () => {
			test("parses bigint", () => {
				const column = float4();
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(true);
			});

			test("parses number", () => {
				const column = float4();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("parses decimals", () => {
				const column = float4();
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
			});

			test("parses strings that can be coerced to number or bigint", () => {
				const column = float4();
				const schema = zodSchema(column);
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("1.1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = float4();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = float4();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = float4().defaultTo(30);
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = float4().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = float4().notNull().defaultTo(1.1);
				const schema = zodSchema(column);
				expect(schema.safeParse(3.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("minimum is -1e37", () => {
				const column = float4();
				const schema = zodSchema(column);
				expect(schema.safeParse(-tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(-eleventUnDecillionBigInt).success).toBe(false);
			});

			test("maximum is 1e37", () => {
				const column = float4();
				const schema = zodSchema(column);
				expect(schema.safeParse(tenUnDecillionBigInt).success).toBe(true);
				expect(schema.safeParse(eleventUnDecillionBigInt).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = float4();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = float4().defaultTo(1.1);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = float4().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = float4().notNull().defaultTo(2.2);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgInteger", () => {
		describe("by default", () => {
			test("parses number", () => {
				const column = integer();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("does not parse decimals", () => {
				const column = integer();
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("does not parse bigint", () => {
				const column = integer();
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(false);
			});

			test("parses strings that can be coerced to number", () => {
				const column = integer();
				const schema = zodSchema(column);
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = integer();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = integer();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = integer().defaultTo(30);
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = integer().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = integer().notNull().defaultTo(1.1);
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("minimum is -2147483648", () => {
				const column = integer();
				const schema = zodSchema(column);
				expect(schema.safeParse(-2147483648).success).toBe(true);
				expect(schema.safeParse(-2147483649).success).toBe(false);
			});

			test("maximum is 2147483647", () => {
				const column = integer();
				const schema = zodSchema(column);
				expect(schema.safeParse(2147483647).success).toBe(true);
				expect(schema.safeParse(2147483648).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = integer();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = integer().defaultTo(1);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = integer().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = integer().notNull().defaultTo(40);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgInt4", () => {
		describe("by default", () => {
			test("parses number", () => {
				const column = int4();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("does not parse decimals", () => {
				const column = int4();
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("does not parses bigint", () => {
				const column = int4();
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(false);
			});

			test("parses strings that can be coerced to number", () => {
				const column = int4();
				const schema = zodSchema(column);
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = int4();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = int4();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = int4().defaultTo(30);
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = int4().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = int4().notNull().defaultTo(1.1);
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("minimum is -2147483648", () => {
				const column = int4();
				const schema = zodSchema(column);
				expect(schema.safeParse(-2147483648).success).toBe(true);
				expect(schema.safeParse(-2147483649).success).toBe(false);
			});

			test("maximum is 2147483647", () => {
				const column = int4();
				const schema = zodSchema(column);
				expect(schema.safeParse(2147483647).success).toBe(true);
				expect(schema.safeParse(2147483648).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = int4();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = int4().defaultTo(1);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = int4().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = int4().notNull().defaultTo(40);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgInt2", () => {
		describe("by default", () => {
			test("parses number", () => {
				const column = int2();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
			});

			test("does not parse decimals", () => {
				const column = int2();
				const schema = zodSchema(column);
				expect(schema.safeParse(1.1).success).toBe(false);
			});

			test("does not parses bigint", () => {
				const column = int2();
				const schema = zodSchema(column);
				expect(schema.safeParse(1n).success).toBe(false);
			});

			test("parses strings that can be coerced to number", () => {
				const column = int2();
				const schema = zodSchema(column);
				expect(schema.safeParse("1").success).toBe(true);
				expect(schema.safeParse("alpha").success).toBe(false);
			});

			test("parses null", () => {
				const column = int2();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = int2();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = int2().defaultTo(30);
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = int2().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = int2().notNull().defaultTo(11);
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("minimum is -32768", () => {
				const column = int2();
				const schema = zodSchema(column);
				expect(schema.safeParse(-32768).success).toBe(true);
				expect(schema.safeParse(-32769).success).toBe(false);
			});

			test("maximum is 32767", () => {
				const column = int2();
				const schema = zodSchema(column);
				expect(schema.safeParse(32767).success).toBe(true);
				expect(schema.safeParse(32768).success).toBe(false);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = int2();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = int2().defaultTo(1);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = int2().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = int2().notNull().defaultTo(40);
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(1).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgTime", () => {
		describe("by default", () => {
			test("parses time strings", () => {
				const column = timetz();
				const schema = zodSchema(column);
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
				const column = time();
				const schema = zodSchema(column);
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const column = time();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = time();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = time().defaultTo("11:30");
				const schema = zodSchema(column);
				expect(schema.safeParse("01:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = time().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = time().notNull().defaultTo("11:30");
				const schema = zodSchema(column);
				expect(schema.safeParse("02:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = time();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = time().defaultTo("11:30");
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = time().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = time().notNull().defaultTo("11:30");
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgTimeTz", () => {
		describe("by default", () => {
			test("parses time strings", () => {
				const column = timetz();
				const schema = zodSchema(column);
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
				const column = timetz();
				const schema = zodSchema(column);
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const column = timetz();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = timetz();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = timetz().defaultTo("11:30");
				const schema = zodSchema(column);
				expect(schema.safeParse("01:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = timetz().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = timetz().notNull().defaultTo("11:30");
				const schema = zodSchema(column);
				expect(schema.safeParse("02:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = time();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = time().defaultTo("11:30");
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = time().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse("11:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = time().notNull().defaultTo("11:30");
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse("10:30").success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgTimemestamp", () => {
		describe("by default", () => {
			test("parses dates", () => {
				const column = timestamp();
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
			});

			test("parses strings that can be coerced into dates", () => {
				const column = timestamp();
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date().toISOString()).success).toBe(true);
			});

			test("does not parse other strings", () => {
				const column = timestamp();
				const schema = zodSchema(column);
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const column = timestamp();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = timestamp();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = timestamp().defaultTo(new Date());
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = timestamp().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = timestamp().notNull().defaultTo(new Date());
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = timestamp();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = timestamp().defaultTo(new Date());
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = timestamp().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = timestamp().notNull().defaultTo(new Date());
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});

	describe("PgTimemestampTz", () => {
		describe("by default", () => {
			test("parses dates", () => {
				const column = timestamptz();
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
			});

			test("parses strings that can be coerced into dates", () => {
				const column = timestamptz();
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date().toISOString()).success).toBe(true);
			});

			test("does not parse other strings", () => {
				const column = timestamptz();
				const schema = zodSchema(column);
				expect(schema.safeParse("hello").success).toBe(false);
			});

			test("parses null", () => {
				const column = timestamptz();
				const schema = zodSchema(column);
				expect(schema.safeParse(null).success).toBe(true);
			});

			test("parses undefined", () => {
				const column = timestamptz();
				const schema = zodSchema(column);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with default value is nullable and optional", () => {
				const column = timestamptz().defaultTo(new Date());
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = timestamptz().notNull();
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = timestamptz().notNull().defaultTo(new Date());
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});

		describe("as primary key", () => {
			test("is non nullable and required", () => {
				const column = timestamptz();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default value is non nullable and optional", () => {
				const column = timestamptz().defaultTo(new Date());
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});

			test("with notNull is non nullable and required", () => {
				const column = timestamptz().notNull();
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date()).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(false);
			});

			test("with default and notNull is non nullable and optional", () => {
				const column = timestamptz().notNull().defaultTo(new Date());
				column._isPrimaryKey = true;
				const schema = zodSchema(column);
				expect(schema.safeParse(new Date(1)).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(false);
				expect(schema.safeParse(undefined).success).toBe(true);
			});
		});
	});
});
