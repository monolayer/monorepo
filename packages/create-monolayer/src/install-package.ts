import * as p from "@clack/prompts";
import { Effect } from "effect";
import { execa } from "execa";
import { checkPackageInstallation } from "./check-package-installation.js";
import {
	PackageInstallEnvironment,
	type PackageManager,
} from "./select-package-manager.js";

export function installPackage(
	name: string,
	options: { development: boolean },
) {
	return Effect.succeed(name).pipe(
		Effect.flatMap(checkPackageInstallation),
		Effect.tap((result) =>
			Effect.if(result.installed, {
				onTrue: () => Effect.succeed(true),
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
	return PackageInstallEnvironment.pipe(
		Effect.tap((env) =>
			Effect.tryPromise(async () => {
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
				return Effect.succeed(true);
			}),
		),
	);
}

function installText(
	installOptions: InstallOptions,
	packageManager: PackageManager,
) {
	return `${installOptions.packageName} to ${installOptions.dev ? "devDependencies" : "dependencies"} via ${packageManager.name}`;
}
