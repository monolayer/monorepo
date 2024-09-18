import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { createDatabase } from "@monorepo/programs/database/create-database.js";
import {
	makePackageNameState,
	PackageNameState,
} from "@monorepo/state/package-name.js";
import { Effect, Layer } from "effect";
import { cliAction } from "~commands/cli-action.js";

export function createDb(program: Command, packageName: string) {
	commandWithDefaultOptions({
		name: "create",
		program: program,
	})
		.description("creates a database")
		.action(
			async (opts) =>
				await cliAction("Create Database", opts, [
					Effect.provide(
						createDatabase,
						Layer.effect(PackageNameState, makePackageNameState(packageName)),
					),
				]),
		);
}
