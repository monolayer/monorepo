import * as p from "@clack/prompts";
import color from "picocolors";
import { exit } from "process";
import { changeset } from "~/database/changeset.js";
import { Changeset } from "~/database/migration_op/changeset.js";
import type { MigrationSchema } from "~/database/migrations/migration_schema.js";

export async function computeChangeset(
	local: MigrationSchema,
	remote: MigrationSchema,
): Promise<Changeset[]> {
	const c = p.spinner();
	c.start("Computing change set");
	const cset = changeset(local, remote);
	c.stop("Computed change set.");

	if (cset.length === 0) {
		p.outro(`${color.green("Nothing to do")}. No schema changes found.`);
		exit(0);
	}
	return cset;
}
