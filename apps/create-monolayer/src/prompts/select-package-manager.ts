import { select } from "@clack/prompts";
import { Effect } from "effect";
import { PackageManagerState } from "~/state/package-manager.js";

type PackageManagerSelectOptions = {
	value: "npm" | "pnpm" | "yarn" | "bun";
	label: string;
}[];

export const selectPackageManager = Effect.gen(function* () {
	const packageManager = yield* Effect.tryPromise(() =>
		askUserPackageManager(),
	);
	if (typeof packageManager === "string") {
		yield* PackageManagerState.updatePackageManager(packageManager);
	} else {
		return yield* Effect.fail(new PromptCancelError());
	}
	return yield* Effect.succeed(true);
});

async function askUserPackageManager() {
	const selectOptions: PackageManagerSelectOptions = [
		{
			value: "npm",
			label: "npm",
		},
		{
			value: "pnpm",
			label: "pnpm",
		},
		{
			value: "yarn",
			label: "yarn",
		},
		{
			value: "bun",
			label: "bun",
		},
	];
	return await select<
		PackageManagerSelectOptions,
		"npm" | "pnpm" | "yarn" | "bun"
	>({
		message: `Which package manager are you using?`,
		options: selectOptions,
	});
}

class PromptCancelError {
	readonly _tag = "PromptCancelError";
}
