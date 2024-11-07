import { gen } from "effect/Effect";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "~push/changeset/types/changeset.js";
import { type DropExtensionDiff } from "~push/changeset/types/diff.js";
import { ChangeWarningType } from "~push/changeset/warnings/change-warning-type.js";
import { ChangeWarningCode } from "~push/changeset/warnings/codes.js";
import { ChangesetGeneratorState } from "~push/state/changeset-generator.js";
import { createExtension, dropExtension } from "../../ddl/ddl.js";

export function dropExtensionChangeset(diff: DropExtensionDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const extensionName = diff.path[1];
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.DropExtension,
			phase: ChangesetPhase.Contract,
			tableName: "none",
			currentTableName: "none",
			type: ChangesetType.DropExtension,
			up: dropExtension({
				diff,
				logOutput: context.debug,
				warnings,
			}),
			down: createExtension({
				diff,
				logOutput: false,
			}),
			warnings: [
				{
					type: ChangeWarningType.Destructive,
					code: ChangeWarningCode.ExtensionDrop,
					extensionName: extensionName,
				},
			],
			schemaName: null,
		};
		return changeset;
	});
}

const warnings = `
`.replace("\n", "");
