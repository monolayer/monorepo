import { gen } from "effect/Effect";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "~push/changeset/types/changeset.js";
import { type DropExtensionDiff } from "~push/changeset/types/diff.js";
import { ChangesetGeneratorState } from "~push/state/changeset-generator.js";
import { createExtension, dropExtension } from "../../ddl/ddl.js";
import { destructiveWarning } from "../warnings.js";

export function dropExtensionChangeset(diff: DropExtensionDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.DropExtension,
			phase: ChangesetPhase.Contract,
			tableName: "none",
			currentTableName: "none",
			type: ChangesetType.DropExtension,
			up: dropExtension({
				diff,
				logOutput: context.debug,
			}),
			down: createExtension({
				diff,
				logOutput: false,
			}),
			warnings: [destructiveWarning],
			schemaName: null,
		};
		return changeset;
	});
}
