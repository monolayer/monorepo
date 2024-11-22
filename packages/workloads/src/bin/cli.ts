#!/usr/bin/env tsx
import type { Command as CommandExtra } from "@commander-js/extra-typings";
import { Command, CommanderError } from "commander";
import { exit } from "process";
import { build } from "~workloads/cli/commands/build.js";
import { dev } from "~workloads/cli/commands/dev.js";
import { pull } from "~workloads/cli/commands/pull.js";
import { status } from "~workloads/cli/commands/status.js";

function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

async function main() {
	process.env.TESTCONTAINERS_RYUK_DISABLED = "true";
	const program = new Command() as unknown as CommandExtra;

	program.name("workloads").version("1.0.0");

	dev(program);

	const container = program
		.command("container")
		.description("Container commands");
	status(container);
	pull(container);

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
