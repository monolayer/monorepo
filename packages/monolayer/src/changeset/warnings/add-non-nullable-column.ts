import * as p from "@clack/prompts";
import color from "picocolors";
import { ChangeWarningCode } from "./codes.js";
import { ChangeWarningType } from "./types.js";

export type AddNonNullableColumn = {
	type: ChangeWarningType.MightFail;
	code: ChangeWarningCode.AddNonNullableColumn;
	schema: string;
	table: string;
	column: string;
};

export function printAddNonNullableColumnWarning(warnings: AddNonNullableColumn[]) {
	const messages = [];
	for (const warning of warnings) {
		messages.push(
			`- Unique constraing to column(s) on an existing table.
  (column: '${warning.column}' table: '${warning.table}' schema: '${warning.schema}')`,
		);
	}
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: Migration might fail.")}

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`Adding a non nullable column may fail if the column contains \`NULL\` values.

How to prevent a migration failure and downtime:
  1. Add a non-volatile default value to the column.`),
		);
	}
}
