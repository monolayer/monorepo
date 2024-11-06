import { Effect } from "effect";
import { gen } from "effect/Effect";
import {
	resolveCurrentTableName,
	resolvePreviousTableName,
} from "~db-push/changeset/introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "~db-push/changeset/types/changeset.js";
import {
	type DropCheckDiff,
	type DropMultipleCheckDiff,
} from "~db-push/changeset/types/diff.js";
import { ChangesetGeneratorState } from "~db-push/state/changeset-generator.js";
import { createCheckConstraint, dropCheckConstraint } from "../../ddl/ddl.js";

export function dropCheckChangeset(diff: DropCheckDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const previousTableName = resolvePreviousTableName(diff.path[1], context);
		const currentTableName = resolveCurrentTableName(diff.path[1], context);
		const checkHash = diff.path[2];

		const check = {
			name: `${currentTableName}_${checkHash}_monolayer_chk`,
			tableName: currentTableName,
			schemaName: context.schemaName,
		};

		const changeSet: CodeChangeset = {
			priority: MigrationOpPriority.CheckConstraintDrop,
			phase: ChangesetPhase.Contract,
			schemaName: context.schemaName,
			tableName: previousTableName,
			currentTableName,
			type: ChangesetType.DropCheck,
			up: dropCheckConstraint({
				check,
				debug: context.debug,
			}),
			down: createCheckConstraint({
				check: {
					...check,
					definition: diff.oldValue,
				},
				debug: false,
			}),
		};
		return changeSet;
	});
}

export function dropAllChecksChangeset(diff: DropMultipleCheckDiff) {
	return Effect.all(
		Object.keys(diff.oldValue).map((checkHash) =>
			gen(function* () {
				return yield* dropCheckChangeset({
					type: "REMOVE",
					path: ["checkConstraints", diff.path[1], checkHash],
					oldValue: diff.oldValue[checkHash]!,
				} satisfies DropCheckDiff);
			}),
		),
	);
}
