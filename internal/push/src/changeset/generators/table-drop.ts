import { gen } from "effect/Effect";
import color from "picocolors";
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
import { ChangeWarningType } from "~push/changeset/warnings/change-warning-type.js";
import { ChangeWarningCode } from "~push/changeset/warnings/codes.js";
import { ChangesetGeneratorState } from "~push/state/changeset-generator.js";
import { createTable, dropTable } from "../../ddl/ddl.js";

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
			warnings: [
				{
					type: ChangeWarningType.Destructive,
					code: ChangeWarningCode.TableDrop,
					schema: context.schemaName,
					table: currentTableName,
				},
			],
			up: async (db: AnyKysely) => {
				await dropTable({
					db,
					context,
					tableName,
					logOutput: context.debug,
					warnings: context.debug ? tableDropWarning() : undefined,
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
					logOutput: false,
				});
			},
			schemaName: context.schemaName,
		};
		return changeset;
	});
}

function tableDropWarning() {
	return `
  ${color.bgYellow(color.black(" WARNING "))} Destructive Changes

  ${color.gray("Dropping a table may result in a data loss.")}
  ${color.gray("To avoid this, archive existing data so that it can be restored.")}

  ${color.bgYellow(color.black(" WARNING "))} Breaking Changes

  ${color.gray("Dropping a table may brake existing applications that rely on it during deployment.")}
  ${color.gray("You can avoid this by:")}
    ${color.gray("1. Refactor existing application code to not use the table.")}
    ${color.gray("2. Deploy the application version that does not reference the table.")}
    ${color.gray("3. Remove the table from the schema definition.")}
    ${color.gray("4. Deploy the new application version.")}
`.replace("\n", "");
}
