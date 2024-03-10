import * as p from "@clack/prompts";
import { exit } from "process";
import { Changeset } from "~/changeset/migration_op/changeset.js";
import { Config } from "~/config.js";
import { generateMigrationFiles } from "~/migrations/generate.js";
import { ActionStatus, throwableOperation } from "../command.js";

export async function generateMigrations(
	changeset: Changeset[],
	config: Config,
) {
	const result = await throwableOperation<typeof generateMigrationFiles>(
		async () => {
			generateMigrationFiles(changeset, config.folder);
		},
	);
	if (result.status === ActionStatus.Error) {
		p.cancel("Unexpected error while generating migration files.");
		console.error(result.error);
		exit(1);
	}
	const nextSteps = "To apply migrations, run 'npx kinetic migrate'";
	p.note(nextSteps, "Next Steps");
}
