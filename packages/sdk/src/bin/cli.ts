#!/usr/bin/env tsx
import type { Command as CommandExtra } from "@commander-js/extra-typings";
import { Command, CommanderError } from "commander";
import { exit } from "process";
import { build } from "~workloads/cli/actions/build.js";
import { pull } from "~workloads/cli/actions/pull.js";
import { start } from "~workloads/cli/actions/start.js";
import { status } from "~workloads/cli/actions/status.js";
import { stop } from "~workloads/cli/actions/stop.js";
import { trigger } from "~workloads/cli/actions/trigger.js";
import { checkVersion } from "../cli/version-check.js";

const CURRENT_VERSION = "1.0.1";

function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

async function main() {
	await checkVersion(CURRENT_VERSION);
	process.env.TESTCONTAINERS_RYUK_DISABLED = "true";
	const program = new Command() as unknown as CommandExtra;

	program.name("workloads").version("1.0.0");

	start(program);
	stop(program);
	status(program);

	pull(program);
	build(program);

	trigger(program);

	program.exitOverride();

	try {
		program.parse();
	} catch (err) {
		if (isCommanderError(err) && err.code === "commander.help") {
			exit(0);
		}
	}
}

main().catch(console.error);
