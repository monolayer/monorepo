import { gen } from "effect/Effect";
import { createColumn, dropColumn } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import { resolveCurrentTableName } from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { DropColumnDiff } from "../types/diff.js";
import { ChangeWarningType } from "../warnings/change-warning-type.js";
import { ChangeWarningCode } from "../warnings/codes.js";

export function columnDropChangeset(diff: DropColumnDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const columnDef = diff.oldValue;
		const columnName = diff.path[3];
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ColumnDrop,
			phase: ChangesetPhase.Contract,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.DropColumn,
			warnings: [
				{
					type: ChangeWarningType.Destructive,
					code: ChangeWarningCode.ColumnDrop,
					schema: context.schemaName,
					table: resolveCurrentTableName(tableName, context),
					column: columnName,
				},
			],
			up: dropColumn({
				schemaName: context.schemaName,
				tableName,
				columnName,
				debug: context.debug,
			}),
			down: createColumn({
				schemaName: context.schemaName,
				tableName,
				column: {
					name: columnName,
					dataType: columnDef.dataType,
					definition: columnDef,
					skipNullable: false,
				},
				debug: false,
			}),
			schemaName: context.schemaName,
		};
		return changeset;
	});
}
