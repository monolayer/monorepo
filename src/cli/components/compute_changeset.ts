import * as p from "@clack/prompts";
import { Changeset, dbChangeset } from "~/database/changeset.js";
import { IndexInfo, TableColumnInfo } from "~/database/introspection/types.js";
import { OperationSuccess } from "../command.js";

export async function computeChangeSet(
	localTableInfo: {
		table: TableColumnInfo;
		index: IndexInfo;
	},
	remoteColumnInfo: {
		table: OperationSuccess<TableColumnInfo>;
		index: OperationSuccess<IndexInfo>;
	},
): Promise<Changeset[]> {
	const c = p.spinner();
	c.start("Computing change set");
	const changeset = dbChangeset(localTableInfo, {
		table: remoteColumnInfo.table.result,
		index: remoteColumnInfo.index.result,
	});
	c.stop("Computed change set.");

	if (changeset.length === 0) {
		p.log.info("No changes found.");
	}
	return changeset;
}
