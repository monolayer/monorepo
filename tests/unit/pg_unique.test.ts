import { describe, expect, test } from "vitest";
import { PgUnique, unique } from "../../src/database/schema/pg_unique.js";

describe("PgUniqueConstraint", () => {
	test("it can be instantiated with pgUniqueConstraint", () => {
		const constraint = unique(["id"]);
		expect(constraint).toBeInstanceOf(PgUnique);
	});

	test("it stores columns", () => {
		const constraint = unique(["id"]);
		expect(constraint.columns).toStrictEqual(["id"]);
	});

	test("it has nullsDistinct to true by default", () => {
		const constraint = unique(["id"]);
		expect(constraint.nullsDistinct).toBe(true);
	});

	test("nullsDistinct can be set to false", () => {
		const constraint = unique(["id"], false);
		expect(constraint.nullsDistinct).toBe(false);
	});
});
