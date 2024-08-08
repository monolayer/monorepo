import color from "picocolors";
import { printWarning } from "~/prompts/print-warning.js";
import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type AddPrimaryKeyToNewColumn = {
	type: ChangeWarningType.MightFail | `${ChangeWarningType.MightFail}`;
	code:
		| ChangeWarningCode.AddPrimaryKeyToNewColumn
		| `${ChangeWarningCode.AddPrimaryKeyToNewColumn}`;
	schema: string;
	table: string;
	columns: string[];
};

export function printAddPrimaryKeyToNewColumn(
	warnings: AddPrimaryKeyToNewColumn[],
) {
	if (warnings.length === 0) return;

	printWarning({
		header: "Migration might fail",
		details: warnings.map((warning) =>
			[
				"- Added primary key to new column(s) on an existing table",
				`${color.gray(`(columns: '${warning.columns.join(", ")}' table: '${warning.table}' schema: '${warning.schema}')`)}`,
			].join("\n  "),
		),
		notes: [
			"Adding a primary key constraint to a new column on an existing table",
			"may fail if the column contains `NULL` values or duplicate entries.",
			"",
			"How to prevent a migration failure and application downtime:",
			"  1. Add the column to the database as nullable.",
			"  2. Populate it with unique values.",
			"  3. Ensure applications do not insert `NULL` or duplicate entries into it.",
			"  4. Create the primary key.",
		],
	});
}
