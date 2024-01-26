#!/usr/bin/env node --loader ts-node/esm --no-warnings

import { Command } from "commander";

async function main() {
	const program = new Command();

	program.name("kinetic").version("1.0.0");
	program.parse();
}

main().catch(console.error);
