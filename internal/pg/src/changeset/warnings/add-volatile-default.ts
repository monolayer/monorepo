import color from "picocolors";
import type { ChangeWarningType } from "~/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~/changeset/warnings/codes.js";
import { printWarning } from "~/changeset/warnings/print.js";

export type AddVolatileDefault = {
	type: ChangeWarningType.Blocking | `${ChangeWarningType.Blocking}`;
	code:
		| ChangeWarningCode.AddVolatileDefault
		| `${ChangeWarningCode.AddVolatileDefault}`;
	schema: string;
	table: string;
	column: string;
};

export function printChangeColumnDefaultVolatileWarning(
	warnings: AddVolatileDefault[],
) {
	if (warnings.length === 0) return;

	printWarning({
		header: "Possible database blocking changes detected",
		details: warnings.map((warning) =>
			[
				`- Changed default value on column '${warning.column}' ${color.gray(`(table: '${warning.table}' schema: '${warning.schema}')`)}`,
			].join("\n  "),
		),
		notes: [
			"If the new default is a volatile function, it will cause the entire table to be rewritten.",
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
