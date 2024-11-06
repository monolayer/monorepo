import color from "picocolors";
import type { ChangeWarningType } from "~db-push/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~db-push/changeset/warnings/codes.js";
import { printWarning } from "~db-push/changeset/warnings/print.js";

export type ChangeColumnToNonNullable = {
	type: ChangeWarningType.MightFail | `${ChangeWarningType.MightFail}`;
	code:
		| ChangeWarningCode.ChangeColumnToNonNullable
		| `${ChangeWarningCode.ChangeColumnToNonNullable}`;
	schema: string;
	table: string;
	column: string;
};

export function printChangeColumnToNonNullableWarning(
	warnings: ChangeColumnToNonNullable[],
) {
	if (warnings.length === 0) return;

	printWarning({
		header: "Migration might fail",
		details: warnings.map(
			(warning) =>
				`- Changed column to non-nullable ${color.gray(`(column: '${warning.column}' table: '${warning.table}' schema: '${warning.schema}')`)}`,
		),
		notes: [
			"Making a column non-nullable on an existing table may fail if the column contains `NULL` values.",
			"",
			"How to prevent a migration failure and application downtime:",
			"  1. Remove `NULL` values from the column.",
			"  2. Ensure existing applications always insert non `NULL` values into the column.",
			"  3. Make the column non-nullable.",
		],
	});
}
