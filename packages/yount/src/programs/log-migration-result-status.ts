import * as p from "@clack/prompts";
import { Effect } from "effect";
import type { MigrationResult } from "kysely";
import color from "picocolors";

export function logMigrationResultStatus(
	result: MigrationResult,
	error: unknown,
	direction: "up" | "down",
) {
	const action = direction === "up" ? "applied" : "reverted";
	switch (result.status) {
		case "Success":
			p.log.success(
				`${color.green(`${action} revision`)} ${result.migrationName}${error !== undefined ? "(ROLLBACK)" : ""}`.trimEnd(),
			);
			break;
		case "Error":
			p.log.error(
				`${color.red("error in revision")} ${result.migrationName} (ROLLBACK)`.trimEnd(),
			);
			break;
		case "NotExecuted":
			p.log.warn(`${color.yellow("not executed")} ${result.migrationName}`);
			break;
	}
	return Effect.succeed(true);
}
