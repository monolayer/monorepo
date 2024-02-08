import { describe, expect, test } from "vitest";
import { PgIndex, pgIndex } from "~/database/schema/pg_index.js";

describe("pgIndex", () => {
	test("type is pgIndex", () => {
		const idx = pgIndex("test_index", (idx) => idx);

		expect(idx).toBeInstanceOf(PgIndex);
	});
});
