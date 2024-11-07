import { extractColumnsFromPrimaryKey } from "@monorepo/pg/introspection/schema.js";
import { hashValue } from "@monorepo/utils/hash-value.js";
import { gen } from "effect/Effect";
import { renameConstraint } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import {
	resolveCurrentTableName,
	resolvePreviousTableName,
	toSnakeCase,
} from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { RenameUniqueDiff } from "../types/diff.js";

export function renameUniqueConstraintChangeset(diff: RenameUniqueDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const oldName = `${resolvePreviousTableName(toSnakeCase(tableName, context.camelCase), context)}_${diff.path[2]}_monolayer_key`;
		const newName = `${tableName}_${hashValue(
			`${diff.value.includes("UNIQUE NULLS DISTINCT") ? true : false}_${extractColumnsFromPrimaryKey(diff.value).sort().join("_")}`,
		)}_monolayer_key`;

		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ConstraintChange,
			phase: ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.RenameUnique,
			up: renameConstraint({
				schemaName: context.schemaName,
				tableName,
				name: {
					new: newName,
					old: oldName,
				},
				debug: context.debug,
			}),
			down: renameConstraint({
				schemaName: context.schemaName,
				tableName,
				name: {
					new: oldName,
					old: newName,
				},
				debug: false,
			}),
		};
		return changeset;
	});
}
