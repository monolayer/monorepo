import { Effect } from "effect";
import { gen } from "effect/Effect";
import {
	createIndex,
	createIndexConcurrently,
	dropIndex,
} from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import {
	resolveCurrentTableName,
	tableStructureHasChanged,
} from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type {
	CreateIndexDiff,
	CreateMultipleIndexesDiff,
} from "../types/diff.js";

export function createIndexChangeset(diff: CreateIndexDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const indexName = `${tableName}_${diff.path[2]}_monolayer_idx`;
		const onAddedTable = context.addedTables.includes(tableName);
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.IndexCreate,
			phase: tableStructureHasChanged(tableName, context)
				? ChangesetPhase.Alter
				: ChangesetPhase.Expand,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.CreateIndex,
			transaction: onAddedTable,
			up: onAddedTable
				? createIndex({
						schemaName: context.schemaName,
						name: indexName,
						definition: diff.value,
						debug: context.debug,
					})
				: createIndexConcurrently({
						schemaName: context.schemaName,
						name: indexName,
						definition: diff.value,
						debug: context.debug,
					}),
			down: dropIndex({
				schemaName: context.schemaName,
				name: indexName,
				debug: false,
			}),
		};
		return changeset;
	});
}

export function createMultipleIndexesChangeset(
	diff: CreateMultipleIndexesDiff,
) {
	return Effect.all(
		Object.entries(diff.value).map(([indexHash, indexDefinition]) => {
			return gen(function* () {
				return yield* createIndexChangeset({
					type: "CREATE",
					path: ["index", diff.path[1], indexHash],
					value: indexDefinition,
				});
			});
		}),
	);
}
