import { describe, expect, test } from "vitest";
import { PgUniqueConstraint, pgUniqueConstraint } from "./pg_unique.js";

describe("PgUniqueConstraint", () => {
	test("it can be instantiated with pgUniqueConstraint", () => {
		const constraint = pgUniqueConstraint(["id"]);
		expect(constraint).toBeInstanceOf(PgUniqueConstraint);
	});

	test("it stores columns", () => {
		const constraint = pgUniqueConstraint(["id"]);
		expect(constraint.columns).toStrictEqual(["id"]);
	});

	test("it has nullsDistinct to true by default", () => {
		const constraint = pgUniqueConstraint(["id"]);
		expect(constraint.nullsDistinct).toBe(true);
	});

	test("nullsDistinct can be set to false", () => {
		const constraint = pgUniqueConstraint(["id"], false);
		expect(constraint.nullsDistinct).toBe(false);
	});
});
