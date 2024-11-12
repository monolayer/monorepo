import { gen } from "effect/Effect";
import { renameTable, renameTableObjects } from "../../ddl/ddl.js";
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
import type { RenameTableDiff } from "../types/diff.js";
import { tableRenameWarning } from "../warnings.js";

export function renameTableChangeset(diff: RenameTableDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];

		const currentName = resolveCurrentTableName(tableName, context);
		const previousName = resolvePreviousTableName(tableName, context);

		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.RenameTable,
			phase: ChangesetPhase.Alter,
			tableName: tableName,
			currentTableName: currentName,
			type: ChangesetType.RenameTable,
			up: renameTable({
				schemaName: context.schemaName,
				table: {
					from: previousName,
					to: currentName,
				},
				debug: context.debug,
			}),
			down: renameTable({
				schemaName: context.schemaName,
				table: {
					from: currentName,
					to: previousName,
				},
				debug: false,
			}),
			schemaName: context.schemaName,
			warnings: [tableRenameWarning],
		};

		const renameTableObjectsChangeset: CodeChangeset = {
			priority: MigrationOpPriority.RenameTableObjects,
			phase: ChangesetPhase.Alter,
			tableName: tableName,
			currentTableName: currentName,
			type: ChangesetType.RenameTableObjects,
			up: renameTableObjects({
				schemaName: context.schemaName,
				table: {
					from: previousName,
					to: currentName,
				},
				debug: context.debug,
			}),
			down: renameTableObjects({
				schemaName: context.schemaName,
				table: {
					from: currentName,
					to: previousName,
				},
				debug: false,
			}),
			schemaName: context.schemaName,
		};
		return [changeset, renameTableObjectsChangeset];
	});
}
