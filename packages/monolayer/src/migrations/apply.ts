import * as p from "@clack/prompts";
import { Effect } from "effect";
import type { MigrationResult } from "kysely";
import color from "picocolors";
import { UnknownActionError } from "~/cli/errors.js";
import { dumpDatabaseStructureTask } from "~/database/dump.js";
import { Migrator } from "../services/migrator.js";

export function applyMigrations() {
	return Effect.gen(function* () {
		const result = yield* migrate;
		if (result) {
			yield* dumpDatabaseStructureTask;
		}
		return result;
	});
}

export const migrate = Effect.gen(function* () {
	const migrator = yield* Migrator;
	const { error, results } = yield* migrator.migrateToLatest(true);
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
		return true;
	} else {
		return false;
	}
});

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
