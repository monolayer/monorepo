import * as p from "@clack/prompts";
import color from "picocolors";
import { exit } from "process";
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
) {
	if (config.environments[environment] === undefined) {
		log.lineMessage(
			`${color.red(
				"error",
			)} No configuration found for environment: '${environment}'. Please check your kinetic.ts file.`,
		);
		exit(1);
	}
}
