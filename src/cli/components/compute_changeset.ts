import * as p from "@clack/prompts";
import color from "picocolors";
import { exit } from "process";
import { changeset } from "~/changeset/changeset.js";
import { Changeset } from "~/changeset/migration_op/changeset.js";
import type { MigrationSchema } from "~/migrations/migration_schema.js";

export async function computeChangeset(
	local: MigrationSchema,
	remote: MigrationSchema,
	log = true,
): Promise<Changeset[]> {
	const c = p.spinner();
	if (log) {
		c.start("Computing change set");
	}
	const cset = changeset(local, remote);
	if (log) {
		c.stop("Computed change set.");
	}
	if (cset.length === 0) {
		if (log) {
			p.outro(`${color.green("Nothing to do")}. No schema changes found.`);
		}
		exit(0);
	}
	return cset;
}
