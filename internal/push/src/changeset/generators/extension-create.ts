import { gen } from "effect/Effect";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "~push/changeset/types/changeset.js";
import { type CreateExtensionDiff } from "~push/changeset/types/diff.js";
import { ChangesetGeneratorState } from "~push/state/changeset-generator.js";
import { createExtension, dropExtension } from "../../ddl/ddl.js";

export function createExtensionChangeset(diff: CreateExtensionDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.CreateExtension,
			phase: ChangesetPhase.Expand,
			tableName: "none",
			currentTableName: "none",
			type: ChangesetType.CreateExtension,
			up: createExtension({
				diff,
				logOutput: context.debug,
			}),
			down: dropExtension({
				diff,
				logOutput: false,
			}),
			schemaName: null,
		};
		return changeset;
	});
}
