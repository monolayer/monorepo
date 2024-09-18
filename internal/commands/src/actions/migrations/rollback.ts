import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { rollback } from "@monorepo/programs/migrations/rollback.js";
import {
	PackageNameState,
	makePackageNameState,
} from "@monorepo/state/package-name.js";
import { Effect, Layer } from "effect";
import { cliAction } from "~commands/cli-action.js";

export function rollbackAction(program: Command, packageName: string) {
	return commandWithDefaultOptions({
		name: "rollback",
		program: program,
	})
		.description("Rollback applied migrations to a previous base migration.")
		.action(async (opts) => {
			await cliAction("Rollback", opts, [
				Effect.provide(
					rollback,
					Layer.effect(PackageNameState, makePackageNameState(packageName)),
				),
			]);
		});
}
