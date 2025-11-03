import type { Command } from "@commander-js/extra-typings";
import { camelCase, kebabCase } from "case-anything";
import { readFileSync } from "fs";
import { exit } from "process";
import prompts from "prompts";
import { addBootstrapWorkload } from "~workloads/scaffolding/lifecycle.js";

export function bootstrap(command: Command) {
	return command
		.command("bootstrap")
		.description("add a bootstrap workload")
		.action(async () => {
			const script = await promtScriptName();
			addBootstrapWorkload(script);
		});
}

async function promtScriptName() {
	let aborted = false;
	const select = await prompts({
		type: "select",
		name: "scriptName",
		message: `Select script to run when bootstrapping an environment`,
		choices: packageJSONScripts().map((script) => ({
			title: script,
			value: script,
		})),
		onState: (e) => {
			aborted = e.aborted;
		},
	});
	if (aborted) {
		exit(1);
	}
	return {
		name: camelCase(select.scriptName),
		id: kebabCase(select.scriptName),
		scriptName: select.scriptName,
	};
}

function packageJSONScripts() {
	const packageJSON = JSON.parse(readFileSync("package.json").toString());
	return Object.keys(packageJSON.scripts as Record<string, string>);
}
