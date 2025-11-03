import type { Command } from "@commander-js/extra-typings";
import { camelCase, kebabCase } from "case-anything";
import { exit } from "process";
import prompts from "prompts";
import { addTaskWorkload } from "~workloads/scaffolding/task-workload.js";

export function task(command: Command) {
	return command
		.command("task")
		.description("add a Task workload")
		.option("--skip-components", "Skip component installation")
		.option("--name <name>", "Name of the task")
		.action(async (options) => {
			const taskOptions = options.name
				? { id: kebabCase(options.name), name: camelCase(options.name) }
				: await promptTaskName();

			if (options.skipComponents) {
				addTaskWorkload(taskOptions);
				return;
			}
			addTaskWorkload(taskOptions);
		});
}

async function promptTaskName() {
	let aborted = false;
	const select = await prompts({
		type: "text",
		name: "taskName",
		message: `Task name`,
		initial: "app",
		onState: (e) => {
			aborted = e.aborted;
		},
	});
	if (aborted) {
		exit(1);
	}
	return {
		name: camelCase(select.taskName),
		id: kebabCase(select.taskName),
	};
}
