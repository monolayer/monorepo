import { gen } from "effect/Effect";
import { renameTrigger } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import { resolveCurrentTableName } from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { ChangeTriggerDiff } from "../types/diff.js";

export function renameTriggerChangeset(diff: ChangeTriggerDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const newValue = diff.value;
		const newTrigger = newValue.split(":");
		const oldValue = diff.oldValue;
		const oldTrigger = oldValue.split(":");
		if (newTrigger[0] === undefined) {
			return;
		}
		if (oldTrigger[0] === undefined) {
			return;
		}
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.TriggerUpdate,
			phase: ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.UpdateTrigger,
			up: renameTrigger({
				schemaName: context.schemaName,
				tableName,
				name: `monolayer_trg_${newTrigger[0]}`,
				oldName: `monolayer_trg_${oldTrigger[0]}`,
				debug: context.debug,
			}),
			down: renameTrigger({
				schemaName: context.schemaName,
				tableName,
				name: `monolayer_trg_${oldTrigger[0]}`,
				oldName: `monolayer_trg_${newTrigger[0]}`,
				debug: false,
			}),
		};
		return changeset;
	});
}
