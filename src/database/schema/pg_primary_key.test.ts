import { describe, expect, test } from "vitest";
import { PgPrimaryKey, primaryKey } from "./pg_primary_key.js";

describe("PgPrimaryKeyConstraint", () => {
	test("it can be instantiated with pgPrimaryKeyConstraint", () => {
		const constraint = primaryKey(["id"]);
		expect(constraint).toBeInstanceOf(PgPrimaryKey);
	});

	test("it stores columns", () => {
		const constraint = primaryKey(["id"]);
		expect(constraint.columns).toStrictEqual(["id"]);
	});
});
