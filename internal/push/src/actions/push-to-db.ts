import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { headlessCliAction } from "@monorepo/db/cli-action.js";
import { handleMissingDatabase } from "@monorepo/programs/database/handle-missing.js";
import { flatMap } from "effect/Effect";
import { generators } from "~push/changeset/generators.js";
import { pushDb } from "~push/push-db.js";
import { ChangesetGeneratorState } from "~push/state/changeset-generator.js";
import { MigrationOpsGeneratorsState } from "~push/state/migration-ops-generators.js";
import { RenameState } from "~push/state/rename.js";

export function pushToDb(program: Command) {
	commandWithDefaultOptions({
		name: "dev",
		program,
	})
		.option("-v, --verbose", "Print SQL statements", false)
		.description("push schema changes (development)")
		.action(async (opts) => {
			await headlessCliAction(opts, [
				handleMissingDatabase.pipe(
					flatMap(() =>
						ChangesetGeneratorState.provide(
							MigrationOpsGeneratorsState.provide(
								RenameState.provide(pushDb(true)),
								generators,
							),
						),
					),
				),
			]);
		});
}

export const providedPushDb = ChangesetGeneratorState.provide(
	MigrationOpsGeneratorsState.provide(
		RenameState.provide(pushDb(true)),
		generators,
	),
);
