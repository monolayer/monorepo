import { select } from "@clack/prompts";
import type { TablesToRename } from "@monorepo/pg/introspection/schema.js";
import color from "picocolors";

export async function tablesToRename(
	tableDiff: {
		added: string[];
		deleted: string[];
	},
	schemaName: string,
) {
	const renameTableOps: TablesToRename = [];
	for (const table of tableDiff.added) {
		const tableOp = await select<
			{
				value: string;
				label: string;
			}[],
			string
		>({
			message: `Do you want to create the table '${table}' in the '${schemaName}' schema or rename an existing table?`,
			options: [
				{
					value: `create:${table}`,
					label: `${color.green("create")} '${table}'`,
				},
				...tableDiff.deleted.map((deletedTable) => {
					return {
						value: `rename:${deletedTable}:${table}`,
						label: `${color.yellow("rename")} '${deletedTable}': ${deletedTable} ${color.yellow("~>")} ${table}`,
					};
				}),
			],
		});
		if (typeof tableOp === "string") {
			const renameMatch = tableOp.match(/^rename:(\w+):(\w+)/);
			if (renameMatch !== null) {
				renameTableOps.push({ from: renameMatch[1]!, to: renameMatch[2]! });
				tableDiff.deleted.splice(tableDiff.deleted.indexOf(renameMatch[1]!), 1);
			}
			if (tableDiff.deleted.length === 0) {
				return renameTableOps;
			}
		} else {
			return tableOp;
		}
	}
	return renameTableOps;
}