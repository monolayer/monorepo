import { gen } from "effect/Effect";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "~push/changeset/types/changeset.js";
import { type CreateSchemaDiff } from "~push/changeset/types/diff.js";
import { ChangesetGeneratorState } from "~push/state/changeset-generator.js";
import { createSchema, dropSchema } from "../../ddl/ddl.js";

export function createSchemaChangeset(diff: CreateSchemaDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const schemaName = diff.path[1];
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.CreateSchema,
			phase: ChangesetPhase.Expand,
			tableName: "none",
			currentTableName: "none",
			schemaName,
			type: ChangesetType.CreateSchema,
			up: createSchema({ diff, logOutput: context.debug }),
			down: dropSchema({ diff, logOutput: false }),
		};
		return changeset;
	});
}
