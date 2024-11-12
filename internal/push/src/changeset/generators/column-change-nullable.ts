import { gen } from "effect/Effect";
import { dropNotNull, setNotNull } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import { resolveCurrentTableName } from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { ColumnNullableDiff } from "../types/diff.js";
import { changeColumnToNonNullableWarning } from "../warnings.js";

export function columnNullableChangeset(diff: ColumnNullableDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const columnName = diff.path[3];
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ChangeColumnNullable,
			phase: ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.ChangeColumnNullable,
			up: diff.value
				? dropNotNull({
						schemaName: context.schemaName,
						tableName,
						columnName,
						debug: context.debug,
					})
				: setNotNull({
						schemaName: context.schemaName,
						tableName,
						columnName,
						debug: context.debug,
					}),
			down: diff.value
				? setNotNull({
						schemaName: context.schemaName,
						tableName,
						columnName,
						debug: false,
					})
				: dropNotNull({
						schemaName: context.schemaName,
						tableName,
						columnName,
						debug: false,
					}),
		};
		if (diff.value === false) {
			changeset.warnings = [changeColumnToNonNullableWarning];
		}
		return changeset;
	});
}
