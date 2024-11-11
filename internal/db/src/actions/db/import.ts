import type { Command } from "@commander-js/extra-typings";
import { cliActionWithoutContext } from "~db/cli-action.js";
import { importSchema } from "../import-schema.js";

export function importDb(program: Command) {
	program
		.command("import")
		.description("imports schema")
		.action(async () => {
			await cliActionWithoutContext("Import database", [importSchema]);
		});
}
