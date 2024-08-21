import * as p from "@clack/prompts";
import { gen, tryPromise } from "effect/Effect";
import type { ExecaReturnBase, StdoutStderrAll } from "execa";
import { execa } from "execa";
import { PackageManagerState } from "../state/package-manager.js";

export function checkPackageInstallation(packageName: string) {
	return gen(function* () {
		const state = yield* PackageManagerState.current;
		switch (state.packageManager.name) {
			case "npm":
				return yield* checkWithNpm(packageName);
			case "pnpm":
				return yield* checkCommandOutput(
					"pnpm",
					packageName,
					["list"],
					`${packageName} `,
				);
			case "yarn":
				return yield* checkCommandOutput(
					"yarn",
					packageName,
					["list"],
					`${packageName}@`,
				);
			case "bun":
				return yield* checkCommandOutput(
					"bun",
					packageName,
					["pm", "ls", "--all"],
					`${packageName}@`,
				);
		}
	});
}

function checkWithNpm(packageName: string) {
	return tryPromise(async () => {
		const s = p.spinner();
		s.start(`Checking ${packageName}`);
		try {
			await execa("npm", ["list", packageName]);
			s.stop(`${packageName} already installed.`);
			return {
				packageName: packageName,
				installed: true,
			};
		} catch (error) {
			if (isExecaError(error) && (error.stdout || "").includes("empty")) {
				s.stop(`${packageName} not installed.`);
				return {
					packageName: packageName,
					installed: false,
				};
			}
			s.stop(`Failed to check ${packageName}`, 1);
			throw error;
		}
	});
}

function checkCommandOutput(
	packageManager: "pnpm" | "yarn" | "bun",
	packageName: string,
	options: string[],
	checkOutput: string,
) {
	return gen(function* () {
		const s = p.spinner();
		s.start(`Checking ${packageName}`);
		const response = yield* tryPromise(async () => {
			try {
				const { stdout } = await execa(packageManager, [
					...options,
					packageName,
				]);
				return {
					packageName: packageName,
					installed: stdout.includes(checkOutput),
				};
			} catch (error) {
				s.stop(`Failed to check ${packageName}`, 1);
				throw error;
			}
		});
		if (response.installed) {
			s.stop(`${packageName} already installed.`);
		} else {
			s.stop(`${packageName} not installed.`);
		}
		return response;
	});
}

function isExecaError(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	error: any,
): error is ExecaReturnBase<StdoutStderrAll> {
	return (
		error.escapedCommand !== undefined &&
		error.command !== undefined &&
		error.exitCode !== undefined &&
		error.failed === true
	);
}
