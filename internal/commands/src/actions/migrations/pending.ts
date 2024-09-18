import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { logPendingMigrations } from "@monorepo/programs/migrations/pending.js";
import {
	PackageNameState,
	makePackageNameState,
} from "@monorepo/state/package-name.js";
import { Effect, Layer } from "effect";
import { cliAction } from "~commands/cli-action.js";

export function pendingAction(program: Command, packageName: string) {
	commandWithDefaultOptions({
		name: "pending",
		program,
	})
		.description("list pending schema migrations")
		.action(async (opts) => {
			await cliAction("Pending migrations", opts, [
				Effect.provide(
					logPendingMigrations,
					Layer.effect(PackageNameState, makePackageNameState(packageName)),
				),
			]);
		});
}
