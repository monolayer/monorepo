import color from "picocolors";
import type { ChangeWarningType } from "~/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~/changeset/warnings/codes.js";
import { printWarning } from "~/changeset/warnings/print.js";

export type AddUniqueToExistingColumn = {
	type: ChangeWarningType.MightFail | `${ChangeWarningType.MightFail}`;
	code:
		| ChangeWarningCode.AddUniqueToExistingColumn
		| `${ChangeWarningCode.AddUniqueToExistingColumn}`;
	schema: string;
	table: string;
	columns: string[];
};

export function printAddUniqueToExisitingColumnWarning(
	warnings: AddUniqueToExistingColumn[],
) {
	if (warnings.length === 0) return;

	printWarning({
		header: "Migration might fail",
		details: warnings.map((warning) =>
			[
				"- Added unique constraing to column(s) on an existing table.",
				`${color.gray(`(columns: '${warning.columns.join(", ")}' table: '${warning.table}' schema: '${warning.schema}')`)}`,
			].join("\n  "),
		),
		notes: [
			"Adding a unique constraint to an existing column may fail if the column",
			"contains duplicate entries.",
			"",
			"How to prevent a migration failure and application downtime:",
			"  1. Ensure the column does not have duplicate entries.",
			"  2. Ensure existing applications do not insert duplicate entries into the column.",
			"  3. Create the unique constraint.",
		],
	});
}
