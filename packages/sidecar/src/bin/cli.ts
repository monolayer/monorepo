#!/usr/bin/env tsx
import type { Command as CommandExtra } from "@commander-js/extra-typings";
import { Command, CommanderError } from "commander";
import { exit } from "process";
import { devStart } from "~sidecar/cli/dev/start.js";
import { devStatus } from "~sidecar/cli/dev/status.js";
import { devStop } from "~sidecar/cli/dev/stop.js";

function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

async function main() {
	process.env.TESTCONTAINERS_RYUK_DISABLED = "true";
	const program = new Command() as unknown as CommandExtra;

	program.name("workloads").version("1.0.0");

	const dev = program.command("dev").description("Dev commands");

	devStart(dev);
	devStop(dev);
	devStatus(dev);

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
