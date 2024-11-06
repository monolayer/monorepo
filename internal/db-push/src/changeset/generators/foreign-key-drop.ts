import { Effect } from "effect";
import { gen } from "effect/Effect";
import { createForeignKey, dropForeignKey } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import {
	foreignKeyDefinition,
	resolveCurrentTableName,
	resolvePreviousTableName,
} from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type {
	DropForeignKeyDiff,
	DropMultipleForeignKeyDiff,
} from "../types/diff.js";

export function dropForeignKeyChangeset(diff: DropForeignKeyDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];

		const definition = foreignKeyDefinition(
			tableName,
			diff.path[2],
			context.db,
			"previous",
			{
				columnsToRename: context.columnsToRename,
				tablesToRename: context.tablesToRename,
				camelCase: context.camelCase,
				schemaName: context.schemaName,
			},
		);

		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ForeignKeyDrop,
			phase: ChangesetPhase.Alter,
			tableName: resolvePreviousTableName(tableName, context),
			currentTableName: resolveCurrentTableName(tableName, context),
			schemaName: context.schemaName,
			type: ChangesetType.DropForeignKey,
			up: dropForeignKey({
				schemaName: context.schemaName,
				tableName: resolvePreviousTableName(tableName, context),
				name: definition.name,
				debug: context.debug,
			}),
			down: createForeignKey({
				schemaName: context.schemaName,
				tableName: resolvePreviousTableName(tableName, context),
				definition,
				debug: false,
			}),
		};
		return changeset;
	});
}

export function dropMultipleForeignKeyChangeset(
	diff: DropMultipleForeignKeyDiff,
) {
	return Effect.all(
		Object.entries(diff.oldValue).map(([hash, oldValue]) => {
			return gen(function* () {
				return yield* dropForeignKeyChangeset({
					type: "REMOVE",
					path: ["foreignKeyConstraints", diff.path[1], hash],
					oldValue,
				});
			});
		}),
	);
}
