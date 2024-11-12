import { gen } from "effect/Effect";
import {
	createColumn,
	createNonNullableColumn,
	dropColumn,
} from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import {
	resolveCurrentTableName,
	type ColumnInfoDiff,
} from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
	type CodeChangesetWarning,
} from "../types/changeset.js";
import type { CreateColumnDiff } from "../types/diff.js";
import {
	addBigSerialColumn,
	addNonNullableColumnWarning,
	addSerialColumn,
	changeColumnDefaultVolatileWarning,
} from "../warnings.js";

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
		addWarnings(changeset, columnDef);
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
		addWarnings(changeset, columnDef);
		return changeset;
	});
}

function addWarnings(changeset: CodeChangeset, columnDef: ColumnInfoDiff) {
	const warnings: Array<CodeChangesetWarning> = [];

	if (columnDef.dataType === "serial" || columnDef.dataType === "bigserial") {
		warnings.push(
			columnDef.dataType === "serial" ? addSerialColumn : addBigSerialColumn,
		);
	}

	if (columnDef.volatileDefault === "yes") {
		warnings.push(changeColumnDefaultVolatileWarning);
	}
	if (columnDef.isNullable === false) {
		warnings.push(addNonNullableColumnWarning);
	}
	if (warnings.length > 0) {
		changeset.warnings = warnings;
	}
}
