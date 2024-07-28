import * as p from "@clack/prompts";
import { Effect } from "effect";
import type { MigrationResult } from "kysely";
import color from "picocolors";
import { ActionError, UnknownActionError } from "~/cli/errors.js";
import { dumpDatabaseStructureTask } from "~/database/dump.js";
import { ChangesetPhase } from "../changeset/types.js";
import { Migrator } from "../services/migrator.js";
import { checkNoPendingMigrations } from "./pending.js";

export function applyMigrations(phase: ChangesetPhase | "all") {
	return Effect.gen(function* () {
		const migrator = yield* Migrator;
		let noPending: boolean = true;
		let pendingPhases: ChangesetPhase[] = [];
		switch (phase) {
			case ChangesetPhase.Alter:
				[noPending, pendingPhases] = yield* checkNoPendingMigrations([
					ChangesetPhase.Expand,
				]);
				break;
			case ChangesetPhase.Contract:
				[noPending, pendingPhases] = yield* checkNoPendingMigrations([
					ChangesetPhase.Expand,
					ChangesetPhase.Alter,
				]);
				break;
			default:
				break;
		}

		if (!noPending) {
			yield* Effect.fail(
				new ActionError(
					`Cannot apply ${phase} migrations`,
					pendingPhases.length > 1
						? `There are pending ${pendingPhases.join(" and ")} migrations to apply.`
						: `There are pending ${pendingPhases.join()} migrations to apply.`,
				),
			);
		}

		const { error, results } =
			phase === "all"
				? yield* migrator.migrateToLatest(true)
				: yield* migrator.migratePhaseToLatest(phase, true);

		if (results !== undefined && results.length > 0) {
			for (const result of results) {
				yield* logMigrationResultStatus(result, error, "up");
			}
		}

		if (results !== undefined && results.length === 0) {
			p.log.info("No migrations to apply.");
		}
		if (error !== undefined) {
			yield* Effect.fail(new UnknownActionError("Migration error", error));
		}
		if (error === undefined && results !== undefined) {
			yield* dumpDatabaseStructureTask;
			return true;
		} else {
			return false;
		}
	});
}

export function logMigrationResultStatus(
	result: MigrationResult,
	error: unknown,
	direction: "up" | "down",
) {
	const action = direction === "up" ? "APPLIED" : "REVERTED";
	switch (result.status) {
		case "Success":
			p.log.success(
				`${color.bgGreen(color.black(` ${action} `))} ${result.migrationName}${error !== undefined ? "(ROLLBACK)" : ""}`.trimEnd(),
			);
			break;
		case "Error":
			p.log.error(
				`${color.bgRed(color.black(" ERROR "))} ${result.migrationName} (ROLLBACK)`.trimEnd(),
			);
			break;
		case "NotExecuted":
			p.log.warn(
				`${color.bgYellow(color.black(" NOT EXECUTED "))} ${result.migrationName}`,
			);
			break;
	}
	return Effect.succeed(true);
}
