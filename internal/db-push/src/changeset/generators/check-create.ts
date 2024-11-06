import { redefineCheck } from "@monorepo/pg/introspection/check.js";
import { Effect } from "effect";
import { gen } from "effect/Effect";
import { resolveCurrentTableName } from "~db-push/changeset/introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "~db-push/changeset/types/changeset.js";
import {
	type CreateCheckDiff,
	type CreateMultipleCheckDiff,
} from "~db-push/changeset/types/diff.js";
import { ChangesetGeneratorState } from "~db-push/state/changeset-generator.js";
import { createCheckConstraint, dropCheckConstraint } from "../../ddl/ddl.js";

export function createCheckChangeset(diff: CreateCheckDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = diff.path[1];
		const check = {
			tableName,
			schemaName: context.schemaName,
			...redefineCheck(
				diff.value,
				"current",
				tableName,
				context.columnsToRename,
				context.schemaName,
			),
		};
		const changeSet: CodeChangeset = {
			priority: MigrationOpPriority.CheckCreate,
			phase: context.addedTables.includes(tableName)
				? ChangesetPhase.Expand
				: ChangesetPhase.Alter,
			schemaName: context.schemaName,
			tableName: tableName,
			currentTableName: resolveCurrentTableName(tableName, context),
			type: ChangesetType.CreateCheck,
			up: createCheckConstraint({
				check,
				debug: context.debug,
			}),
			down: dropCheckConstraint({
				check,
				debug: false,
			}),
		};
		return changeSet;
	});
}

export function createMultipleCheckChangeset(diff: CreateMultipleCheckDiff) {
	return Effect.all(
		Object.keys(diff.value).map((checkHash) =>
			gen(function* () {
				return yield* createCheckChangeset({
					type: "CREATE",
					path: ["checkConstraints", diff.path[1], checkHash],
					value: diff.value[checkHash]!,
				} satisfies CreateCheckDiff);
			}),
		),
	);
}
