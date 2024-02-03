import * as p from "@clack/prompts";
import color from "picocolors";
import { exit } from "process";
import { Changeset, changeset } from "~/database/changeset.js";
import { IndexInfo, TableColumnInfo } from "~/database/introspection/types.js";
import { OperationSuccess } from "../command.js";

export async function computeChangeset(
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
	const cset = changeset(localTableInfo, {
		table: remoteColumnInfo.table.result,
		index: remoteColumnInfo.index.result,
	});
	c.stop("Computed change set.");

	if (cset.length === 0) {
		p.outro(`${color.green("Nothing to do")}. No schema changes found.`);
		exit(0);
	}
	return cset;
}
