import color from "picocolors";
import type { ChangeWarningType } from "~db-push/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~db-push/changeset/warnings/codes.js";
import { printWarning } from "~db-push/changeset/warnings/print.js";

export type AddBigSerialColumn = {
	type: ChangeWarningType.Blocking | `${ChangeWarningType.Blocking}`;
	code:
		| ChangeWarningCode.AddBigSerialColumn
		| `${ChangeWarningCode.AddBigSerialColumn}`;
	schema: string;
	table: string;
	column: string;
};

export function printAddBigSerialColumn(warnings: AddBigSerialColumn[]) {
	if (warnings.length === 0) return;
	printWarning({
		header: "Database blocking changes detected",
		details: warnings.map(
			(warning) =>
				`- Added column '${color.underline(warning.column)}' with 'bigserial' data type ${color.gray(`(table: '${warning.table}' schema: '${warning.schema}')`)}`,
		),
		notes: [
			"Adding a bigserial column to an existing table will cause the entire table to be rewritten.",
			"Other transactions will not be able to read and write to the table until the rewrite is finished.",
			"",
			"Downtime for your application can only be avoided by using a safer but complex approach:",
			"  1. Create a new table with a new name.",
			"  2. Write to both tables (old and new).",
			"  3. Backfill data from the old table to the new table.",
			"  4. Move reads from the old table to the new table.",
			"  5. Stop writing to the old table.",
			"  6. Drop the old table.",
		],
	});
}
