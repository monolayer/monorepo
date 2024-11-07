import { gen } from "effect/Effect";
import { renameForeignKey } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import { resolveCurrentTableName } from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { RenameForeignKeyDiff } from "../types/diff.js";

export function renameForeignKeyChangeset(diff: RenameForeignKeyDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = resolveCurrentTableName(diff.path[1], context);
		const oldName = diff.oldValue.match(/"(?<name>\w+)" foreign key/);
		const newName = diff.value.match(/"(?<name>\w+)" foreign key/);
		if (
			oldName !== null &&
			oldName.groups !== undefined &&
			newName !== null &&
			newName.groups !== undefined
		) {
			return {
				priority: MigrationOpPriority.ConstraintChange,
				phase: ChangesetPhase.Alter,
				schemaName: context.schemaName,
				tableName: tableName,
				currentTableName: resolveCurrentTableName(tableName, context),
				type: ChangesetType.RenameForeignKey,
				up: renameForeignKey({
					schemaName: context.schemaName,
					tableName,
					name: newName.groups.name ?? "",
					oldName: oldName.groups.name ?? "",
					debug: context.debug,
				}),
				down: renameForeignKey({
					schemaName: context.schemaName,
					tableName,
					name: oldName.groups.name ?? "",
					oldName: newName.groups.name ?? "",
					debug: false,
				}),
			} satisfies CodeChangeset as CodeChangeset;
		}
	});
}
