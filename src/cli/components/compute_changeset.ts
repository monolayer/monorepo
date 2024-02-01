import * as p from "@clack/prompts";
import { TableColumnInfo, TableIndexInfo } from "~/database/change_set/diff.js";
import { IndexInfo } from "~/database/change_set/info.js";
import { DbChangeset, dbChangeset } from "~/database/db_changeset.js";
import { OperationSuccess } from "../command.js";

export async function computeChangeSet(
	localTableInfo: {
		columns: TableColumnInfo;
		indexes: TableIndexInfo;
	},
	remoteColumnInfo: {
		columns: OperationSuccess<TableColumnInfo>;
		indexes: OperationSuccess<IndexInfo>;
	},
): Promise<DbChangeset> {
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

	if (Object.keys(changeset).length === 0) {
		p.log.info("No changes found.");
	}
	return changeset;
}
