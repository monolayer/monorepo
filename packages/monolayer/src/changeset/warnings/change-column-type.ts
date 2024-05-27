import * as p from "@clack/prompts";
import color from "picocolors";
import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type ChangeColumnType = {
	type: ChangeWarningType.Blocking;
	code: ChangeWarningCode.ChangeColumnType;
	schema: string;
	table: string;
	column: string;
	from: string;
	to: string;
};

export function printChangeColumnTypeWarning(warnings: ChangeColumnType[]) {
	const messages = [];
	for (const warning of warnings) {
		messages.push(
			`- Changed column '${warning.column}' data type from '${warning.from}' to '${warning.to}' (table: '${warning.table}' schema: '${warning.schema}')`,
		);
	}
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: Blocking changes detected.")}

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`The column data type change will cause the entire table and indexes on changed columns to be rewritten
Other transactions will not be able to read and write to the table until the rewrite is finished.

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
