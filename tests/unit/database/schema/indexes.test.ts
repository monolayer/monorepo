import { CreateIndexBuilder } from "kysely";
import { describe, expect, expectTypeOf, test } from "vitest";
import { indexMeta, pgIndex } from "~/database/schema/indexes.js";

describe("pgIndex", () => {
	test("type is pgIndex", () => {
		const idx = pgIndex("test_index", (idx) => idx);
		expectTypeOf(idx).toMatchTypeOf<pgIndex>();
	});

	test("index name", () => {
		const idx = pgIndex("test_index", (idx) => idx);
		expect(idx.name).toBe("test_index");
	});

	test("index meta name", () => {
		const idx = pgIndex("test_index", (idx) => idx);
		const meta = indexMeta(idx);
		expect(meta.name).toBe("test_index");
	});

	test("index builder", () => {
		const idxBuilder = (idx: CreateIndexBuilder) => idx;
		const idx = pgIndex("test_index", idxBuilder);
		const meta = indexMeta(idx);
		expect(meta.builder).toBe(idxBuilder);
	});
});
