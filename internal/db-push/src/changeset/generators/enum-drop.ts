import { gen } from "effect/Effect";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "~db-push/changeset/types/changeset.js";
import { type DropEnumDiff } from "~db-push/changeset/types/diff.js";
import { ChangesetGeneratorState } from "~db-push/state/changeset-generator.js";
import { createEnum, dropEnum } from "../../ddl/ddl.js";

export function dropEnumChangeset(diff: DropEnumDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const changeSet: CodeChangeset = {
			priority: MigrationOpPriority.DropEnum,
			phase: ChangesetPhase.Contract,
			schemaName: context.schemaName,
			tableName: "none",
			currentTableName: "none",
			type: ChangesetType.DropEnum,
			up: dropEnum({
				diff,
				context,
			}),
			down: createEnum({
				diff,
				context,
			}),
		};
		return changeSet;
	});
}
