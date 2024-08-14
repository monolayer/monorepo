import color from "picocolors";
import type { ChangeWarningType } from "~pg/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~pg/changeset/warnings/codes.js";
import { printWarning } from "~pg/changeset/warnings/print.js";

export type ColumnRename = {
	type:
		| ChangeWarningType.BackwardIncompatible
		| `${ChangeWarningType.BackwardIncompatible}`;
	code: ChangeWarningCode.ColumnRename | `${ChangeWarningCode.ColumnRename}`;
	schema: string;
	table: string;
	columnRename: { from: string; to: string };
};

export function printColumnRenameWarnings(warnings: ColumnRename[]) {
	if (warnings.length === 0) return;

	printWarning({
		header: "Blocking changes detected",
		details: warnings.map((warning) =>
			[
				`- Renamed column '${color.underline(warning.columnRename.from)}' to '${color.underline(warning.columnRename.to)}'`,
				`${color.gray(`table: '${warning.table}')(schema: '${warning.schema}'`)}`,
			].join("\n  "),
		),
		notes: [
			"Renaming a column will disrupt running applications that rely on the old column name.",
			"",
			"Downtime for your application can be avoided by using a safer but complex approach:",
			"  1. Create a new column with the new name.",
			"  2. Write to both columns (old and new).",
			"  3. Backfill data from the old column to the new column.",
			"  4. Move reads from the old column to the new column.",
			"  5. Stop writing to the old column.",
			"  6. Drop the old column.",
		],
	});
}
