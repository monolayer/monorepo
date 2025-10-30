import type { Command } from "@commander-js/extra-typings";
import { bucket } from "./bucket.js";
import { postgresDatabase } from "./postgres-database.js";
import { task } from "./task.js";

export function add(program: Command) {
	const addCommand = program.command("add").description("add a workload");
	postgresDatabase(addCommand);
	bucket(addCommand);
	task(addCommand);
	return addCommand;
}
