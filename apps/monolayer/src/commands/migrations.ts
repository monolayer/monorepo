import type { Command } from "@commander-js/extra-typings";
import { applyCommands } from "~monolayer/actions/apply.js";
import { generateAction } from "~monolayer/actions/generate.js";
import { pendingAction } from "~monolayer/actions/pending.js";
import { scaffoldCommands } from "~monolayer/actions/scaffold.js";

export function migrationsCommand(program: Command) {
	const migrations = program.command("migrations");

	migrations.description("Migrations commands");

	pendingAction(migrations);
	generateAction(migrations);
	scaffoldCommands(migrations);
	applyCommands(migrations);

	return migrations;
}
