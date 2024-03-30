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
	options: { spinner?: ReturnType<typeof p.spinner>; outro?: true } = {},
) {
	const envConfig = config.environments[environment];
	if (envConfig === undefined) {
		const errorMesage = `Configuration not found for environment '${environment}'. Please check your yount.ts file.`;
		if (options.spinner !== undefined) {
			options.spinner.stop(errorMesage, 1);
		} else {
			p.log.error(errorMesage);
		}
		if (options.outro === true) p.outro(`${color.red("Failed")}`);
		exit(1);
	}
	return envConfig;
}
