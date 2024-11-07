import type { ColumnToRename, TableToRename } from "~push/state/rename.js";

export function tableRename(schema: string, from: string, to: string) {
	return {
		name: "",
		schema,
		table: from,
		from: `${schema}.${from}`,
		to: `${schema}.${to}`,
		type: "tableRename",
	} satisfies TableToRename;
}

export function columnRename(
	schema: string,
	table: string,
	from: string,
	to: string,
) {
	return {
		name: "",
		type: "columnRename",
		schema,
		table,
		from,
		to,
	} satisfies ColumnToRename;
}
