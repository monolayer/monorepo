import { compileUnique } from "tests/__setup__/helpers/indexes.js";
import { describe, expect, test } from "vitest";
import { unique } from "~pg/schema/unique.js";

describe("PgUniqueConstraint", () => {
	test("one column", async () => {
		const constraint = unique(["id"]);
		const compiled = await compileUnique(constraint, "test_table", "public");

		const expected = {
			acdd8fa3: 'UNIQUE NULLS DISTINCT ("id")',
		};
		expect(compiled).toStrictEqual(expected);
	});

	test("multiple columns", async () => {
		const constraint = unique(["price", "name"]);
		const compiled = await compileUnique(constraint, "test_table", "public");

		const expected = {
			"1a28c8d3": 'UNIQUE NULLS DISTINCT ("name", "price")',
		};
		expect(compiled).toStrictEqual(expected);
	});

	test("null not distinct", async () => {
		const constraint = unique(["id"]).nullsNotDistinct();
		const compiled = await compileUnique(constraint, "test_table", "public");

		const expected = {
			a91945e0: 'UNIQUE NULLS NOT DISTINCT ("id")',
		};
		expect(compiled).toStrictEqual(expected);
	});
});
