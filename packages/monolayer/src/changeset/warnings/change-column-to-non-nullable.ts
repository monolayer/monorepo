import * as p from "@clack/prompts";
import color from "picocolors";
import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type ChangeColumnToNonNullable = {
	type: ChangeWarningType.MightFail;
	code: ChangeWarningCode.ChangeColumnToNonNullable;
	schema: string;
	table: string;
	column: string;
};

export function printChangeColumnToNonNullableWarning(
	warnings: ChangeColumnToNonNullable[],
) {
	const messages = [];
	for (const warning of warnings) {
		messages.push(
			`- A column has been changed to non-nullable
  (columns: '${warning.column}' table: '${warning.table}' schema: '${warning.schema}')`,
		);
	}
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: Migration might fail.")}

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`Making a column non-nullable on an existing table
may fail if the column contains \`NULL\` values.

How to prevent a migration failure and downtime on an existing colum:
  1. Remove \`NULL\` values from the column.
  2. Add a non-volatile default value to the column in a separate
   migration before adding the primary key.
	3. Ensure existing applications do not insert NULL or duplicate entries into the column.
	4. Make the column non-nullable.`),
		);
	}
}
