import * as p from "@clack/prompts";
import { exit } from "process";
import slug from "slug";
import { Config } from "~/config.js";
import { Changeset } from "~/database/migration_op/changeset.js";
import { generateMigrationFiles } from "~/database/migrations/generate.js";
import { ActionStatus, throwableOperation } from "../command.js";

export async function generateMigrations(
	changeset: Changeset[],
	config: Config,
) {
	const result = await throwableOperation<typeof generateMigrationFiles>(
		async () => {
			const migrationName = await p.group(
				{
					value: () =>
						p.text({
							message: "How should we name the migration",
							placeholder: "Enter a migration name",
							validate: (value) => {
								if (value === "") return "Please enter a migration name.";
							},
						}),
				},
				{
					onCancel: () => {
						p.cancel("Operation cancelled.");
						process.exit(0);
					},
				},
			);
			generateMigrationFiles(
				changeset,
				config.folder,
				slug(migrationName.value),
			);
		},
	);
	if (result.status === ActionStatus.Error) {
		p.cancel("Unexpected error while generating migration files.");
		console.error(result.error);
		exit(1);
	}
	const nextSteps = `To apply migrations, run \'npx kinetic migrate\'`;
	p.note(nextSteps, "Next Steps");
}
