import * as p from "@clack/prompts";
import color from "picocolors";
import { exit } from "process";
import { Changeset, changeset } from "~/database/changeset.js";
import type { RemoteSchema } from "~/database/introspection/remote_schema.js";
import { IndexInfo, TableColumnInfo } from "~/database/introspection/types.js";

export async function computeChangeset(
	localTableInfo: {
		table: TableColumnInfo;
		index: IndexInfo;
	},
	remoteColumnInfo: RemoteSchema,
): Promise<Changeset[]> {
	const c = p.spinner();
	c.start("Computing change set");
	const cset = changeset(localTableInfo, {
		table: remoteColumnInfo.table,
		index: remoteColumnInfo.index,
	});
	c.stop("Computed change set.");

	if (cset.length === 0) {
		p.outro(`${color.green("Nothing to do")}. No schema changes found.`);
		exit(0);
	}
	return cset;
}
