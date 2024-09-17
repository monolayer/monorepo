import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { ChangesetGeneratorState } from "@monorepo/pg/changeset/changeset-generator.js";
import { handleMissingDatabase } from "@monorepo/programs/database/handle-missing.js";
import { generateMigration } from "@monorepo/programs/migrations/generate.js";
import { handlePendingSchemaMigrations } from "@monorepo/programs/migrations/pending.js";
import { TableRenameState } from "@monorepo/programs/table-renames.js";
import {
	makePackageNameState,
	PackageNameState,
} from "@monorepo/state/package-name.js";
import { Effect, Layer } from "effect";
import { cliAction } from "~commands/cli-action.js";

export function generateAction(program: Command, packageName: string) {
	commandWithDefaultOptions({
		name: "generate",
		program,
	})
		.description("generate a schema migration")
		.action(async (opts) => {
			await cliAction("monolayer generate", opts, [
				handleMissingDatabase,
				handlePendingSchemaMigrations,
				ChangesetGeneratorState.provide(
					TableRenameState.provide(
						Effect.provide(
							generateMigration,
							Layer.effect(PackageNameState, makePackageNameState(packageName)),
						),
					),
				),
			]);
		});
}
