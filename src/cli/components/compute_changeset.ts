import * as p from "@clack/prompts";
import { Changeset, dbChangeset } from "~/database/changeset.js";
import { IndexInfo, TableColumnInfo } from "~/database/introspection/types.js";
import { OperationSuccess } from "../command.js";

export async function computeChangeSet(
	localTableInfo: {
		columns: TableColumnInfo;
		indexes: IndexInfo;
	},
	remoteColumnInfo: {
		columns: OperationSuccess<TableColumnInfo>;
		indexes: OperationSuccess<IndexInfo>;
	},
): Promise<Changeset[]> {
	const c = p.spinner();
	c.start("Computing change set");
	const changeset = dbChangeset(
		{
			columns: localTableInfo.columns,
			indexes: localTableInfo.indexes,
		},
		{
			columns: remoteColumnInfo.columns.result,
			indexes: remoteColumnInfo.indexes.result,
		},
	);
	c.stop("Computed change set.");

	if (changeset.length === 0) {
		p.log.info("No changes found.");
	}
	return changeset;
}
