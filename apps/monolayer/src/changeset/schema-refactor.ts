import * as p from "@clack/prompts";
import { confirm, select } from "@clack/prompts";
import { Context, Effect, Ref } from "effect";
import { introspectSchema } from "~/introspection/introspect-schemas.js";
import { appEnvironmentConfigurationSchemas } from "~/state/app-environment.js";
import { cancelOperation } from "../cli/cancel-operation.js";
import { Schema } from "../database/schema/schema.js";
import type { ColumnInfo } from "../database/schema/table/column/types.js";
import type { SchemaMigrationInfo } from "../introspection/introspection.js";

export interface SplitColumnRefactoring {
	schema: string;
	tableName: string;
	sourceColumn: string;
	targetColumns: string[];
}

export const makeSplitColumnsRefactorState = Ref.make<SplitColumnRefactoring[]>(
	[],
);

export class SplitColumnsRefactorState extends Context.Tag(
	"SplitColumnsRefactorState",
)<SplitColumnsRefactorState, Ref.Ref<SplitColumnRefactoring[]>>() {
	static get current() {
		return Effect.gen(function* () {
			return yield* Ref.get(yield* SplitColumnsRefactorState);
		});
	}

	static addSplitColumnRefactor(splitColumnRefactor: SplitColumnRefactoring) {
		return Effect.gen(function* () {
			yield* Ref.update(yield* SplitColumnsRefactorState, (state) => {
				return [...state, splitColumnRefactor];
			});
		});
	}
}

export const promtSchemaRefactors = Effect.provideServiceEffect(
	Effect.gen(function* () {
		const schemas = yield* appEnvironmentConfigurationSchemas;
		for (const schema of schemas) {
			const introspection = yield* introspectSchema(schema);
			const schemaColumnDiff = yield* computeColumnDiff(
				introspection.local,
				introspection.remote,
			);
			const splitRefactorCandidates =
				likelySplitColumnRefactors(schemaColumnDiff);
			if (Object.keys(splitRefactorCandidates).length > 0) {
				for (const tableName of Object.keys(splitRefactorCandidates)) {
					const columnSplitRefactors = splitRefactorCandidates[tableName] ?? {};
					for (const [column, likelyRefactors] of Object.entries(
						columnSplitRefactors,
					)) {
						yield* confirmSplitRefactor(
							Schema.info(schema).name,
							tableName,
							column,
							likelyRefactors,
						);
					}
				}
			}
		}
		return yield* SplitColumnsRefactorState.current;
	}),
	SplitColumnsRefactorState,
	makeSplitColumnsRefactorState,
);

function confirmSplitRefactor(
	schema: string,
	tableName: string,
	columnName: string,
	likelyRefactors: string[][],
) {
	return Effect.gen(function* () {
		p.log.info(
			`Detected possible split refactors in schema: ${schema} table ${tableName} column ${columnName}`,
		);
		const doSplitRefactor = yield* confirmSplitRefactorPrompt(columnName);
		if (doSplitRefactor === true) {
			const splitColumns = yield* selectSplitColumnsPrompt(
				columnName,
				likelyRefactors,
			);
			yield* SplitColumnsRefactorState.addSplitColumnRefactor({
				schema,
				tableName,
				sourceColumn: columnName,
				targetColumns: splitColumns,
			});
			p.log.info(`Splittting ${columnName} into ${splitColumns}`);
		}
	});
}

function confirmSplitRefactorPrompt(columnName: string) {
	return Effect.gen(function* () {
		const result = yield* Effect.tryPromise(() =>
			confirm({
				message: `Dou you want to split refactor the column '${columnName}'?`,
				initialValue: false,
			}),
		);
		if (typeof result === "symbol") {
			yield* cancelOperation();
		}
		return result;
	});
}

function selectSplitColumnsPrompt(
	columnName: string,
	likelyRefactors: string[][],
) {
	return Effect.gen(function* () {
		const splitColumnsIdx = yield* Effect.tryPromise(() =>
			select<
				{
					value: string;
					label: string;
				}[],
				string
			>({
				message: `Select into which columns you want to split '${columnName}':`,
				options: likelyRefactors.map((likelyRefactor, idx) => {
					return {
						value: idx.toString(),
						label: likelyRefactor.map((col) => `'${col}'`).join(", "),
					};
				}),
			}),
		);
		if (typeof splitColumnsIdx === "symbol") {
			yield* cancelOperation();
		}
		return likelyRefactors[Number(splitColumnsIdx)]!;
	});
}

function likelySplitColumnRefactors(
	schemaColumnDiff: Record<
		string,
		{
			added: Record<string, ColumnInfo>;
			deleted: Record<string, ColumnInfo>;
		}
	>,
) {
	return Object.entries(schemaColumnDiff).reduce(
		(acc, [tableName, addedDeleted]) => {
			const addedColumnNames = Object.values(addedDeleted.added)
				.filter((columnInfo) => columnInfo.dataType === "text")
				.map((col) => col.columnName)
				.filter((col) => col !== null);

			for (const deleted of Object.values(addedDeleted.deleted)) {
				const combinations = getCombinations(addedColumnNames);
				for (const combination of combinations) {
					if (acc[tableName] === undefined) {
						acc[tableName] = {};
					}
					if (acc[tableName][deleted.columnName as string] === undefined) {
						acc[tableName][deleted.columnName as string] = [] as string[][];
					}
					acc[tableName]![deleted.columnName as string]!.push(combination);
				}
			}
			return acc;
		},
		{} as Record<string, Record<string, string[][]>>,
	);
}

// Helper function to get all combinations of a given array
const getCombinations = (array: string[]): string[][] => {
	const result: string[][] = [];
	const f = (start: number, current: string[]) => {
		if (current.length > 1) result.push([...current]); // Add combination to result if its length is > 1
		for (let i = start; i < array.length; i++) {
			current.push(array[i]!);
			f(i + 1, current);
			current.pop();
		}
	};
	f(0, []);
	return result;
};

function computeColumnDiff(
	local: SchemaMigrationInfo,
	remote: SchemaMigrationInfo,
) {
	const localEntries = Object.entries(local.table);
	const diff = localEntries.reduce(
		(acc, [tableName, table]) => {
			const remoteTable = remote.table[tableName];
			if (remoteTable === undefined) {
				return acc;
			}
			const localColumns = Object.keys(table.columns);
			const remoteColumns = Object.keys(remoteTable.columns);
			const added = Object.entries(table.columns).reduce(
				(acc, [columnName, columnInfo]) => {
					if (!remoteColumns.includes(columnName)) {
						acc[columnName] = columnInfo;
					}
					return acc;
				},
				{} as Record<string, ColumnInfo>,
			);

			const deleted = Object.entries(remoteTable.columns).reduce(
				(acc, [columnName, columnInfo]) => {
					if (!localColumns.includes(columnName)) {
						acc[columnName] = columnInfo;
					}
					return acc;
				},
				{} as Record<string, ColumnInfo>,
			);
			acc[tableName] = { added, deleted };
			return acc;
		},
		{} as Record<
			string,
			{ added: Record<string, ColumnInfo>; deleted: Record<string, ColumnInfo> }
		>,
	);
	return Effect.succeed(diff);
}
