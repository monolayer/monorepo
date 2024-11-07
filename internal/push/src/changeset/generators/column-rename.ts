import { gen } from "effect/Effect";
import { renameColumn } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import { resolveCurrentTableName } from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { RenameColumnDiff } from "../types/diff.js";

export function renameColumnChangeset(diff: RenameColumnDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const currentTableName = resolveCurrentTableName(tableName, context);
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ChangeColumnName,
			phase: ChangesetPhase.Alter,
			tableName: tableName,
			currentTableName: currentTableName,
			type: ChangesetType.RenameColumn,
			up: renameColumn({
				schemaName: context.schemaName,
				tableName: currentTableName,
				column: {
					from: diff.oldValue,
					to: diff.value,
				},
				debug: context.debug,
			}),
			down: renameColumn({
				schemaName: context.schemaName,
				tableName: currentTableName,
				column: {
					from: diff.value,
					to: diff.oldValue,
				},
				debug: false,
			}),
			schemaName: context.schemaName,
		};
		return changeset;
	});
}
