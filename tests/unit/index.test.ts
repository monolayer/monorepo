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
				'580d8ca852a482edbe0533def432c784250a805f608bf13664103143a95451d5:create index if not exists "test_table_id_kntc_idx" on "test_table" ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("multiple columns", async () => {
		const idx = index(["id", "name"]).ifNotExists();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_id_name_kntc_idx:
				'7b184a4c54fa8208f660d382739365da4827e559d394f62791ad39d1c740ef5c:create index if not exists "test_table_id_name_kntc_idx" on "test_table" ("id", "name")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("ifNotExists", async () => {
		const idx = index(["id"]).ifNotExists();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_id_kntc_idx:
				'580d8ca852a482edbe0533def432c784250a805f608bf13664103143a95451d5:create index if not exists "test_table_id_kntc_idx" on "test_table" ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("unique", async () => {
		const idx = index(["id"]).unique();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_id_kntc_idx:
				'50a4d8ce37efb16f2bcf7df33b031d09da4614e17a92bf06276c208c285559c9:create unique index "test_table_id_kntc_idx" on "test_table" ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("nullsNotDistinct", async () => {
		const idx = index(["id"]).nullsNotDistinct();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_id_kntc_idx:
				'5bfe68145d77d6f18e89abd48393192a1cfea89332dc8d5799244a1f7250f991:create index "test_table_id_kntc_idx" on "test_table" ("id") nulls not distinct',
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
				'45eb0c5fcde44d275b647abbb4a25c7f312ae87d45789db5158f68d01167c4a0:create index "test_table_first_name_kntc_idx" on "test_table" ("first_name", first_name COLLATE "fi_FI")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("using", async () => {
		const idx = index(["id"]).using("btree");
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_id_kntc_idx:
				'1b32cb7bfe9ae5a274fd67e3247b9bc4b9f71c01ba4fae8061ba01842373081a:create index "test_table_id_kntc_idx" on "test_table" using btree ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("where comparison", async () => {
		const idx = index(["order_nr"]).where(sql.ref("billed"), "is not", true);
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_order_nr_kntc_idx:
				'4e6ec6cae38400f4a99fbcd49c63c8c5bf4b218de0ad1c1388a6b26a59211d57:create index "test_table_order_nr_kntc_idx" on "test_table" ("order_nr") where "billed" is not true',
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
				'9554f79534e2fdfc0d1f7bc3d6580f041d8fa03d03882b6e07e85556ef0b8bbc:create index "test_table_id_kntc_idx" on "test_table" ("id") where ("first_name" = \'Igal\' and "age" >= 18)',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("where expression", async () => {
		const idx = index(["id"]).where(sql<boolean>`SELECT 1`);
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			test_table_id_kntc_idx:
				'e23b173e62c76f2aef1cbb440af8fe2e9aa1d3c8199f7b17a08b32a2872c9e95:create index "test_table_id_kntc_idx" on "test_table" ("id") where SELECT 1',
		};
		expect(compiledIndex).toEqual(expected);
	});
});
