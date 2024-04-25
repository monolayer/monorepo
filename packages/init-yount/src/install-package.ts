import * as p from "@clack/prompts";
import { Effect } from "effect";
import { execa } from "execa";
import { checkPackageInstallation } from "./check-package-installation.js";

export function installPackage(
	name: string,
	options: { development: boolean },
) {
	return Effect.succeed(name).pipe(
		Effect.flatMap(checkPackageInstallation),
		Effect.tap((result) =>
			Effect.if(result.installed, {
				onTrue: Effect.succeed(true),
				onFalse: npmInstall({ ...result, dev: options.development }),
			}),
		),
	);
}

export function npmInstall(options: { packageName: string; dev: boolean }) {
	return Effect.tryPromise(async () => {
		const s = p.spinner();
		s.start(`Installing ${options.packageName} via npm`);
		try {
			await execa("npm", [
				"install",
				options.packageName,
				options.dev ? "--save-dev" : "--save",
			]);
			s.stop(`Installed ${options.packageName} via npm`);
		} catch (error) {
			s.stop(`Failed to install ${options.packageName} via npm`, 1);
			throw error;
		}
		return Effect.succeed(true);
	});
}
