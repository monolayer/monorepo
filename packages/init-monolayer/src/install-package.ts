import * as p from "@clack/prompts";
import { Effect } from "effect";
import { execa } from "execa";
import { checkPackageInstallation } from "./check-package-installation.js";
import { PackageInstallEnvironment } from "./select-package-manager.js";

export function installPackage(
	name: string,
	options: { development: boolean },
) {
	return Effect.succeed(name).pipe(
		Effect.flatMap(checkPackageInstallation),
		Effect.tap((result) =>
			Effect.if(result.installed, {
				onTrue: Effect.succeed(true),
				onFalse: install({ ...result, dev: options.development }),
			}),
		),
	);
}

function install(options: { packageName: string; dev: boolean }) {
	return PackageInstallEnvironment.pipe(
		Effect.tap((env) =>
			Effect.tryPromise(async () => {
				const s = p.spinner();
				s.start(
					`Installing ${options.packageName} via ${env.packageManager.name}`,
				);
				try {
					const args = [env.packageManager.addCommand, options.packageName];
					if (options.dev) {
						args.push(env.packageManager.saveDevFlag);
					}
					await execa(env.packageManager.name, args);
					s.stop(
						`Installed ${options.packageName} via ${env.packageManager.name}.`,
					);
				} catch (error) {
					s.stop(
						`Failed to install ${options.packageName} via ${env.packageManager.name}.`,
						1,
					);
					throw error;
				}
				return Effect.succeed(true);
			}),
		),
	);
}
