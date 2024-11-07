import { currentTableName } from "@monorepo/pg/introspection/introspection/table-name.js";
import { gen } from "effect/Effect";
import { createPrimaryKey, dropPrimaryKey } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { ChangePrimaryKeyDiff } from "../types/diff.js";
import {
	createPrimaryKeyChangeset,
	dropNotNullChangesets,
} from "./primary-key-create.js";

export function changePrimaryKeyChangeset(diff: ChangePrimaryKeyDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;

		const tableName = diff.path[1];
		const primaryKeyName = diff.path[2];

		const drop: CodeChangeset = {
			priority: MigrationOpPriority.PrimaryKeyDrop,
			phase: ChangesetPhase.Alter,
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
				value: diff.oldValue,
				debug: false,
			}),
		};

		const dropPrimaryKeyNotNull = dropNotNullChangesets(
			diff.oldValue,
			tableName,
			context,
			"up",
		);

		const addPk = yield* createPrimaryKeyChangeset({
			type: "CREATE",
			path: ["primaryKey", tableName],
			value: {
				[primaryKeyName]: diff.value,
			},
		});
		return [drop, ...dropPrimaryKeyNotNull, ...(addPk ?? [])];
	});
}
