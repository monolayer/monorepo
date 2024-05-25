import type { Command } from "@commander-js/extra-typings";
import { cliActionWithoutContext } from "~/cli/cli-action.js";
import { importSchema } from "~/cli/import-schema.js";

export function importSchemaAction(program: Command) {
	program
		.command("import-schema")
		.description("imports schema")
		.action(async () => {
			await cliActionWithoutContext("monolayer import", [importSchema]);
		});
}
