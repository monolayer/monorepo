import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { structureLoad } from "@monorepo/programs/database/structure-load.js";
import { headlessCliAction } from "~db/cli-action.js";

export function resetDb(program: Command) {
	commandWithDefaultOptions({
		name: "reset",
		program: program,
	})
		.description("Restores a database from its structure file")
		.action(async (opts) => {
			await headlessCliAction(opts, [structureLoad]);
		});
}
