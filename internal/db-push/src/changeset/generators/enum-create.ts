import { gen } from "effect/Effect";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "~db-push/changeset/types/changeset.js";
import { type CreateEnumDiff } from "~db-push/changeset/types/diff.js";
import { ChangesetGeneratorState } from "~db-push/state/changeset-generator.js";
import { createEnum, dropEnum } from "../../ddl/ddl.js";

export function createEnumChangeset(diff: CreateEnumDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const changeSet: CodeChangeset = {
			priority: MigrationOpPriority.CreateEnum,
			phase: ChangesetPhase.Expand,
			schemaName: context.schemaName,
			tableName: "none",
			currentTableName: "none",
			type: ChangesetType.CreateEnum,
			up: createEnum({
				diff,
				context,
			}),
			down: dropEnum({
				diff,
				context,
			}),
		};
		return changeSet;
	});
}
