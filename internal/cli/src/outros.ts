import color from "picocolors";
import { exit } from "process";

export const cliActionSuccessOutro = () => {
	console.log(`${color.green("Done")}`);
	exit(0);
};

export const cliActionFailureOutro = () => {
	console.log(`${color.red("Failed")}`);
	exit(1);
};
