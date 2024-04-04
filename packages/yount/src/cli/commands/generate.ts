import { generateChangesetMigration } from "../programs/generate-changeset-migration.js";
import { handlePendingMigrations } from "../programs/pending-migrations.js";
import { cliAction } from "../utils/cli-action.js";

export async function generate(environment: string) {
	await cliAction("yount generate", environment, [
		handlePendingMigrations(),
		generateChangesetMigration(),
	]);
}
