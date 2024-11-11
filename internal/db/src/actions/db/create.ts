import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { createDatabase } from "@monorepo/programs/database/create-database.js";

import { headlessCliAction } from "~db/cli-action.js";

export function createDb(program: Command) {
	commandWithDefaultOptions({
		name: "create",
		program: program,
	})
		.description("creates a database")
		.action(async (opts) => {
			await headlessCliAction(opts, [createDatabase]);
		});
}
