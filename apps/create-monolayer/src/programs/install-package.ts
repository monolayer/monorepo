import * as p from "@clack/prompts";
import { gen, succeed, tryPromise } from "effect/Effect";
import { execa } from "execa";
import color from "picocolors";
import { PackageManagerState } from "../state/package-manager.js";
import { checkPackageInstallation } from "./check-package-installation.js";

interface PackageToInstall {
	name: string;
	version?: string;
	development: boolean;
}

export function installPackages(packagesToInstall: PackageToInstall[]) {
	return gen(function* () {
		const env = yield* PackageManagerState.current;
		const s = p.spinner();
		s.start(`Installing monolayer...`);

		for (const packageToInstall of packagesToInstall) {
			const check = yield* checkPackageInstallation(packageToInstall.name);

			if (!check.installed) {
				yield* tryPromise(async () => {
					try {
						const args = [
							env.packageManager.addCommand,
							packageToInstall.version
								? `${packageToInstall.name}@${packageToInstall.version}`
								: packageToInstall.name,
						];

						if (packageToInstall.development) {
							args.push(env.packageManager.saveDevFlag);
						}
						await execa(env.packageManager.name, args);
					} catch (error) {
						s.stop(`Failed to install ${packageToInstall.name}.`, 1);
						throw error;
					}
					return succeed(true);
				});
			}
		}
		s.stop(`Installing monolayer... ${color.green("✓")}`);
	});
}
