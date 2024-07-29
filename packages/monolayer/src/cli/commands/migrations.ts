import type { Command } from "@commander-js/extra-typings";
import { generateAction } from "../actions/generate.js";
import { pendingAction } from "../actions/pending.js";
import { scaffoldCommand } from "../actions/scaffold.js";

export function migrationsCommand(program: Command) {
	const migrations = program.command("migrations");

	migrations.description("Migrations commands");

	scaffoldCommand(migrations);
	pendingAction(migrations);
	generateAction(migrations);

	return migrations;
}
