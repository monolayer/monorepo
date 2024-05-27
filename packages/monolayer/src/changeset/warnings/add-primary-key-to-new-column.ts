import * as p from "@clack/prompts";
import color from "picocolors";
import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type AddPrimaryKeyToNewColumn = {
	type: ChangeWarningType.MightFail;
	code: ChangeWarningCode.AddPrimaryKeyToNewColumn;
	schema: string;
	table: string;
	columns: string[];
};

export function printAddPrimaryKeyToNewColumn(
	warnings: AddPrimaryKeyToNewColumn[],
) {
	const messages = [];
	for (const warning of warnings) {
		const columnNames = warning.columns.join(", ");
		messages.push(
			`- A primary key has been added to new column(s) on an existing table
  (columns: '${columnNames}' table: '${warning.table}' schema: '${warning.schema}')`,
		);
	}
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: Migration might fail.")}

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`Adding a primary key constraint to a new column(s) may fail if the column
contains \`NULL\` values or duplicate entries.

How to prevent a migration failure and downtime on new colums:
	1. Add the column to the database as nullable.
	2. Populate it with unique values.
	3. Ensure applications do not insert \`NULL\` or duplicate entries into it.
	4. Create the primary key.`),
		);
	}
}
