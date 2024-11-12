import { PromptCancelError } from "@monorepo/cli/errors.js";
import type { ColumnsToRename } from "@monorepo/state/table-column-rename.js";
import { Effect } from "effect";
import { exit } from "node:process";
import color from "picocolors";
import prompts from "prompts";

export function columnsToRenamePrompt(
	schemaName: string,
	diff: Record<
		string,
		{
			added: string[];
			deleted: string[];
		}
	>,
) {
	return Effect.gen(function* () {
		const selection = yield* Effect.tryPromise(() =>
			askColumnsToRename(diff, schemaName),
		);
		if (typeof selection === "symbol") {
			return yield* Effect.fail(new PromptCancelError());
		}
		return selection;
	});
}

export async function askColumnsToRename(
	columnDiff: Record<
		string,
		{
			added: string[];
			deleted: string[];
		}
	>,
	schemaName: string,
) {
	const columnsToRename: ColumnsToRename = {};
	for (const tableName in columnDiff) {
		const tableColumnDiff = columnDiff[tableName]!;
		const { added, deleted } = tableColumnDiff;
		if (deleted.length === 0) {
			continue;
		}
		for (const addedColumn of added) {
			if (deleted.length === 0) {
				continue;
			}
			let aborted = false;
			const columnOp = await prompts({
				type: "select",
				name: "rename",
				message: `Do you want to create a '${addedColumn}' column in '${schemaName}'.'${tableName}' or rename an existing column?`,
				choices: [
					{
						value: `create:${addedColumn}`,
						title: `${color.green("create")} '${addedColumn}'`,
					},
					...deleted.map((deletedColumn) => {
						return {
							value: `rename:${deletedColumn}:${addedColumn}`,
							title: `${color.yellow("rename")} ${deletedColumn} ${color.yellow("~>")} ${addedColumn}`,
						};
					}),
				],
				onState: (e) => {
					aborted = e.aborted;
				},
			});
			if (aborted) {
				exit(1);
			}
			if (typeof columnOp.rename === "string") {
				const renameMatch = columnOp.rename.match(/^rename:(\w+):(\w+)/);
				if (renameMatch !== null) {
					const toRename = columnsToRename[tableName];
					if (toRename === undefined) {
						columnsToRename[tableName] = [
							{ from: renameMatch[1]!, to: renameMatch[2]! },
						];
					} else {
						columnsToRename[tableName] = [
							...toRename,
							{ from: renameMatch[1]!, to: renameMatch[2]! },
						];
					}
					deleted.splice(deleted.indexOf(renameMatch[1]!), 1);
				}
			}
		}
	}
	return columnsToRename;
}
