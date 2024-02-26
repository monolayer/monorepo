import { describe, expect, test } from "vitest";
import { boolean } from "~/database/schema/pg_column.js";
import { zodSchema } from "~/database/schema/zod.js";

describe("zod column schemas", () => {
	describe("PgBoolean", () => {
		describe("by default", () => {
			test("parses boolean, null and undefined", () => {
				const column = boolean();
				const schema = zodSchema(column);
				expect(schema.safeParse(true).success).toBe(true);
				expect(schema.safeParse(null).success).toBe(true);
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
});
