import type { Command } from "@commander-js/extra-typings";
import dotenv from "dotenv";
import { exit } from "node:process";
import color from "picocolors";
import prompts from "prompts";
import { importWorkloads } from "~workloads/beamer/scan/workload-imports.js";
import type { Cron } from "~workloads/workloads/stateless/cron.js";

export function trigger(program: Command) {
	const trigger = program.command("trigger").description("trigger commmands");

	triggerCron(trigger);

	return trigger;
}

function triggerCron(program: Command) {
	return program
		.command("cron")
		.description("trigger a cron workload")
		.option("-e, --env-file <file-name>", "environment file to load", ".env")
		.option("-c, --cron-id <id>", "ID of Cron to trigger")
		.action(async (options) => {
			dotenv.config({ path: options.envFile });
			const imports = await importWorkloads();
			const cronId = options.cronId;
			if (cronId !== undefined) {
				const cronToTrigger = imports.Cron.find(
					(cron) => cron.workload.id === cronId,
				);
				if (cronToTrigger === undefined) {
					console.log(
						`${color.red("error:")} cron workload not found: ${cronId}`,
					);
					exit(1);
				}
				await cronToTrigger.workload.run();
			} else {
				const cronChoices = imports.Cron.map((cron) => ({
					value: cron.workload,
					title: cron.workload.id,
				}));
				if (cronChoices.length === 0) {
					console.log(`${color.red("error:")} No cron workloads found.`);
					exit(1);
				}
				let aborted = false;
				const select = await prompts({
					type: "select",
					name: "cron",
					message: `Select cron to trigger`,
					choices: cronChoices,
					onState: (e) => {
						aborted = e.aborted;
					},
				});
				if (aborted) {
					exit(1);
				}
				await (select.cron as Cron).run();
			}
		});
}
