import { gen } from "effect/Effect";
import {
	createColumn,
	createNonNullableColumn,
	dropColumn,
} from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import { resolveCurrentTableName, type ColumnInfoDiff } from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { CreateColumnDiff } from "../types/diff.js";
import { ChangeWarningType } from "../warnings/change-warning-type.js";
import { ChangeWarningCode } from "../warnings/codes.js";
import type { ChangeWarning } from "../warnings/warnings.js";

export function columnCreateChangeset(diff: CreateColumnDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const columnName = diff.path[3];
		const columnDef = diff.value;

		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ColumnCreate,
			phase: ChangesetPhase.Expand,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.CreateColumn,
			up: createColumn({
				schemaName: context.schemaName,
				tableName,
				column: {
					name: columnName,
					dataType: columnDef.dataType,
					definition: columnDef,
					skipNullable: true,
				},
				debug: context.debug,
			}),
			down: dropColumn({
				schemaName: context.schemaName,
				tableName,
				columnName,
				debug: false,
			}),
			schemaName: context.schemaName,
		};
		addWarnings(
			changeset,
			columnDef,
			context.schemaName,
			tableName,
			columnName,
		);
		return changeset;
	});
}

export function columnCreateNonNullableChangeset(diff: CreateColumnDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;

		const tableName = diff.path[1];
		const columnName = diff.path[3];
		const columnDef = diff.value;

		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ColumnCreate,
			phase: ChangesetPhase.Expand,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.CreateNonNullableColumn,
			up: createNonNullableColumn({
				schemaName: context.schemaName,
				tableName,
				column: {
					name: columnName,
					dataType: columnDef.dataType,
					skipNullable: true,
					definition: columnDef,
				},
				debug: context.debug,
			}),
			down: dropColumn({
				schemaName: context.schemaName,
				tableName,
				columnName,
				debug: false,
			}),
			schemaName: context.schemaName,
		};
		addWarnings(
			changeset,
			columnDef,
			context.schemaName,
			tableName,
			columnName,
		);
		return changeset;
	});
}

function addWarnings(
	changeset: CodeChangeset,
	columnDef: ColumnInfoDiff,
	schemaName: string,
	tableName: string,
	columnName: string,
) {
	const warnings: ChangeWarning[] = [];

	if (columnDef.dataType === "serial" || columnDef.dataType === "bigserial") {
		warnings.push({
			type: ChangeWarningType.Blocking,
			code:
				columnDef.dataType === "serial"
					? ChangeWarningCode.AddSerialColumn
					: ChangeWarningCode.AddBigSerialColumn,
			schema: schemaName,
			table: tableName,
			column: columnName,
		});
	}

	if (columnDef.volatileDefault === "yes") {
		warnings.push({
			type: ChangeWarningType.Blocking,
			code: ChangeWarningCode.AddVolatileDefault,
			schema: schemaName,
			table: tableName,
			column: columnName,
		});
	}
	if (columnDef.isNullable === false) {
		warnings.push({
			type: ChangeWarningType.MightFail,
			code: ChangeWarningCode.AddNonNullableColumn,
			schema: schemaName,
			table: tableName,
			column: columnName,
		});
	}
	if (warnings.length > 0) {
		changeset.warnings = warnings;
	}
}
