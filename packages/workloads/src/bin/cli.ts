#!/usr/bin/env tsx
import type { Command as CommandExtra } from "@commander-js/extra-typings";
import { Command, CommanderError } from "commander";
import { exit } from "process";
import { build } from "~workloads/cli/commands/build.js";
import { pull } from "~workloads/cli/commands/pull.js";
import { start } from "~workloads/cli/commands/start.js";
import { status } from "~workloads/cli/commands/status.js";
import { stop } from "~workloads/cli/commands/stop.js";

function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

async function main() {
	process.env.TESTCONTAINERS_RYUK_DISABLED = "true";
	const program = new Command() as unknown as CommandExtra;

	program.name("workloads").version("1.0.0");

	const dev = program.command("dev").description("Dev commands");
	start(dev);
	stop(dev);
	status(dev);

	build(program);
	pull(program);

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
