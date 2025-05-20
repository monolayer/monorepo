import { tryPromise } from "effect/Effect";
import { exit } from "node:process";
import prompts from "prompts";

export const promptWorkloadsFolderSelection = tryPromise(async () => {
	let aborted = false;
	const folder = await prompts({
		type: "text",
		name: "path",
		message: "Where should we create the workloads folders?",
		initial: "./workloads",
		onState: (e) => {
			aborted = e.aborted;
		},
	});
	if (aborted) {
		exit(1);
	}
	return folder.path as string;
});
