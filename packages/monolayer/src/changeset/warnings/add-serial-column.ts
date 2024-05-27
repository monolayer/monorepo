import * as p from "@clack/prompts";
import color from "picocolors";
import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type AddSerialColumn = {
	type: ChangeWarningType.Blocking;
	code: ChangeWarningCode.AddSerialColumn;
	schema: string;
	table: string;
	column: string;
};

export function printAddSerialColumn(warnings: AddSerialColumn[]) {
	const messages = [];
	for (const warning of warnings) {
		messages.push(
			`- Auto-incrementing column '${warning.column}' has been added with 'serial' data type (table: '${warning.table}' schema: '${warning.schema}')`,
		);
	}
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: Blocking changes detected.")}

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`Adding a serial column to an existing table will cause the entire table to be rewritten.
Other transactions will not be able to read and write to the table until the rewrite is finished.

Downtime for your application can only be avoided by using a safer but complex approach:
  - 1. Create a new table with a new name.
  - 2. Write to both tables (old and new).
  - 3. Backfill data from the old table to the new table.
  - 4. Move reads from the old table to the new table.
  - 5. Stop writing to the old table.
  - 6. Drop the old table.`),
		);
	}
}
