import { select } from "@clack/prompts";
import { PromptCancelError } from "@monorepo/cli/errors.js";
import type { SchemaMigrationInfo } from "@monorepo/pg/schema/column/types.js";
import { columnsToRenamePrompt } from "@monorepo/programs/columns-to-rename.js";
import { Effect } from "effect";
import { fail, gen, tryPromise } from "effect/Effect";
import color from "picocolors";
import type { SchemaIntrospection } from "~push/introspect-schema.js";
import type {
	ColumnsToRename,
	Renames,
	TableToRename,
} from "~push/state/rename.js";

type ColumnFilter = (
	input: ColumnDiff,
	introspection: SchemaIntrospection,
) => ColumnDiff;

export function tableColumnRenamePrompt(
	introspections: SchemaIntrospection[],
	columnFilter?: ColumnFilter,
) {
	return gen(function* () {
		const allTableRenames: TableToRename[] = [];
		let allColumnRenames: ColumnsToRename = {};

		for (const introspection of introspections) {
			const tableRenames = yield* selectTableDiffInteractive(
				introspection.schemaName,
				introspection.tableDiff,
			);
			allTableRenames.push(...tableRenames);
			const columnDiff = yield* computeColumnDiff(
				introspection.schemaName,
				introspection.local,
				introspection.remote,
				tableRenames,
			);
			const filtered = columnFilter
				? columnFilter(columnDiff, introspection)
				: columnDiff;
			const columnRenames = yield* selectColumnDiffInteractive(
				introspection.schemaName,
				filtered,
			);
			allColumnRenames = {
				...allColumnRenames,
				...columnRenames,
			};
		}
		return {
			tables: allTableRenames,
			columns: allColumnRenames,
		} satisfies Renames;
	});
}

function selectTableDiffInteractive(
	schemaName: string,
	{ added = [], deleted = [] }: { added: string[]; deleted: string[] },
) {
	return gen(function* () {
		if (deleted.length === 0 || added.length === 0) {
			return [];
		}
		const renameSelection = yield* tablesToRenamePrompt(
			{ added, deleted },
			schemaName,
		);
		if (typeof renameSelection === "symbol") {
			yield* fail(new PromptCancelError());
		}
		return renameSelection;
	});
}

function selectColumnDiffInteractive(
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
		const renameSelection = yield* columnsToRenamePrompt(schemaName, diff);

		return Object.entries(renameSelection).reduce(
			(acc, [tableName, columns]) => {
				if (acc[`${schemaName}.${tableName}`] === undefined) {
					acc[`${schemaName}.${tableName}`] = [];
				}
				for (const column of columns) {
					acc[`${schemaName}.${tableName}`]?.push({
						name: "",
						schema: schemaName,
						table: tableName,
						from: column.from,
						to: column.to,
						type: "columnRename",
					});
				}
				return acc;
			},
			{} as ColumnsToRename,
		);
	});
}

export type ColumnDiff = Record<
	string,
	{
		added: string[];
		deleted: string[];
	}
>;
function computeColumnDiff(
	schemaName: string,
	local: SchemaMigrationInfo,
	remote: SchemaMigrationInfo,
	renames: TableToRename[],
) {
	// eslint-disable-next-line require-yield
	return gen(function* () {
		const localEntries = Object.entries(local.table);
		const aDiff: ColumnDiff = {};
		for (const [tableName, table] of localEntries) {
			const prevTableName = previousTableName(schemaName, tableName, renames);
			const remoteTable = remote.table[prevTableName];
			if (remoteTable !== undefined) {
				const localColumns = Object.keys(table.columns);
				const remoteColumns = Object.keys(remoteTable.columns);
				const added = localColumns.filter(
					(column) => !remoteColumns.includes(column),
				);
				const deleted = remoteColumns.filter(
					(column) => !localColumns.includes(column),
				);
				aDiff[tableName] = { added, deleted };
			}
		}
		return aDiff;
	});
}

function previousTableName(
	schemaName: string,
	changedTableName: string,
	renames: TableToRename[],
) {
	const previousName = renames.find((table) => {
		return table.to === `${schemaName}.${changedTableName}`;
	})?.from;
	return previousName === undefined
		? changedTableName
		: previousName.split(".")[1]!;
}

export function tablesToRenamePrompt(
	tableDiff: {
		added: string[];
		deleted: string[];
	},
	schemaName: string,
) {
	return Effect.gen(function* () {
		const tableRenames: TableToRename[] = [];
		if (tableDiff.added.length === 0 || tableDiff.deleted.length === 0) {
			return [];
		}
		for (const table of tableDiff.added) {
			const tableOp = yield* selectRename({
				table,
				schemaName,
				deletedTables: tableDiff.deleted,
			});
			const renameMatch = tableOp.match(/^rename:(\w+):(\w+)/);
			if (renameMatch !== null) {
				tableRenames.push({
					name: "",
					schema: schemaName,
					table: renameMatch[1]!,
					from: `${schemaName}.${renameMatch[1]}`,
					to: `${schemaName}.${renameMatch[2]}`,
					type: "tableRename",
				});
				tableDiff.deleted.splice(tableDiff.deleted.indexOf(renameMatch[1]!), 1);
			}
			if (tableDiff.deleted.length === 0) {
				return tableRenames;
			}
		}
		return tableRenames;
	});
}

type TableRenameSelection = {
	value: string;
	label: string;
}[];

export function selectRename({
	table,
	schemaName,
	deletedTables,
}: {
	table: string;
	schemaName: string;
	deletedTables: string[];
}) {
	return gen(function* () {
		const result = yield* tryPromise(() =>
			select<TableRenameSelection, string>({
				message: `Do you want to create the table '${table}' in the '${schemaName}' schema or rename an existing table?`,
				options: [
					{
						value: `create:${table}`,
						label: `${color.green("create")} '${table}'`,
					},
					...deletedTables.map((deletedTable) => {
						return {
							value: `rename:${deletedTable}:${table}`,
							label: `${color.yellow("rename")} ${deletedTable} ${color.yellow("~>")} ${table}`,
						};
					}),
				],
			}),
		);
		if (typeof result === "symbol") {
			return yield* fail(new PromptCancelError());
		} else {
			return result;
		}
	});
}
