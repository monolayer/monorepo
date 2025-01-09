import type { Command } from "@commander-js/extra-typings";
import fs, { mkdirSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";

export function blueprints(program: Command) {
	const blueprints = program
		.command("blueprints")
		.description("blueprints commmands");

	add(blueprints);

	return blueprints;
}

function add(program: Command) {
	return program
		.command("add")
		.description("Add blueprints to your project")
		.action(async () => {
			const blueprintsPath = path.join(cwd(), "blueprints");
			mkdirSync(blueprintsPath);
			fs.cpSync(
				"./node_modules/@monolayer/workloads/dist/blueprints",
				blueprintsPath,
				{
					force: true,
					recursive: true,
				},
			);
			console.log(`Blueprints installed in ${blueprintsPath}`);
		});
}
