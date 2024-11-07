import { Effect } from "effect";
import { gen } from "effect/Effect";
import { createIndexConcurrently, dropIndex } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import {
	resolveCurrentTableName,
	resolvePreviousTableName,
} from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { DropIndexDiff, DropMultipleIndexesDiff } from "../types/diff.js";

export function dropIndexChangeset(diff: DropIndexDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = resolvePreviousTableName(diff.path[1], context);
		const indexName = `${tableName}_${diff.path[2]}_monolayer_idx`;
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.IndexCreate,
			phase: ChangesetPhase.Contract,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.CreateIndex,
			transaction: false,
			up: dropIndex({
				schemaName: context.schemaName,
				name: indexName,
				debug: context.debug,
			}),
			down: createIndexConcurrently({
				schemaName: context.schemaName,
				name: indexName,
				definition: diff.oldValue,
				debug: false,
			}),
		};
		return changeset;
	});
}

export function dropMultipleIndexesChangeset(diff: DropMultipleIndexesDiff) {
	return Effect.all(
		Object.entries(diff.oldValue).map(([indexHash, indexDefinition]) => {
			return gen(function* () {
				return yield* dropIndexChangeset({
					type: "REMOVE",
					path: ["index", diff.path[1], indexHash],
					oldValue: indexDefinition,
				});
			});
		}),
	);
}
