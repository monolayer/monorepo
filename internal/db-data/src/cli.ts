import type { Command } from "@commander-js/extra-typings";
import { dataCommands } from "./actions/data.js";
import { seedCommands } from "./actions/seed.js";

export function dataCLI(program: Command) {
	dataCommands(program);
	seedCommands(program);
}
