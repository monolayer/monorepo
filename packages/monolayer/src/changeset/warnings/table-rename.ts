import * as p from "@clack/prompts";
import color from "picocolors";
import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type TableRename = {
	type: ChangeWarningType.BackwardIncompatible;
	code: ChangeWarningCode.TableRename;
	schema: string;
	tableRename: { from: string; to: string };
};

export function printTableRenameWarnings(tableRenameWarnings: TableRename[]) {
	const messages = [];
	for (const warning of tableRenameWarnings) {
		messages.push(
			`- Table '${warning.tableRename.from}' has been renamed to '${warning.tableRename.to}' (schema: '${warning.schema}')`,
		);
	}
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: detected table renames")} (backward incompatible change)

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`Renaming a table will disrupt running applications that rely on the old table name.

Downtime for your application can only be avoided by using a safer but complex approach:
 - 1. Create a new table with the new name.
 - 2. Write to both tables (old and new).
 - 3. Backfill data from the old table to the new table.
 - 4. Move reads from the old table to the new table.
 - 5. Stop writing to the old table.
 - 6. Drop the old table.`),
		);
	}
}
