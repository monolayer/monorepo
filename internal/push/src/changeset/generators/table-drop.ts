import { gen } from "effect/Effect";
import {
	resolveTableName,
	type AnyKysely,
} from "~push/changeset/introspection.js";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "~push/changeset/types/changeset.js";
import {
	type CreateTableDiff,
	type DropTableDiff,
} from "~push/changeset/types/diff.js";
import { ChangesetGeneratorState } from "~push/state/changeset-generator.js";
import { createTable, dropTable } from "../../ddl/ddl.js";
import { destructiveWarning } from "../warnings.js";

export function dropTableChangeset(dropTableDiff: DropTableDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const tableName = dropTableDiff.path[1];
		const currentTableName = yield* resolveTableName(tableName, "current");
		const changeset: CodeChangeset = {
			priority: MigrationOpPriority.TableDrop,
			phase: ChangesetPhase.Contract,
			tableName: tableName,
			currentTableName,
			type: ChangesetType.DropTable,
			warnings: [destructiveWarning],
			up: async (db: AnyKysely) => {
				await dropTable({
					db,
					context,
					tableName,
					debug: context.debug,
				});
			},
			down: async (db: AnyKysely) => {
				const createTableDiff = {
					type: "CREATE",
					path: ["table", tableName],
					value: dropTableDiff.oldValue,
				} satisfies CreateTableDiff;
				await createTable({
					diff: createTableDiff,
					context,
					db,
					debug: false,
				});
			},
			schemaName: context.schemaName,
		};
		return changeset;
	});
}
