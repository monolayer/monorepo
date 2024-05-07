import { select } from "@clack/prompts";
import { Context, Effect, Layer } from "effect";

export interface packageInstallContext {
	packageManager: PackageManager;
}

export class PackageInstallEnvironment extends Context.Tag("Environment")<
	PackageInstallEnvironment,
	packageInstallContext
>() {}

export function packageInstallEnvironmentLayer() {
	return Layer.effect(
		PackageInstallEnvironment,
		Effect.succeed({ packageManager: npmPackageManager }),
	);
}

export interface PackageManager {
	name: "npm" | "pnpm" | "yarn" | "bun";
	addCommand: string;
	saveDevFlag: string;
}

const npmPackageManager: PackageManager = {
	name: "npm",
	addCommand: "install",
	saveDevFlag: "--save-dev",
};

const pnpmPackageManager: PackageManager = {
	name: "pnpm",
	addCommand: "install",
	saveDevFlag: "--save-dev",
};

const yarnPackageManager: PackageManager = {
	name: "yarn",
	addCommand: "add",
	saveDevFlag: "--dev",
};

const bunPackageManager: PackageManager = {
	name: "bun",
	addCommand: "add",
	saveDevFlag: "--dev",
};

type PackageManagerSelectOptions = {
	value: "npm" | "pnpm" | "yarn" | "bun";
	label: string;
}[];

export const selectPackageManager = Effect.gen(function* () {
	const packageEnv = yield* PackageInstallEnvironment;
	const packageManager = yield* Effect.tryPromise(() =>
		askUserPackageManager(),
	);
	if (typeof packageManager === "string") {
		switch (packageManager) {
			case "npm":
				packageEnv.packageManager = npmPackageManager;
				break;
			case "pnpm":
				packageEnv.packageManager = pnpmPackageManager;
				break;
			case "yarn":
				packageEnv.packageManager = yarnPackageManager;
				break;
			case "bun":
				packageEnv.packageManager = bunPackageManager;
				break;
		}
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
