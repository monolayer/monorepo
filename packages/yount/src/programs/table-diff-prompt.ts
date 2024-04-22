import { select } from "@clack/prompts";
import color from "picocolors";

export async function tableDiffPrompt(tableDiff: {
	added: string[];
	deleted: string[];
}) {
	const renameTableOps: TablesToRename = [];

	if (tableDiff.deleted.length === 0) {
		return renameTableOps;
	}

	if (tableDiff.added.length === 0) {
		return renameTableOps;
	}

	for (const table of tableDiff.added) {
		const projectType = await select<
			{
				value: string;
				label: string;
			}[],
			string
		>({
			message: `Do you want to create the table '${table}' or rename an existing table?`,
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
		if (typeof projectType === "string") {
			const renameMatch = projectType.match(/^rename:(\w+):(\w+)/);
			if (renameMatch !== null) {
				renameTableOps.push({ from: renameMatch[1]!, to: renameMatch[2]! });
				tableDiff.deleted.splice(tableDiff.deleted.indexOf(renameMatch[1]!), 1);
			}
		}
	}
	return renameTableOps;
}
export type TablesToRename = {
	from: string;
	to: string;
}[];
