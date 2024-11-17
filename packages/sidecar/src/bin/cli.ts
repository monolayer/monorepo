#!/usr/bin/env tsx
import type { Command as CommandExtra } from "@commander-js/extra-typings";
import { Command, CommanderError } from "commander";
import { exit } from "process";
import { dev } from "~sidecar/cli/dev.js";
import { status } from "~sidecar/cli/status.js";
import { stop } from "~sidecar/cli/stop.js";

function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

async function main() {
	process.env.TESTCONTAINERS_RYUK_DISABLED = "true";
	const program = new Command() as unknown as CommandExtra;

	program.name("workloads").version("1.0.0");

	dev(program);
	stop(program);
	status(program);

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
