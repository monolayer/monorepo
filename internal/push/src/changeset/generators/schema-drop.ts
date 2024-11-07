import { gen } from "effect/Effect";
import color from "picocolors";
import {
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
	type CodeChangeset,
} from "~push/changeset/types/changeset.js";
import { type DropSchemaDiff } from "~push/changeset/types/diff.js";
import { ChangeWarningType } from "~push/changeset/warnings/change-warning-type.js";
import { ChangeWarningCode } from "~push/changeset/warnings/codes.js";
import { ChangesetGeneratorState } from "~push/state/changeset-generator.js";
import { createSchema, dropSchema } from "../../ddl/ddl.js";

export function dropSchemaChangeset(diff: DropSchemaDiff) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		const schemaName = diff.path[1];
		return {
			priority: MigrationOpPriority.DropSchema,
			phase: ChangesetPhase.Contract,
			tableName: "none",
			currentTableName: "none",
			schemaName,
			type: ChangesetType.DropSchema,
			warnings: [
				{
					type: ChangeWarningType.Destructive,
					code: ChangeWarningCode.SchemaDrop,
					schema: schemaName,
				},
			],
			up: dropSchema({ diff, logOutput: context.debug, warnings }),
			down: createSchema({ diff, logOutput: context.debug }),
		} satisfies CodeChangeset as CodeChangeset;
	});
}

const warnings = `
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
