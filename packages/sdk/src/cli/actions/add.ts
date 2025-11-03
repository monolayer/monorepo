import type { Command } from "@commander-js/extra-typings";
import { afterRollout } from "./after-rollout.js";
import { beforeRollout } from "./before-rollout.js";
import { bootstrap } from "./bootstrap.js";
import { broadcast } from "./broadcast.js";
import { bucket } from "./bucket.js";
import { cron } from "./cron.js";
import { postgresDatabase } from "./postgres-database.js";
import { task } from "./task.js";

export function add(program: Command) {
	const addCommand = program.command("add").description("add a workload");
	postgresDatabase(addCommand);
	bucket(addCommand);
	task(addCommand);
	broadcast(addCommand);
	cron(addCommand);
	bootstrap(addCommand);
	beforeRollout(addCommand);
	afterRollout(addCommand);
	return addCommand;
}
