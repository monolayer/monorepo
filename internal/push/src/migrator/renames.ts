import { DbClients } from "@monorepo/services/db-clients.js";
import { appEnvironment } from "@monorepo/state/app-environment.js";
import { pathExists } from "@monorepo/utils/path.js";
import { gen, tryPromise } from "effect/Effect";
import fs from "fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";
import type { TableColumnInfo } from "~push/changeset/types/schema.js";
import { PromptState } from "~push/state/prompt.js";
import type {
	ColumnsToRename,
	ColumnToRename,
	Renames,
	TableToRename,
} from "~push/state/rename.js";

export function computeRenames(
	renames: (TableToRename | ColumnToRename)[],
	local: TableColumnInfo,
	remote: TableColumnInfo,
) {
	const tables = computeTableRenames(
		renames.filter(byTableRename),
		local,
		remote,
	);
	const columns = computeColumnRenames(
		renames.filter(byColumnRename),
		local,
		remote,
		Object.entries(tables).reduce<Record<string, TableToRename[]>>(
			(acc, [schemaName, entries]) => {
				if (acc[schemaName] === undefined) {
					acc[schemaName] = [];
				}
				for (const entry of entries) {
					acc[schemaName]?.push({
						name: "",
						schema: schemaName,
						table: entry.from,
						from: entry.from,
						to: entry.to,
						type: "tableRename",
					});
				}
				return acc;
			},
			{},
		),
	);
	return { tables, columns };
}

export function computeTableRenames(
	renames: TableToRename[],
	local: TableColumnInfo,
	remote: TableColumnInfo,
) {
	const result: Record<string, TableToRename[]> = {};

	for (const tableRename of renames) {
		if (result[tableRename.schema] === undefined) {
			result[tableRename.schema] = [];
		}
		result[tableRename.schema]!.push(tableRename);
	}
	const filter = (_groupName: string, p: { from: string; to: string }) =>
		findTable(remote, p.from) && findTable(local, p.to);
	return computePathsForAllGroups(result, filter);
}

export function computeColumnRenames(
	renames: ColumnToRename[],
	local: TableColumnInfo,
	remote: TableColumnInfo,
	tableRenames?: Record<string, TableToRename[]>,
) {
	const result: Record<string, ColumnToRename[]> = {};

	for (const columnRename of renames) {
		columnRename.table = tableRenames
			? currentTableName(columnRename.schema, columnRename.table, tableRenames)
			: columnRename.table;
		const qualifiedTableName = `${columnRename.schema}.${columnRename.table}`;
		if (result[qualifiedTableName] === undefined) {
			result[qualifiedTableName] = [];
		}
		result[qualifiedTableName]!.push(columnRename);
	}
	const filter = (groupName: string, p: { from: string; to: string }) =>
		findColumn(remote, groupName, p.from, tableRenames) &&
		findColumn(local, groupName, p.to);
	return computePathsForAllGroups(result, filter);
}

function findTable(info: TableColumnInfo, tableName: string) {
	const tableInfo = info[tableName];
	if (tableInfo === undefined) {
		return false;
	}
	return true;
}

function findColumn(
	remoteInfo: TableColumnInfo,
	qualifiedTableName: string,
	columnName: string,
	tableRenames?: Rename,
) {
	const tableName = tableRenames
		? previousTableName(
				qualifiedTableName.split(".")[0]!,
				qualifiedTableName.split(".")[1]!,
				tableRenames,
			)
		: qualifiedTableName.split(".")[1]!;

	const tableInfo = remoteInfo[tableName];
	if (tableInfo === undefined) {
		return false;
	}
	const columnInfo = tableInfo.columns[columnName];
	if (columnInfo === undefined) {
		return false;
	}
	if (columnInfo.columnName === columnName) {
		return true;
	}
	return false;
}

function currentTableName(
	schema: string,
	tableName: string,
	tableRenames: Rename,
) {
	const schemaTableRenames = tableRenames[schema];
	if (schemaTableRenames === undefined) {
		return tableName;
	}
	const table = schemaTableRenames.find((t) => t.from === tableName);
	if (table === undefined) {
		return tableName;
	}
	return table.to;
}

function previousTableName(
	schema: string,
	tableName: string,
	tableRenames: Rename,
) {
	const schemaTableRenames = tableRenames[schema];
	if (schemaTableRenames === undefined) {
		return tableName;
	}
	const table = schemaTableRenames.find((t) => t.to === tableName);
	if (table === undefined) {
		return tableName;
	}
	return table.from;
}

export function computePaths(
	transformations: (TableToRename | ColumnToRename)[],
) {
	const adjacencyList: Record<string, string[]> = {};
	const transformToSet = new Set<string>();

	for (const { from, to } of transformations) {
		if (!adjacencyList[from]) {
			adjacencyList[from] = [];
		}
		adjacencyList[from].push(to);
		transformToSet.add(to);
	}

	const rootNodes = new Set(Object.keys(adjacencyList));
	for (const to of transformToSet) {
		if (rootNodes.has(to)) {
			rootNodes.delete(to);
		}
	}

	function dfs(node: string, path: string[], allPaths: string[][]) {
		path.push(node);
		if (!adjacencyList[node] || adjacencyList[node].length === 0) {
			allPaths.push([...path]);
		} else {
			for (const neighbor of adjacencyList[node]) {
				dfs(neighbor, path, allPaths);
			}
		}
		path.pop();
	}

	const allPaths: string[][] = [];
	for (const root of rootNodes) {
		dfs(root, [], allPaths);
	}

	return allPaths;
}

