import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { headlessCliAction } from "@monorepo/commands/cli-action.js";
import { handleMissingDatabase } from "@monorepo/programs/database/handle-missing.js";
import { flatMap } from "effect/Effect";
import { generators } from "~db-push/changeset/generators.js";
import { providerRenamesFromFiles } from "~db-push/migrator/renames.js";
import { pushDb } from "~db-push/push-db.js";
import { ChangesetGeneratorState } from "~db-push/state/changeset-generator.js";
import { MigrationOpsGeneratorsState } from "~db-push/state/migration-ops-generators.js";
import { RenameState } from "~db-push/state/rename.js";

export function syncDb(program: Command, packageName: string) {
	commandWithDefaultOptions({
		name: "prod",
		program,
	})
		.option("-v, --verbose", "Print SQL statements", false)
		.description("push schema changes (development)")
		.action(async (opts) => {
			await headlessCliAction(opts, [
				handleMissingDatabase.pipe(
					flatMap(() => providerRenamesFromFiles),
					flatMap((renames) =>
						ChangesetGeneratorState.provide(
							MigrationOpsGeneratorsState.provide(
								RenameState.provide(pushDb(false), renames),
								generators,
							),
						),
					),
				),
			]);
		});
}
