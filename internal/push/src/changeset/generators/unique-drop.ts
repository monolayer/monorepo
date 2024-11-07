import { Effect } from "effect";
import { gen } from "effect/Effect";
import {
	createUniqueConstraintWithIndex,
	dropUniqueConstraint,
} from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import {
	resolveCurrentTableName,
	resolvePreviousTableName,
	uniqueConstraintDefinitionFromString,
} from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type { DropMultipleUniqueDiff, DropUniqueDiff } from "../types/diff.js";

export function dropUniqueConstraintChangeset(diff: DropUniqueDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const hashValue = diff.path[2];
		const uniqueConstraint = uniqueConstraintDefinitionFromString(
			diff.oldValue,
			resolvePreviousTableName(tableName, context),
			hashValue,
		);
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.UniqueConstraintDrop,
			phase: ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: resolvePreviousTableName(tableName, context),
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.DropUnique,
			up: dropUniqueConstraint({
				schemaName: context.schemaName,
				tableName: resolvePreviousTableName(tableName, context),
				name: uniqueConstraint.name,
				debug: context.debug,
			}),
			// Down should run without transaction
			down: createUniqueConstraintWithIndex({
				schemaName: context.schemaName,
				tableName: resolvePreviousTableName(tableName, context),
				definition: uniqueConstraint,
				debug: false,
			}),
		};
		return changeset;
	});
}

export function dropMultipleUniqueConstraintChangeset(
	diff: DropMultipleUniqueDiff,
) {
	return Effect.all(
		Object.entries(diff.oldValue).map(([hash, value]) =>
			gen(function* () {
				const createDiff: DropUniqueDiff = {
					type: "REMOVE",
					path: ["uniqueConstraints", diff.path[1], hash!],
					oldValue: value!,
				};
				return yield* dropUniqueConstraintChangeset(createDiff);
			}),
		),
	);
}
