import { gen } from "effect/Effect";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "~push/changeset/types/changeset.js";
import { type ChangeEnumDiff } from "~push/changeset/types/diff.js";
import { ChangesetGeneratorState } from "~push/state/changeset-generator.js";
import { changeEnum } from "../../ddl/ddl.js";
import type { AnyKysely } from "../introspection.js";

export function changeEnumChangeset(diff: ChangeEnumDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const changeSet: CodeChangeset = {
			priority: MigrationOpPriority.ChangeEnum,
			phase: ChangesetPhase.Expand,
			schemaName: context.schemaName,
			tableName: "none",
			currentTableName: "none",
			type: ChangesetType.ChangeEnum,
			up: changeEnum({
				diff,
				context,
			}),
			down: async (db: AnyKysely) => {},
		};

		return changeSet;
	});
}
