import { gen } from "effect/Effect";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "~push/changeset/types/changeset.js";
import { type DropSchemaDiff } from "~push/changeset/types/diff.js";
import { ChangesetGeneratorState } from "~push/state/changeset-generator.js";
import { createSchema, dropSchema } from "../../ddl/ddl.js";
import { destructiveWarning } from "../warnings.js";

export function dropSchemaChangeset(diff: DropSchemaDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const schemaName = diff.path[1];
		return {
			priority: MigrationOpPriority.DropSchema,
			phase: ChangesetPhase.Contract,
			tableName: "none",
			currentTableName: "none",
			schemaName,
			type: ChangesetType.DropSchema,
			warnings: [destructiveWarning],
			up: dropSchema({ diff, logOutput: context.debug }),
			down: createSchema({ diff, logOutput: context.debug }),
		} satisfies CodeChangeset as CodeChangeset;
	});
}
