import * as p from "@clack/prompts";
import color from "picocolors";
import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type AddUniqueToExistingColumn = {
	type: ChangeWarningType.MightFail;
	code: ChangeWarningCode.AddUniqueToExistingColumn;
	schema: string;
	table: string;
	columns: string[];
};

export function printAddUniqueToExisitingColumnWarning(
	warnings: AddUniqueToExistingColumn[],
) {
	const messages = [];
	for (const warning of warnings) {
		const columnNames = warning.columns.join(", ");
		messages.push(
			`- Unique constraing to column(s) on an existing table.
  (columns: '${columnNames}' table: '${warning.table}' schema: '${warning.schema}')`,
		);
	}
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: Migration might fail.")}

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`Adding a unique constraint to existing column(s)
may fail if the column contains duplicate entries.

How to prevent a migration failure and downtime on an existing colum:
  1. Ensure the column does not have duplicate entries.
	2. Ensure existing applications do not insert duplicate entries into the column.
	3. Create the unique constraint.`),
		);
	}
}