type Filter = (groupName: string, p: { from: string; to: string }) => boolean;

export type Rename = Record<
	string,
	{
		from: string;
		to: string;
	}[]
>;

export function computePathsForAllGroups(
	transformations: Record<string, (TableToRename | ColumnToRename)[]>,
	filter: Filter,
) {
	const result: Rename = {};

	for (const [groupName, transformationArray] of Object.entries(
		transformations,
	)) {
		const paths = computePaths(transformationArray);
		result[groupName] = paths
			.map((p) => {
				return { from: p[0]!, to: p.at(-1)! };
			})
			.filter((p) => filter(groupName, p));
		if (result[groupName].length === 0) {
			delete result[groupName];
		} else {
			result[groupName] = discardDuplicates(result[groupName]);
		}
	}

	return result;
}

export function discardDuplicates(
	array: { from: string; to: string }[],
): { from: string; to: string }[] {
	const keys = new Set<string>();
	const unique: { from: string; to: string }[] = [];

	for (const item of array) {
		const key = `${item.from}-${item.to}`;

		if (!keys.has(key)) {
			keys.add(key);
			unique.push(item);
		}
	}

	return unique;
}

export function syncRenames(
	local: TableColumnInfo,
	remote: TableColumnInfo,
	allRenames: (TableToRename | ColumnToRename)[],
) {
	const computedRenames = computeRenames(allRenames, local, remote);
	return {
		tables: Object.entries(computedRenames.tables).reduce<TableToRename[]>(
			(acc, [shemaAndTable, entries]) => {
				const schema = shemaAndTable.split(".")[0]!;
				for (const entry of entries) {
					acc.push({
						name: "",
						schema,
						table: entry.from,
						from: `${schema}.${entry.from}`,
						to: `${schema}.${entry.to}`,
						type: "tableRename",
					});
				}
				return acc;
			},
			[],
		),
		columns: Object.entries(computedRenames.columns).reduce<ColumnsToRename>(
			(acc, [schemaAndTable, entries]) => {
				for (const entry of entries) {
					const key = schemaAndTable as keyof typeof acc;
					if (acc[key] === undefined) {
						acc[key] = [];
					}
					acc[key]?.push({
						name: "",
						schema: schemaAndTable.split(".")[0]!,
						table: schemaAndTable.split(".")[1]!,
						from: entry.from,
						to: entry.to,
						type: "columnRename",
					});
				}
				return acc;
			},
			{},
		),
	};
}

export const byColumnRename = (rename: ColumnToRename | TableToRename) =>
	rename.type === "columnRename";

export const byTableRename = (rename: ColumnToRename | TableToRename) =>
	rename.type === "tableRename";

export const providerRenamesFromFiles = gen(function* () {
	const tableRenames = yield* provideTableRenamesFromFiles;
	const columnRenames = yield* provideColumnRenamesFromFiles;
	return {
		tables: tableRenames,
		columns: columnRenames.reduce<ColumnsToRename>((acc, tr) => {
			if (acc[`${tr.schema}.${tr.table}`] === undefined) {
				acc[`${tr.schema}.${tr.table}`] = [];
			}
			acc[`${tr.schema}.${tr.table}`]?.push(tr);
			return acc;
		}, {}),
	} satisfies Renames;
});

const provideTableRenamesFromFiles = gen(function* () {
	const appEnv = yield* appEnvironment;
	const tableRenameStatePath = path.join(
		appEnv.currentWorkingDir ?? cwd(),
		"monolayer",
		"state",
		"table-renames",
	);

	const renames: TableToRename[] = [];
	if (yield* pathExists(tableRenameStatePath)) {
		const files = yield* tryPromise(() => fs.readdir(tableRenameStatePath));
		const promptState = new PromptState((yield* DbClients).kyselyNoCamelCase);
		yield* tryPromise(() => promptState.ensureTableExists());
		const executedRenames = yield* tryPromise(() => promptState.all());
		for (const fileName of files) {
			if (fileName.endsWith(".json")) {
				if (
					executedRenames.find((rename) => rename.name === fileName) ===
					undefined
				) {
					const read = readFileSync(path.join(tableRenameStatePath, fileName));
					renames.push(JSON.parse(read.toString()));
				}
			}
		}
	}
	return renames;
});

const provideColumnRenamesFromFiles = gen(function* () {
	const appEnv = yield* appEnvironment;
	const columnRenamesStatePath = path.join(
		appEnv.currentWorkingDir ?? cwd(),
		"monolayer",
		"state",
		"column-renames",
	);

	const renames: ColumnToRename[] = [];
	if (yield* pathExists(columnRenamesStatePath)) {
		const files = yield* tryPromise(() => fs.readdir(columnRenamesStatePath));
		const promptState = new PromptState((yield* DbClients).kyselyNoCamelCase);
		yield* tryPromise(() => promptState.ensureTableExists());
		const executedRenames = yield* tryPromise(() => promptState.all());
		for (const fileName of files) {
			if (fileName.endsWith(".json")) {
				if (
					executedRenames.find((rename) => rename.name === fileName) ===
					undefined
				) {
					const read = readFileSync(
						path.join(columnRenamesStatePath, fileName),
					);
					const parsed = JSON.parse(read.toString());
					renames.push(parsed);
				}
			}
		}
	}

	return renames;
});
