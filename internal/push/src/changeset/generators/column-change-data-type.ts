import { gen } from "effect/Effect";
import { changeColumnDataType } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import { resolveCurrentTableName } from "../introspection.js";
import { safeDataTypeChange } from "../safe-data-types-change.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { ColumnDataTypeDiff } from "../types/diff.js";
import { ChangeWarningType } from "../warnings/change-warning-type.js";
import { ChangeWarningCode } from "../warnings/codes.js";

export function changeColumDataTypeChangeset(diff: ColumnDataTypeDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const columnName = diff.path[3];
		const newDataType = `${diff.value}`;
		const oldDataType = `${diff.oldValue}`;

		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ChangeColumnDatatype,
			phase: ChangesetPhase.Alter,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.ChangeColumnDataType,
			up: changeColumnDataType({
				column: {
					schemaName: context.schemaName,
					tableName,
					name: columnName,
					dataType: newDataType,
					oldDataType: oldDataType,
				},
				debug: context.debug,
				warnings: "",
			}),
			down: changeColumnDataType({
				column: {
					schemaName: context.schemaName,
					tableName,
					name: columnName,
					dataType: oldDataType,
					oldDataType: newDataType,
				},
				debug: false,
				warnings: "",
			}),
			schemaName: context.schemaName,
		};
		if (!safeDataTypeChange(diff.oldValue!, diff.value!)) {
			changeset.warnings = [
				{
					type: ChangeWarningType.Blocking,
					code: ChangeWarningCode.ChangeColumnType,
					schema: context.schemaName,
					table: tableName,
					column: columnName,
					from: diff.oldValue!,
					to: diff.value!,
				},
			];
		}
		return changeset;
	});
}
