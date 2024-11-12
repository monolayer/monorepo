import { tryPromise } from "effect/Effect";
import { exit } from "node:process";
import prompts from "prompts";

export const promptDbFolderSelection = tryPromise(async () => {
	let aborted = false;
	const folder = await prompts({
		type: "text",
		name: "path",
		message: "Where should monolayer create the `db` folder?",
		initial: "./app",
		onState: (e) => {
			aborted = e.aborted;
		},
	});
	if (aborted) {
		exit(1);
	}
	return folder.path as string;
});
