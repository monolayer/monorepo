import { gen, succeed, tryPromise } from "effect/Effect";
import { execa } from "execa";
import ora from "ora";
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
		const s = ora();
		s.start("Install monolayer-pg");

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
						s.fail();
						throw error;
					}
					return succeed(true);
				});
			}
		}
		s.succeed();
	});
}
