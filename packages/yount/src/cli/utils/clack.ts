import * as p from "@clack/prompts";
import color from "picocolors";

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
