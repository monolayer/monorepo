import color from "picocolors";
import type { ChangeWarningType } from "~db-push/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~db-push/changeset/warnings/codes.js";
import { printWarning } from "~db-push/changeset/warnings/print.js";

export type AddNonNullableColumn = {
	type: ChangeWarningType.MightFail | `${ChangeWarningType.MightFail}`;
	code:
		| ChangeWarningCode.AddNonNullableColumn
		| `${ChangeWarningCode.AddNonNullableColumn}`;
	schema: string;
	table: string;
	column: string;
};

export function printAddNonNullableColumnWarning(
	warnings: AddNonNullableColumn[],
) {
	if (warnings.length === 0) return;

	printWarning({
		header: "Migration might fail.",
		details: warnings.map(
			(warning) =>
				`- Added non-nullable column '${color.underline(`${warning.column}`)}' ${color.gray(`(table: '${warning.table}' schema: '${warning.schema}')`)}`,
		),
		notes: [
			"Adding a non nullable column may fail if the column contains `NULL` values.",
			"",
			"How to prevent a migration failure and application downtime:",
			"  1. Add a non-volatile default value to the column.",
		],
	});
}
