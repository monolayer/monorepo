import color from "picocolors";
import type { ChangeWarningType } from "~/changeset/warnings/change-warning-type.js";
import type { ChangeWarningCode } from "~/changeset/warnings/codes.js";
import { printWarning } from "~/changeset/warnings/print.js";

export type TableRename = {
	type:
		| ChangeWarningType.BackwardIncompatible
		| `${ChangeWarningType.BackwardIncompatible}`;
	code: ChangeWarningCode.TableRename | `${ChangeWarningCode.TableRename}`;
	schema: string;
	tableRename: { from: string; to: string };
};

export function printTableRenameWarnings(warnings: TableRename[]) {
	if (warnings.length === 0) return;

	printWarning({
		header: "Detected table renames",
		details: warnings.map(
			(warning) =>
				`- Renamed '${color.underline(warning.tableRename.from)}' table to '${color.underline(warning.tableRename.to)}' ${color.gray(`(schema: '${warning.schema}')`)}`,
		),
		notes: [
			"Downtime for your application can only be avoided by using a safer but complex approach:",
			"  1. Create a new table with the new name.",
			"  2. Write to both tables (old and new).",
			"  3. Backfill data from the old table to the new table.",
			"  4. Move reads from the old table to the new table.",
			"  5. Stop writing to the old table.",
			"  6. Drop the old table.",
		],
	});
}
