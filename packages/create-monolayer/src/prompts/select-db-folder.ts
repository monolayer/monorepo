import * as p from "@clack/prompts";
import { Effect } from "effect";
import { DbFolderState } from "~/state/db-folder.js";

export const selectDbFolder = Effect.gen(function* () {
	const selectedPath = yield* promptFolderSelection();
	yield* DbFolderState.update(selectedPath);
	return selectedPath;
});

function promptFolderSelection() {
	return Effect.tryPromise(async () => {
		const folder = await p.group(
			{
				path: () =>
					p.text({
						message: "Where should the db folder be created?",
						placeholder: "app/db",
						defaultValue: "app/db",
						validate: (value) => {
							let path = value;
							if (path === "") path = "app/db";
							if (path[0] === "/") return "Please enter a relative path.";
						},
					}),
			},
			{
				onCancel: () => {
					p.cancel("Operation cancelled.");
					process.exit(0);
				},
			},
		);
		return folder.path;
	});
}
