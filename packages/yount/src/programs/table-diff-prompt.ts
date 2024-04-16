import { select } from "@clack/prompts";

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
			message: `Is ${table} table created or renamed from another table`,
			options: [
				{ value: `create:${table}`, label: `created table ${table}` },
				...tableDiff.deleted.map((deletedTable) => {
					return {
						value: `rename:${deletedTable}:${table}`,
						label: `renamed from ${deletedTable}`,
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
