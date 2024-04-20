import { expect, test } from "vitest";
import { primaryKeyConstraintInfoToQuery } from "~/database/schema/table/constraints/primary-key/introspection.js";
import { uniqueConstraintInfoToQuery } from "~/database/schema/table/constraints/unique/introspection.js";
import type { PrimaryKeyConstraintInfo } from "../src/database/schema/table/constraints/primary-key/introspection.js";
import type { UniqueConstraintInfo } from "../src/database/schema/table/constraints/unique/introspection.js";

test("#PrimaryKeyInfoToQuery", () => {
	const info: PrimaryKeyConstraintInfo = {
		constraintType: "PRIMARY KEY",
		table: "test_users",
		columns: ["book_id", "location_id"],
	};
	const expected = '("book_id", "location_id")';
	expect(primaryKeyConstraintInfoToQuery(info)).toBe(expected);
});

test("#uniqueConstraintInfoToQuery", () => {
	const info: UniqueConstraintInfo = {
		constraintType: "UNIQUE",
		table: "test_users",
		columns: ["book_id", "location_id"],
		nullsDistinct: true,
	};

	expect(uniqueConstraintInfoToQuery(info)).toBe(
		'UNIQUE NULLS DISTINCT ("book_id", "location_id")',
	);

	info.nullsDistinct = false;
	expect(uniqueConstraintInfoToQuery(info)).toBe(
		'UNIQUE NULLS NOT DISTINCT ("book_id", "location_id")',
	);
});
