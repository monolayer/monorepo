import { Effect } from "effect";
import { gen } from "effect/Effect";
import {
	createUniqueConstraintWithIndex,
	dropUniqueConstraint,
} from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import {
	existingColumns,
	resolveCurrentTableName,
	uniqueConstraintDefinitionFromString,
} from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";
import type {
	CreateMultipleUniqueDiff,
	CreateUniqueDiff,
} from "../types/diff.js";
import { addUniqueToExisitingColumnWarning } from "../warnings.js";

export function createUniqueConstraintChangeset(diff: CreateUniqueDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const hashValue = diff.path[2];
		const uniqueConstraint = uniqueConstraintDefinitionFromString(
			diff.value,
			tableName,
			hashValue,
		);

		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.UniqueCreate,
			phase: ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.CreateUnique,
			transaction: false,
			up: createUniqueConstraintWithIndex({
				schemaName: context.schemaName,
				tableName,
				definition: uniqueConstraint,
				debug: context.debug,
			}),
			down: dropUniqueConstraint({
				schemaName: context.schemaName,
				tableName,
				name: uniqueConstraint.name,
				debug: false,
			}),
		};

		const existingColumnsWithUniqueAdded = existingColumns({
			columns: uniqueConstraint.columns,
			table: tableName,
			local: context.local,
			db: context.db,
		});

		if (existingColumnsWithUniqueAdded.length > 0) {
			changeset.warnings = [addUniqueToExisitingColumnWarning];
		}
		return changeset;
	});
}

export function createMultipleUniqueConstraintsChangeset(
	diff: CreateMultipleUniqueDiff,
) {
	return Effect.all(
		Object.entries(diff.value).map(([hash, value]) =>
			gen(function* () {
				const createDiff: CreateUniqueDiff = {
					type: "CREATE",
					path: ["uniqueConstraints", diff.path[1], hash!],
					value: value!,
				};
				return yield* createUniqueConstraintChangeset(createDiff);
			}),
		),
	);
}
