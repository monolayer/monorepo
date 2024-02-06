import { describe, expect, test } from "vitest";
import {
	PgPrimaryKeyConstraint,
	pgPrimaryKeyConstraint,
} from "./pg_primary_key.js";

describe("PgPrimaryKeyConstraint", () => {
	test("it can be instantiated with pgPrimaryKeyConstraint", () => {
		const constraint = pgPrimaryKeyConstraint(["id"]);
		expect(constraint).toBeInstanceOf(PgPrimaryKeyConstraint);
	});

	test("it stores columns", () => {
		const constraint = pgPrimaryKeyConstraint(["id"]);
		expect(constraint.columns).toStrictEqual(["id"]);
	});
});
