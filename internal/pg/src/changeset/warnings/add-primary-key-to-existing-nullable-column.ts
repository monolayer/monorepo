import color from "picocolors";
import type { ChangeWarningType } from "~/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~/changeset/warnings/codes.js";
import { printWarning } from "~/changeset/warnings/print.js";

export type AddPrimaryKeyToExistingNullableColumn = {
	type: ChangeWarningType.MightFail | `${ChangeWarningType.MightFail}`;
	code:
		| ChangeWarningCode.AddPrimaryKeyToExistingNullableColumn
		| `${ChangeWarningCode.AddPrimaryKeyToExistingNullableColumn}`;
	schema: string;
	table: string;
	columns: string[];
};

export function printAddPrimaryKeyToExistingNullableColumn(
	warnings: AddPrimaryKeyToExistingNullableColumn[],
) {
	if (warnings.length === 0) return;
	printWarning({
		header: "Migration might fail",
		details: warnings.map((warning) =>
			[
				"- Added primary key to existing nullable column(s)",
				`${color.gray(`(columns: '${warning.columns.join(", ")}' table: '${warning.table}' schema: '${warning.schema}')`)}`,
			].join("\n  "),
		),
		notes: [
			"Adding a primary key constraint to existing nullable column(s) may fail if the column",
			"contains `NULL` values or duplicate entries.",
			"",
			"How to prevent a migration failure and application downtime:",
			"  1. Ensure the column does not have duplicate entries.",
			"  2. Replace `NULL` values in the column with unique values.",
			"  3. Ensure existing applications do not insert `NULL` or duplicate entries into the column.",
			"  4. Create the primary key.",
		],
	});
}
