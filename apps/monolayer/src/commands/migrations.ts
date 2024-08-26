import type { Command } from "@commander-js/extra-typings";
import { applyAction } from "~monolayer/actions/apply.js";
import { generateAction } from "~monolayer/actions/generate.js";
import { pendingAction } from "~monolayer/actions/pending.js";
import { scaffoldAction } from "~monolayer/actions/scaffold.js";

export function migrationsCommand(program: Command) {
	const migrations = program.command("migrations");

	migrations.description("Migrations commands");

	pendingAction(migrations);
	generateAction(migrations);
	scaffoldAction(migrations);
	applyAction(migrations);
	return migrations;
}
