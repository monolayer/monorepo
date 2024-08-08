import { Effect } from "effect";
import { installPackage } from "./install-package.js";
import { PackageManagerState } from "./state/package-manager.js";

export function yarnInstallPeerDependencies(dependencies: string[]) {
	return Effect.gen(function* () {
		const env = yield* PackageManagerState.current;
		if (env.packageManager.name === "yarn") {
			yield* Effect.forEach(dependencies, (dependency) =>
				installPackage(dependency, { development: false }),
			);
		}
	});
}
