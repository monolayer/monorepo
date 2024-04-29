import * as p from "@clack/prompts";
import { select } from "@clack/prompts";
type MigrationSelection = {
	value: string;
	label?: string | undefined;
	hint?: string | undefined;
};

export async function rollbackMigrationPrompt(
	migrations: MigrationSelection[],
) {
	const selection = await select<MigrationSelection[], string>({
		message: "Select a migration to rollback to:",
		options: migrations.map((migration) => ({
			value: migration.value,
		})),
	});
	return selection;
}

export async function confirmRollbackPrompt(migrations: string[]) {
	p.log.warning(`The following migrations will be discarded:
${migrations.map((migration) => `- ${migration}`).join("\n")}`);
	return await p.confirm({
		initialValue: false,
		message: `Do you want to continue?`,
	});
}

export async function confirmRollbackWithScaffoldedMigrationsPrompt(
	migrations: string[],
) {
	p.log.warning(`Some of the migrations to be discarded are scaffolded`);
	p.log.message(
		"Their changes will not be added to the new migrations and the resulting migration may fail.",
	);
	p.log.message(`Scaffolded migrations:
${migrations.map((migration) => `- ${migration}`).join("\n")}`);
	return await p.confirm({
		initialValue: false,
		message: `Do you want to continue?`,
	});
}

export async function confirmDeletePendingMigrationsPrompt() {
	return await p.confirm({
		initialValue: false,
		message: `Do you want to delete the migration files?`,
	});
}
