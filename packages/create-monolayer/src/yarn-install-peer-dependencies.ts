import { Effect } from "effect";
import { installPackage } from "./install-package.js";
import { PackageInstallEnvironment } from "./select-package-manager.js";

export function yarnInstallPeerDependencies(dependencies: string[]) {
	return PackageInstallEnvironment.pipe(
		Effect.tap((env) =>
			Effect.if(env.packageManager.name === "yarn", {
				onTrue: () =>
					Effect.forEach(dependencies, (dependency) =>
						installPackage(dependency, { development: false }),
					),
				onFalse: () => Effect.succeed(true),
			}),
		),
	);
}
