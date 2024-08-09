import * as p from "@clack/prompts";
import color from "picocolors";
import { exit } from "process";

export const cliActionSuccessOutro = () => {
	p.outro(`${color.green("Done")}`);
	exit(0);
};

export const cliActionFailureOutro = () => {
	p.outro(`${color.red("Failed")}`);
	exit(1);
};
