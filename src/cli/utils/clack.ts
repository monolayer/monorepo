import * as p from "@clack/prompts";
import color from "picocolors";
import { exit } from "process";
import { AutoPilot } from "~/autopilot.js";
import { Config } from "../../config.js";

type LogWithSimpleMessage = typeof p.log & {
	lineMessage: (message?: string) => void;
};

export const log: LogWithSimpleMessage = {
	...p.log,
	lineMessage: (message = "") => {
		process.stdout.write(`${color.gray("│")}  ${message}\n`);
	},
};

export type Task = {
	title: string;
	task: (
		message: (string: string) => void,
	) => string | Promise<string> | void | Promise<void>;
	enabled?: boolean;
};

export function checkEnvironmentIsConfigured(
	config: Config,
	environment: string,
	options: { spinner?: ReturnType<typeof p.spinner>; outro?: true } = {},
) {
	if (config.environments[environment] === undefined) {
		const errorMesage = `Configuration not found for environment '${environment}'. Please check your kinetic.ts file.`;
		if (options.spinner !== undefined) {
			options.spinner.stop(errorMesage, 1);
		} else {
			p.log.error(errorMesage);
		}
		if (options.outro === true) p.outro(`${color.red("Failed")}`);
		exit(1);
	}
}

export function checkAutoPilotLock(
	options: { spinner?: ReturnType<typeof p.spinner>; outro?: true } = {},
) {
	if (AutoPilot.getInstance().hasLock()) {
		if (options.spinner !== undefined) {
			options.spinner.stop("Cannot continue while autopilot is running.", 1);
		} else {
			p.log.error("Cannot continue while autopilot is running.");
		}

		const nextSteps = `1) Make sure the dev server is not running.
2) Run \`npx kinetic autopilot:revert\` to revert the autopilot migrations.`;
		p.note(nextSteps, "Next Steps");

		if (options.outro === true) p.outro(`${color.red("Failed")}`);

		exit(1);
	}
}
