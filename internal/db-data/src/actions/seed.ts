import type { Command } from "@commander-js/extra-typings";
import { seedScaffold } from "./seed/scaffold.js";
import { seedUp } from "./seed/up.js";

export function seedCommands(program: Command) {
	const seed = program.command("seed").description("Seed commands");
	seedUp(seed);
	seedScaffold(seed);
}
