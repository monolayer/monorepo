import { select } from "@clack/prompts";
import color from "picocolors";

export async function columnDiffPrompt(
	columnDiff: Record<
		string,
		{
			added: string[];
			deleted: string[];
		}
	>,
) {
	return Object.entries(columnDiff).reduce(
		async (acc, [tableName, { added, deleted }]) => {
			const awaited = await acc;
			if (deleted.length === 0) {
				return awaited;
			}
			for (const addedColumn of added) {
				if (deleted.length === 0) {
					return awaited;
				}
				const columnType = await select<
					{
						value: string;
						label: string;
					}[],
					string
				>({
					message: `Do you want to create a '${addedColumn}' column in '${tableName}' or rename an existing column?`,
					options: [
						{
							value: `create:${addedColumn}`,
							label: `${color.green("create")} '${addedColumn}'`,
						},
						...deleted.map((deletedColumn) => {
							return {
								value: `rename:${deletedColumn}:${addedColumn}`,
								label: `${color.yellow("rename")} '${deletedColumn}': ${deletedColumn} ${color.yellow("~>")} ${addedColumn}`,
							};
						}),
					],
				});
				if (typeof columnType === "string") {
					const renameMatch = columnType.match(/^rename:(\w+):(\w+)/);
					if (renameMatch !== null) {
						const lala = awaited[tableName];
						if (lala === undefined) {
							awaited[tableName] = [
								{ from: renameMatch[1]!, to: renameMatch[2]! },
							];
						} else {
							awaited[tableName] = [
								...lala,
								{ from: renameMatch[1]!, to: renameMatch[2]! },
							];
						}
						deleted.splice(deleted.indexOf(renameMatch[1]!), 1);
					}
				}
			}
			return awaited;
		},
		Promise.resolve({} as ColumnsToRename),
	);
}

export type ColumnsToRename = Record<
	string,
	{
		from: string;
		to: string;
	}[]
>;
