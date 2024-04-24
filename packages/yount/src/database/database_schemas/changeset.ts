import { executeKyselyDbStatement } from "~/changeset/helpers.js";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";

export function createSchemaChangeset(schemaName: string) {
	const changeset: Changeset = {
		priority: MigrationOpPriority.Database,
		tableName: "none",
		currentTableName: "none",
		schemaName: null,
		type: ChangeSetType.CreateSchema,
		up: [
			executeKyselyDbStatement(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`),
		],
		down: [],
	};
	return changeset;
}
