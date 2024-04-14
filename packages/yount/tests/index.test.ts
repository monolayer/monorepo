import { sql } from "kysely";
import { describe, expect, test } from "vitest";
import { index } from "~/database/schema/table/index/index.js";
import { compileIndex } from "~tests/__setup__/helpers/indexes.js";

describe("pgIndex", () => {
	test("one column", async () => {
		const idx = index(["id"]).ifNotExists();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			ef4c02ae:
				'create index if not exists "test_table_ef4c02ae_yount_idx" on "public"."test_table" ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("multiple columns", async () => {
		const idx = index(["id", "name"]).ifNotExists();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			"1eeaa842":
				'create index if not exists "test_table_1eeaa842_yount_idx" on "public"."test_table" ("id", "name")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("ifNotExists", async () => {
		const idx = index(["id"]).ifNotExists();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			ef4c02ae:
				'create index if not exists "test_table_ef4c02ae_yount_idx" on "public"."test_table" ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("unique", async () => {
		const idx = index(["id"]).unique();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			d0237b83:
				'create unique index "test_table_d0237b83_yount_idx" on "public"."test_table" ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("nullsNotDistinct", async () => {
		const idx = index(["id"]).nullsNotDistinct();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			"9d79085d":
				'create index "test_table_9d79085d_yount_idx" on "public"."test_table" ("id") nulls not distinct',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("expression", async () => {
		const idx = index(["first_name"]).expression(
			sql`first_name COLLATE "fi_FI"`,
		);
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			"15244adc":
				'create index "test_table_15244adc_yount_idx" on "public"."test_table" ("first_name", first_name COLLATE "fi_FI")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("using", async () => {
		const idx = index(["id"]).using("btree");
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			"47d3b854":
				'create index "test_table_47d3b854_yount_idx" on "public"."test_table" using btree ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("where comparison", async () => {
		const idx = index(["order_nr"]).where(sql.ref("billed"), "is not", true);
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			b472eaea:
				'create index "test_table_b472eaea_yount_idx" on "public"."test_table" ("order_nr") where "billed" is not true',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("where expression builder", async () => {
		const idx = index(["id"]).where((eb) =>
			eb.and([eb("first_name", "=", "Igal"), eb(sql.ref("age"), ">=", 18)]),
		);

		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			d4ca0368:
				'create index "test_table_d4ca0368_yount_idx" on "public"."test_table" ("id") where ("first_name" = \'Igal\' and "age" >= 18)',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("where expression", async () => {
		const idx = index(["id"]).where(sql<boolean>`SELECT 1`);
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			"7c8d9dca":
				'create index "test_table_7c8d9dca_yount_idx" on "public"."test_table" ("id") where SELECT 1',
		};
		expect(compiledIndex).toEqual(expected);
	});
});
