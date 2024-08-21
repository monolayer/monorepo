import * as p from "@clack/prompts";
import { Effect } from "effect";
import { flatMap, gen, succeed, tap, tryPromise } from "effect/Effect";
import { execa } from "execa";
import {
	PackageManagerState,
	type PackageManagerSelection,
} from "../state/package-manager.js";
import { checkPackageInstallation } from "./check-package-installation.js";

export function installPackage(
	name: string,
	options: { development: boolean },
) {
	return succeed(name).pipe(
		flatMap(checkPackageInstallation),
		tap((result) =>
			Effect.if(result.installed, {
				onTrue: () => succeed(true),
				onFalse: () => install({ ...result, dev: options.development }),
			}),
		),
	);
}

interface InstallOptions {
	packageName: string;
	dev: boolean;
}

function install(options: InstallOptions) {
	return gen(function* () {
		const env = yield* PackageManagerState.current;
		yield* tryPromise(async () => {
			const s = p.spinner();
			s.start(`Installing ${installText(options, env.packageManager)}`);
			try {
				const args = [env.packageManager.addCommand, options.packageName];
				if (options.dev) {
					args.push(env.packageManager.saveDevFlag);
				}
				await execa(env.packageManager.name, args);
				s.stop(`Installed ${installText(options, env.packageManager)}.`);
			} catch (error) {
				s.stop(
					`Failed to install ${installText(options, env.packageManager)}.`,
					1,
				);
				throw error;
			}
			return succeed(true);
		});
	});
}

function installText(
	installOptions: InstallOptions,
	packageManager: PackageManagerSelection,
) {
	return `${installOptions.packageName} to ${installOptions.dev ? "devDependencies" : "dependencies"} via ${packageManager.name}`;
}
