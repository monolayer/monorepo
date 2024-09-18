import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { dropDatabase } from "@monorepo/programs/database/drop-database.js";
import {
	makePackageNameState,
	PackageNameState,
} from "@monorepo/state/package-name.js";
import { Effect, Layer } from "effect";
import { cliAction } from "~commands/cli-action.js";

export function dropDb(program: Command, packageName: string) {
	commandWithDefaultOptions({
		name: "drop",
		program: program,
	})
		.description("drops a database")
		.action(
			async (opts) =>
				await cliAction("Drop Database", opts, [
					Effect.provide(
						dropDatabase,
						Layer.effect(PackageNameState, makePackageNameState(packageName)),
					),
				]),
		);
}
