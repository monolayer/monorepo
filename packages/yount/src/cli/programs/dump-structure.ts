import { DumpWritable } from "~/cli/components/dump-structure.js";
import { pipeCommandStdoutToWritable } from "~/cli/programs/pipe-command-stdout-to-writable.js";

export function dumpStructure(database: string, dumpPath: string) {
	const args = [
		"--schema-only",
		"--no-privileges",
		"--no-owner",
		"--schema=public",
		`${database}`,
	];
	return pipeCommandStdoutToWritable(
		"pg_dump",
		args,
		new DumpWritable(dumpPath),
	);
}
