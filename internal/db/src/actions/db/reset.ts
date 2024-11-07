import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { structureLoad } from "@monorepo/programs/database/structure-load.js";
import {
	makePackageNameState,
	PackageNameState,
} from "@monorepo/state/package-name.js";
import { Effect, Layer } from "effect";
import { cliAction } from "~db/cli-action.js";

export function resetDb(program: Command, packageName: string) {
	commandWithDefaultOptions({
		name: "reset",
		program: program,
	})
		.description("Restores a database from its structure file")
		.action(async (opts) => {
			await cliAction("Reset Database", opts, [
				Effect.provide(
					structureLoad(),
					Layer.effect(PackageNameState, makePackageNameState(packageName)),
				),
			]);
		});
}
