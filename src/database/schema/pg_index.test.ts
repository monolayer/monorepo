import { describe, expect, test } from "vitest";
import { PgIndex, index } from "~/database/schema/pg_index.js";

describe("pgIndex", () => {
	test("type is pgIndex", () => {
		const idx = index("test_index", (idx) => idx);

		expect(idx).toBeInstanceOf(PgIndex);
	});
});
