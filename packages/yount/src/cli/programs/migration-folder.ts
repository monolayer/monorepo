import { Effect } from "effect";
import path from "path";
import { cwd } from "process";
import type { Config } from "~/config.js";

export function migrationFolder(
	config: Config,
	migrationsFolderName = "migrations",
) {
	const migrationFolder = path.join(cwd(), config.folder, migrationsFolderName);
	return Effect.succeed(migrationFolder);
}
