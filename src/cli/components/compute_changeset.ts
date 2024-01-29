import * as p from "@clack/prompts";
import { TableInfo } from "~/database/change_set/table_diff.js";
import { ChangeSet, dbChangeset } from "~/database/db_changeset.js";
import { OperationSuccess } from "../command.js";

export async function computeChangeSet(
	localTableInfo: TableInfo,
	remoteColumnInfo: OperationSuccess<TableInfo>,
): Promise<ChangeSet> {
	const c = p.spinner();
	c.start("Computing change set");
	const changeset = dbChangeset(localTableInfo, remoteColumnInfo.result);
	c.stop("Computed change set.");

	if (changeset.length === 0) {
		p.log.info("No changes found.");
	}
	return changeset;
}
