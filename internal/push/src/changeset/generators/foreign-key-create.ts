import { Effect } from "effect";
import { gen } from "effect/Effect";
import { createForeignKey, dropForeignKey } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import {
	foreignKeyDefinition,
	resolveCurrentTableName,
} from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type {
	CreateForeignKeyDiff,
	CreateMultipleForeignKeyDiff,
} from "../types/diff.js";

export function createForeignKeyChangeset(diff: CreateForeignKeyDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = resolveCurrentTableName(diff.path[1], context);
		const definition = foreignKeyDefinition(
			tableName,
			diff.path[2],
			context.local,
			"current",
			{
				columnsToRename: context.columnsToRename,
				tablesToRename: context.tablesToRename,
				camelCase: context.camelCase,
				schemaName: context.schemaName,
			},
		);

		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.ForeignKeyCreate,
			phase: ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.CreateForeignKey,
			up: createForeignKey({
				schemaName: context.schemaName,
				tableName,
				definition,
				debug: context.debug,
			}),
			down: dropForeignKey({
				schemaName: context.schemaName,
				tableName: resolveCurrentTableName(tableName, context),
				name: definition.name,
				debug: context.debug,
			}),
		};
		return changeset;
	});
}

export function createMultipleForeignKeyChangeset(
	diff: CreateMultipleForeignKeyDiff,
) {
	return Effect.all(
		Object.entries(diff.value).map(([hash, value]) => {
			return gen(function* () {
				return yield* createForeignKeyChangeset({
					type: "CREATE",
					path: ["foreignKeyConstraints", diff.path[1], hash],
					value,
				});
			});
		}),
	);
}
