import { currentTableName } from "@monorepo/pg/introspection/introspection/table-name.js";
import { extractColumnsFromPrimaryKey } from "@monorepo/pg/introspection/schema.js";
import { gen } from "effect/Effect";
import { createPrimaryKey, dropPrimaryKey } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import { includedInRecord } from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { DropPrimaryKeyDiff } from "../types/diff.js";
import { dropNotNullChangesets } from "./primary-key-create.js";

export function dropPrimaryKeyChangeset(diff: DropPrimaryKeyDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const primaryKeyName = Object.keys(diff.oldValue)[0];
		const primaryKeyValue = diff.oldValue[primaryKeyName ?? ""];
		if (primaryKeyName === undefined || primaryKeyValue === undefined) {
			return;
		}
		const primaryKeyColumns = extractColumnsFromPrimaryKey(primaryKeyValue);

		const allDroppedColumns = includedInRecord(
			primaryKeyColumns,
			context.droppedColumns,
			tableName,
		);

		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.PrimaryKeyDrop,
			phase: allDroppedColumns ? ChangesetPhase.Contract : ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: currentTableName(
				tableName,
				context.tablesToRename,
				context.schemaName,
			),
			type: ChangesetType.DropPrimaryKey,
			up: dropPrimaryKey({
				schemaName: context.schemaName,
				tableName,
				name: primaryKeyName,
				debug: context.debug,
			}),
			down: createPrimaryKey({
				schemaName: context.schemaName,
				tableName,
				name: primaryKeyName,
				value: primaryKeyValue,
				debug: false,
			}),
		};

		return [
			changeset,
			...dropNotNullChangesets(primaryKeyValue, tableName, context, "up"),
		];
	});
}
