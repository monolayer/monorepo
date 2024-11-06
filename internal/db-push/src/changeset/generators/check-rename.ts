import { redefineCheck } from "@monorepo/pg/introspection/check.js";
import { gen } from "effect/Effect";
import {
	resolveCurrentTableName,
	resolvePreviousTableName,
} from "~db-push/changeset/introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "~db-push/changeset/types/changeset.js";
import { type RenameCheckDiff } from "~db-push/changeset/types/diff.js";
import { ChangesetGeneratorState } from "~db-push/state/changeset-generator.js";
import { renameCheckConstraint } from "../../ddl/ddl.js";

export function renameCheckChangeset(diff: RenameCheckDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const checkDefinition = redefineCheck(
			diff.value,
			"current",
			tableName,
			context.columnsToRename,
			context.schemaName,
		);
		const check = {
			schemaName: context.schemaName,
			tableName,
			name: `${tableName}_${checkDefinition.hash}_monolayer_chk`,
			previousName: `${resolvePreviousTableName(tableName, context)}_${diff.path[2]}_monolayer_chk`,
		};
		if (check.previousName === check.name) {
			return;
		}
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ConstraintChange,
			phase: ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.RenameCheck,
			up: renameCheckConstraint({
				check,
				debug: context.debug,
			}),
			down: renameCheckConstraint({
				check: {
					...check,
					name: check.previousName,
					previousName: check.name,
				},
				debug: false,
			}),
		};
		return changeset;
	});
}
