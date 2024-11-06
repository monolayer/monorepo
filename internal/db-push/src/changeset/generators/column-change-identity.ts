import { gen } from "effect/Effect";
import { addColumnIdentity, dropColumnIdentity } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import { resolveCurrentTableName } from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type {
	AddColumnIdentityDiff,
	DropColumnIdentityDiff,
} from "../types/diff.js";

export function addColumnIdentityChangeset(diff: AddColumnIdentityDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const columnName = diff.path[3];
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ChangeColumnIdentityAdd,
			phase: ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.ChangeColumnGeneration,
			up: addColumnIdentity({
				column: {
					schemaName: context.schemaName,
					tableName,
					name: columnName,
					identity: diff.value === "ALWAYS" ? "ALWAYS" : "BY DEFAULT",
				},
				debug: context.debug,
			}),
			down: dropColumnIdentity({
				column: {
					schemaName: context.schemaName,
					tableName,
					name: columnName,
				},
				debug: false,
			}),
		};
		return changeset;
	});
}

export function dropColumnIdentityChangeset(diff: DropColumnIdentityDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const columnName = diff.path[3];
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ChangeColumnIdentityDrop,
			phase: ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.ChangeColumnGeneration,
			up: dropColumnIdentity({
				column: {
					schemaName: context.schemaName,
					tableName,
					name: columnName,
				},
				debug: context.debug,
			}),
			down: addColumnIdentity({
				column: {
					schemaName: context.schemaName,
					tableName,
					name: columnName,
					identity: diff.oldValue === "ALWAYS" ? "ALWAYS" : "BY DEFAULT",
				},
				debug: false,
			}),
		};
		return changeset;
	});
}
