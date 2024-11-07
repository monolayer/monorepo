import type { Command } from "@commander-js/extra-typings";

export function dbCommand(program: Command) {
	const db = program.command("db");
	db.description("Database commands");
	return db;
}
