import color from "picocolors";
import type { ChangeWarningType } from "~/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~/changeset/warnings/codes.js";
import { printWarning } from "~/changeset/warnings/print.js";

export type ChangeColumnType = {
	type: ChangeWarningType.Blocking | `${ChangeWarningType.Blocking}`;
	code:
		| ChangeWarningCode.ChangeColumnType
		| `${ChangeWarningCode.ChangeColumnType}`;
	schema: string;
	table: string;
	column: string;
	from: string;
	to: string;
};

export function printChangeColumnTypeWarning(warnings: ChangeColumnType[]) {
	if (warnings.length === 0) return;

	printWarning({
		header: "Blocking changes detected",
		details: warnings.map(
			(warning) =>
				`- Changed data type of column '${color.underline(warning.column)}' from '${warning.from}' to '${warning.to}' (table: '${warning.table}' schema: '${warning.schema}')`,
		),
		notes: [
			"The column data type change will cause the entire table and indexes on changed columns to be rewritten",
			"Other transactions will not be able to read and write to the table until the rewrite is finished.",
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
