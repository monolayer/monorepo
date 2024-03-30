import { describe, expect, test } from "vitest";
import { compileUnique } from "~tests/helpers/indexes.js";
import { unique } from "../../src/schema/table/constraints/unique/unique.js";

describe("PgUniqueConstraint", () => {
	test("one column", async () => {
		const constraint = unique(["id"]);
		const compiled = await compileUnique(constraint, "test_table");

		const expected = {
			test_table_id_yount_key:
				'"test_table_id_yount_key" UNIQUE NULLS DISTINCT ("id")',
		};
		expect(compiled).toStrictEqual(expected);
	});

	test("multiple columns", async () => {
		const constraint = unique(["price", "name"]);
		const compiled = await compileUnique(constraint, "test_table");

		const expected = {
			test_table_name_price_yount_key:
				'"test_table_name_price_yount_key" UNIQUE NULLS DISTINCT ("name", "price")',
		};
		expect(compiled).toStrictEqual(expected);
	});

	test("null not distinct", async () => {
		const constraint = unique(["id"]).nullsNotDistinct();
		const compiled = await compileUnique(constraint, "test_table");

		const expected = {
			test_table_id_yount_key:
				'"test_table_id_yount_key" UNIQUE NULLS NOT DISTINCT ("id")',
		};
		expect(compiled).toStrictEqual(expected);
	});
});
