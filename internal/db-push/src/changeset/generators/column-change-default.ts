import { gen } from "effect/Effect";
import { dropColumnDefault, setColumnDefault } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import { resolveCurrentTableName } from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type {
	AddColumnDefaultDiff,
	ChangeColumnDefaultDiff,
	DropColumnDefaultDiff,
} from "../types/diff.js";
import type { SchemaMigrationInfo } from "../types/schema.js";
import { ChangeWarningType } from "../warnings/change-warning-type.js";
import { ChangeWarningCode } from "../warnings/codes.js";

export function addDefaultToColumnChangeset(diff: AddColumnDefaultDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const columnName = diff.path[3];

		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ChangeColumnDefaultAdd,
			phase: ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.ChangeColumnDefault,
			up: setColumnDefault({
				column: {
					schemaName: context.schemaName,
					tableName,
					name: columnName,
					default: diff.value,
				},
				debug: context.debug,
				warnings: "",
			}),
			down: dropColumnDefault({
				column: {
					schemaName: context.schemaName,
					tableName,
					name: columnName,
				},
				debug: false,
				warnings: "",
			}),
		};
		return changeset;
	});
}

export function dropDefaultFromColumnChangeset(diff: DropColumnDefaultDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const columnName = diff.path[3];

		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ChangeColumnDefaultDrop,
			phase: ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.ChangeColumnDefault,
			up: dropColumnDefault({
				column: {
					schemaName: context.schemaName,
					tableName,
					name: columnName,
				},
				debug: context.debug,
				warnings: "",
			}),
			down: setColumnDefault({
				column: {
					schemaName: context.schemaName,
					tableName,
					name: columnName,
					default: diff.oldValue,
				},
				debug: false,
				warnings: "",
			}),
		};
		return changeset;
	});
}

export function changeDefaultFromColumnChangeset(
	diff: ChangeColumnDefaultDiff,
) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const columnName = diff.path[3];

		if (diff.value.split("")[0] !== diff.oldValue.split("")[0]) {
			const changeset: CodeChangeset = {
				priority: MigrationOpPriority.ChangeColumnDefaultChange,
				phase: ChangesetPhase.Alter,
				tableName: tableName,
				currentTableName: resolveCurrentTableName(tableName, context),
				type: ChangesetType.ChangeColumnDefault,
				up: setColumnDefault({
					column: {
						schemaName: context.schemaName,
						tableName,
						name: columnName,
						default: diff.value,
					},
					debug: context.debug,
					warnings: "",
				}),
				down: setColumnDefault({
					column: {
						schemaName: context.schemaName,
						tableName,
						name: columnName,
						default: diff.oldValue,
					},
					debug: false,
					warnings: "",
				}),
				schemaName: context.schemaName,
			};
			if (columnDefaultIsVolatile(columnName, tableName, context.local)) {
				changeset.warnings = [
					{
						type: ChangeWarningType.Blocking,
						code: ChangeWarningCode.AddVolatileDefault,
						schema: context.schemaName,
						table: tableName,
						column: columnName,
					},
				];
			}
			return changeset;
		}
	});
}

function columnDefaultIsVolatile(
	columnName: string,
	tableName: string,
	local: SchemaMigrationInfo,
) {
	const column = local.table[tableName]?.columns[columnName];
	const volatileDefault = column?.volatileDefault;
	return volatileDefault === "yes";
}
