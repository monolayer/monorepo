import { indexNameFromDefinition } from "@monorepo/pg/introspection/index.js";
import { gen } from "effect/Effect";
import { renameIndex } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import { resolveCurrentTableName } from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { RenameIndexDiff } from "../types/diff.js";

export function renameIndexChangeset(diff: RenameIndexDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const oldIndexName = indexNameFromDefinition(diff.oldValue);
		const newIndexName = indexNameFromDefinition(diff.value);
		if (oldIndexName === undefined) {
			return;
		}
		if (newIndexName === undefined) {
			return;
		}
		if (newIndexName === oldIndexName) {
			return;
		}
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ChangeIndex,
			phase: ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.RenameIndex,
			up: renameIndex({
				name: newIndexName,
				oldName: oldIndexName,
				debug: context.debug,
			}),
			down: renameIndex({
				name: oldIndexName,
				oldName: newIndexName,
				debug: false,
			}),
		};
		return changeset;
	});
}
