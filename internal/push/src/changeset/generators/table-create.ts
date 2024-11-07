import { gen } from "effect/Effect";
import { type CreateTableDiff } from "~push/changeset/types/diff.js";
import { createTable, dropTable } from "../../ddl/ddl.js";
import { ChangesetGeneratorState } from "../../state/changeset-generator.js";
import { resolveTableName, type AnyKysely } from "../introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "../types/changeset.js";

export function createTableChangeset(createTableDiff: CreateTableDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = createTableDiff.path[1];
		const changeset: CodeChangeset = {
			type: ChangesetType.CreateTable,
			priority: MigrationOpPriority.TableCreate,
			phase: ChangesetPhase.Expand,
			tableName: tableName,
			currentTableName: yield* resolveTableName(tableName, "current"),
			up: async (db: AnyKysely) => {
				await createTable({
					diff: createTableDiff,
					context,
					db,
					logOutput: context.debug,
				});
			},
			down: async (db: AnyKysely) => {
				await dropTable({
					tableName,
					db,
					context,
					logOutput: false,
				});
			},
			schemaName: context.schemaName,
		};
		return changeset;
	});
}
