import color from "picocolors";
import type { ChangeWarningType } from "~pg/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~pg/changeset/warnings/codes.js";
import { printWarning } from "~pg/changeset/warnings/print.js";

export type AddSerialColumn = {
	type: ChangeWarningType.Blocking | `${ChangeWarningType.Blocking}`;
	code:
		| ChangeWarningCode.AddSerialColumn
		| `${ChangeWarningCode.AddSerialColumn}`;
	schema: string;
	table: string;
	column: string;
};

export function printAddSerialColumn(warnings: AddSerialColumn[]) {
	if (warnings.length === 0) return;

	printWarning({
		header: "Database blocking changes detected",
		details: warnings.map(
			(warning) =>
				`- Added column '${color.underline(warning.column)}' with 'serial' data type ${color.gray(`(table: '${warning.table}' schema: '${warning.schema}')`)}`,
		),
		notes: [
			"Adding a serial column to an existing table will cause the entire table to be rewritten.",
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
