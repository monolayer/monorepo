import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { logEmpty } from "@monorepo/cli/console.js";
import type { ActionErrors } from "@monorepo/cli/errors.js";
import { headlessCliAction } from "@monorepo/db/cli-action.js";
import type { ProgramContext } from "@monorepo/services/program-context.js";
import type { Effect } from "effect";
import { all, gen } from "effect/Effect";
import { dataInfo } from "~data/programs/data-info.js";
import { DataCLIState } from "~data/state.js";

export function dataAction(program: Command, name: string) {
	return commandWithDefaultOptions({
		name,
		program,
	}).option("-f, --folder <folder-name>", "Folder with data migrations");
}

export async function dataActionWithEffect<A>(
	effect: Effect.Effect<A, ActionErrors, ProgramContext | DataCLIState>,
	opts: {
		databaseId: string;
		folder?: string;
		envFile?: string;
		verbose?: boolean;
	},
) {
	await headlessCliAction(opts, [
		DataCLIState.provide(
			all([
				gen(function* () {
					yield* dataInfo;
					logEmpty();
				}),
				effect,
			]),
			{ folder: opts.folder },
		),
	]);
}
