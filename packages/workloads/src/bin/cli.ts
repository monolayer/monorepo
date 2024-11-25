#!/usr/bin/env tsx
import type { Command as CommandExtra } from "@commander-js/extra-typings";
import { Command, CommanderError } from "commander";
import { exit } from "process";
import { build } from "~workloads/cli/actions/build.js";
import { pull } from "~workloads/cli/actions/pull.js";
import { start } from "~workloads/cli/actions/start.js";
import { status } from "~workloads/cli/actions/status.js";
import { stop } from "~workloads/cli/actions/stop.js";

function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

async function main() {
	process.env.TESTCONTAINERS_RYUK_DISABLED = "true";
	const program = new Command() as unknown as CommandExtra;

	program.name("workloads").version("1.0.0");

	start(program);
	stop(program);
	status(program);

	pull(program);
	build(program);

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
