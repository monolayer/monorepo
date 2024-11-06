import { gen } from "effect/Effect";
import { createTrigger } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import { resolveCurrentTableName } from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { ChangeTriggerDiff } from "../types/diff.js";

export function changeTriggerChangeset(diff: ChangeTriggerDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const newValue = diff.value;
		const newTrigger = newValue.split(":");
		const oldValue = diff.oldValue;
		const oldTrigger = oldValue.split(":");
		if (newTrigger[1] === undefined) {
			return;
		}
		if (oldTrigger[1] === undefined) {
			return;
		}
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.TriggerUpdate,
			phase: ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.UpdateTrigger,
			up: createTrigger({
				name: diff.path[2],
				definition: newTrigger[1].replace(
					"CREATE TRIGGER",
					"CREATE OR REPLACE TRIGGER",
				),
				debug: context.debug,
			}),
			down: createTrigger({
				name: diff.path[2],
				definition: oldTrigger[1].replace(
					"CREATE TRIGGER",
					"CREATE OR REPLACE TRIGGER",
				),
				debug: false,
			}),
		};
		return changeset;
	});
}
