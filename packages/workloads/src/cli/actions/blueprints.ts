import type { Command } from "@commander-js/extra-typings";
import fs, { mkdirSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";

export function blueprint(program: Command) {
	const blueprint = program
		.command("blueprints")
		.description("blueprints commmands");

	add(blueprint);

	return blueprint;
}

function add(program: Command) {
	return program
		.command("add")
		.description("Add blueprints to your project")
		.action(async () => {
			const blueprintPath = path.join(cwd(), "blueprint");
			mkdirSync(blueprintPath);
			fs.cpSync(
				"./node_modules/@monolayer/workloads/dist/blueprint",
				blueprintPath,
				{
					force: true,
					recursive: true,
				},
			);
			console.log(`Blueprint installed in ${blueprintPath}`);
		});
}
