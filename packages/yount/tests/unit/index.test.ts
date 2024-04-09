import { sql } from "kysely";
import { describe, expect, test } from "vitest";
import { index } from "~/schema/table/index/index.js";
import { compileIndex } from "~tests/helpers/indexes.js";

describe("pgIndex", () => {
	test("one column", async () => {
		const idx = index(["id"]).ifNotExists();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_id_kntc_idx:
				'bd96eced:create index if not exists "test_table_id_kntc_idx" on "public"."test_table" ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("multiple columns", async () => {
		const idx = index(["id", "name"]).ifNotExists();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_id_name_kntc_idx:
				'c0822436:create index if not exists "test_table_id_name_kntc_idx" on "public"."test_table" ("id", "name")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("ifNotExists", async () => {
		const idx = index(["id"]).ifNotExists();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_id_kntc_idx:
				'bd96eced:create index if not exists "test_table_id_kntc_idx" on "public"."test_table" ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("unique", async () => {
		const idx = index(["id"]).unique();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_id_kntc_idx:
				'72fb9ff7:create unique index "test_table_id_kntc_idx" on "public"."test_table" ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("nullsNotDistinct", async () => {
		const idx = index(["id"]).nullsNotDistinct();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_id_kntc_idx:
				'68c45aac:create index "test_table_id_kntc_idx" on "public"."test_table" ("id") nulls not distinct',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("expression", async () => {
		const idx = index(["first_name"]).expression(
			sql`first_name COLLATE "fi_FI"`,
		);
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_first_name_kntc_idx:
				'04503e88:create index "test_table_first_name_kntc_idx" on "public"."test_table" ("first_name", first_name COLLATE "fi_FI")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("using", async () => {
		const idx = index(["id"]).using("btree");
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_id_kntc_idx:
				'fd5972bf:create index "test_table_id_kntc_idx" on "public"."test_table" using btree ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("where comparison", async () => {
		const idx = index(["order_nr"]).where(sql.ref("billed"), "is not", true);
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_order_nr_kntc_idx:
				'0e840440:create index "test_table_order_nr_kntc_idx" on "public"."test_table" ("order_nr") where "billed" is not true',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("where expression builder", async () => {
		const idx = index(["id"]).where((eb) =>
			eb.and([eb("first_name", "=", "Igal"), eb(sql.ref("age"), ">=", 18)]),
		);

		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_id_kntc_idx:
				'fcaf2bed:create index "test_table_id_kntc_idx" on "public"."test_table" ("id") where ("first_name" = \'Igal\' and "age" >= 18)',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("where expression", async () => {
		const idx = index(["id"]).where(sql<boolean>`SELECT 1`);
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_id_kntc_idx:
				'9df78b63:create index "test_table_id_kntc_idx" on "public"."test_table" ("id") where SELECT 1',
		};
		expect(compiledIndex).toEqual(expected);
	});
});
