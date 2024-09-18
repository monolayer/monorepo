import type { Command } from "@commander-js/extra-typings";

export function migrationsCommand(program: Command) {
	const migrations = program.command("migrations");

	migrations.description("Migrations commands");
	return migrations;
}
