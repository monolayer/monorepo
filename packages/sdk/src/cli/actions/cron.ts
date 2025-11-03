import type { Command } from "@commander-js/extra-typings";
import { camelCase, kebabCase } from "case-anything";
import { exit } from "process";
import prompts from "prompts";
import { addCronWorkload } from "~workloads/scaffolding/cron-workload.js";

export function cron(command: Command) {
	return command
		.command("cron")
		.description("add a cron workload")
		.action(async () => {
			const cron = await promptCronName();
			addCronWorkload(cron);
		});
}

async function promptCronName() {
	let aborted = false;
	const select = await prompts({
		type: "text",
		name: "cronName",
		message: `Cron name`,
		initial: "app",
		onState: (e) => {
			aborted = e.aborted;
		},
	});
	if (aborted) {
		exit(1);
	}
	return {
		name: camelCase(select.cronName),
		id: kebabCase(select.cronName),
	};
}
