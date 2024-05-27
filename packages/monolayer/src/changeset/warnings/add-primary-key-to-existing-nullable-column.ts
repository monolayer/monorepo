import * as p from "@clack/prompts";
import color from "picocolors";
import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type AddPrimaryKeyToExistingNullableColumn = {
	type: ChangeWarningType.MightFail;
	code: ChangeWarningCode.AddPrimaryKeyToExistingNullableColumn;
	schema: string;
	table: string;
	columns: string[];
};

export function printAddPrimaryKeyToExistingNullableColumn(
	warnings: AddPrimaryKeyToExistingNullableColumn[],
) {
	const messages = [];
	for (const warning of warnings) {
		const columnNames = warning.columns.join(", ");
		messages.push(
			`- A primary key has been added to nullable column(s) on an existing table
  (columns: '${columnNames}' table: '${warning.table}' schema: '${warning.schema}')`,
		);
	}
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: Migration might fail.")}

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`Adding a primary key constraint to existing nullable column(s)
may fail if the column contains \`NULL\` values or duplicate entries.

How to prevent a migration failure and downtime on an existing colum:
  1. Ensure the column does not have duplicate entries.
  2. If the column is nullable:
    - Remove \`NULL\` values from the column.
    - Add a non-volatile default value to the column in a separate
		   migration before adding the primary key.
	3. Ensure existing applications do not insert NULL or duplicate entries into the column.
	4. Create the primary key.`),
		);
	}
}
