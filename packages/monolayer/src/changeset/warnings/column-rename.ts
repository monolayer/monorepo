import * as p from "@clack/prompts";
import color from "picocolors";
import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type ColumnRename = {
	type: ChangeWarningType.BackwardIncompatible;
	code: ChangeWarningCode.ColumnRename;
	schema: string;
	table: string;
	columnRename: { from: string; to: string };
};

export function printColumnRenameWarnings(
	columnRenameWarnings: ColumnRename[],
) {
	const messages = [];
	for (const warning of columnRenameWarnings) {
		messages.push(
			`- Column '${warning.columnRename.from}' has been renamed to '${warning.columnRename.to}' (schema: '${warning.schema}', table: '${warning.table}')`,
		);
	}
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: detected column renames")} (backward incompatible change)

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`Renaming a column will disrupt running applications that rely on the old column name.

Downtime for your application can only be avoided by using a safer but complex approach:
  - 1. Create a new column with the new name.
  - 2. Write to both columns (old and new).
  - 3. Backfill data from the old column to the new column.
  - 4. Move reads from the old column to the new column.
  - 5. Stop writing to the old column.
  - 6. Drop the old column.`),
		);
	}
}
