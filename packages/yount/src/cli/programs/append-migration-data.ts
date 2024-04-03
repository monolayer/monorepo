import { InsertWritable } from "../components/dump-structure.js";
import { pipeCommandStdoutToWritable } from "./pipe-command-stdout-to-writable.js";

export function appendMigrationData(database: string, dumpPath: string) {
	const migrationDumpArgs = [
		"--no-privileges",
		"--no-owner",
		"--schema=public",
		"--inserts",
		"--table=kysely_migration_lock",
		"--table=kysely_migration",
		"-a",
		"--no-comments",
		`${database}`,
	];

	return pipeCommandStdoutToWritable(
		"pg_dump",
		migrationDumpArgs,
		new InsertWritable(dumpPath),
	);
}
