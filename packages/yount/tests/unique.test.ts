import { describe, expect, test } from "vitest";
import { compileUnique } from "~tests/__setup__/helpers/indexes.js";
import { unique } from "../src/database/schema/table/constraints/unique/unique.js";

describe("PgUniqueConstraint", () => {
	test("one column", async () => {
		const constraint = unique(["id"]);
		const compiled = await compileUnique(constraint, "test_table");

		const expected = {
			acdd8fa3: 'UNIQUE NULLS DISTINCT ("id")',
		};
		expect(compiled).toStrictEqual(expected);
	});

	test("multiple columns", async () => {
		const constraint = unique(["price", "name"]);
		const compiled = await compileUnique(constraint, "test_table");

		const expected = {
			"1a28c8d3": 'UNIQUE NULLS DISTINCT ("name", "price")',
		};
		expect(compiled).toStrictEqual(expected);
	});

	test("null not distinct", async () => {
		const constraint = unique(["id"]).nullsNotDistinct();
		const compiled = await compileUnique(constraint, "test_table");

		const expected = {
			a91945e0: 'UNIQUE NULLS NOT DISTINCT ("id")',
		};
		expect(compiled).toStrictEqual(expected);
	});
});
