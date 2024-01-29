import { expect, test } from "vitest";
import { columnMeta } from "../../src/database/schema/columns.js";
import type {
	ColumnMeta,
	PgColumn,
} from "../../src/database/schema/columns.js";

export function testMetaValue(
	column: PgColumn,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	metaName: keyof ColumnMeta<any>,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	expectedValue: any,
	strict = false,
) {
	test(`meta ${metaName} is ${expectedValue}`, () => {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const meta = columnMeta<any>(column);
		if (strict) {
			expect(meta?.[metaName]).toStrictEqual(expectedValue);
		} else {
			expect(meta?.[metaName]).toBe(expectedValue);
		}
	});
}
