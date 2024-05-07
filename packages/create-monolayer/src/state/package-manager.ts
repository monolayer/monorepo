import { Context, Effect, Ref } from "effect";

export interface PackageManager {
	packageManager: PackageManagerSelection;
}

export class PackageManagerState extends Context.Tag("PackageManagerState")<
	PackageManagerState,
	Ref.Ref<PackageManager>
>() {
	static get current() {
		return Effect.gen(function* () {
			return yield* Ref.get(yield* PackageManagerState);
		});
	}

	static updatePackageManager(name: PackageManagerName) {
		return Effect.gen(function* () {
			switch (name) {
				case "npm":
					return yield* Ref.update(yield* PackageManagerState, () => {
						return { packageManager: npmPackageManager };
					});
				case "pnpm":
					return yield* Ref.update(yield* PackageManagerState, () => {
						return { packageManager: pnpmPackageManager };
					});
				case "yarn":
					return yield* Ref.update(yield* PackageManagerState, () => {
						return { packageManager: yarnPackageManager };
					});
				case "bun":
					return yield* Ref.update(yield* PackageManagerState, () => {
						return { packageManager: bunPackageManager };
					});
			}
		});
	}
}

type PackageManagerName = "npm" | "pnpm" | "yarn" | "bun";

export interface PackageManagerSelection {
	name: PackageManagerName;
	addCommand: string;
	saveDevFlag: string;
}

export const npmPackageManager: PackageManagerSelection = {
	name: "npm",
	addCommand: "install",
	saveDevFlag: "--save-dev",
};

export const pnpmPackageManager: PackageManagerSelection = {
	name: "pnpm",
	addCommand: "install",
	saveDevFlag: "--save-dev",
};

export const yarnPackageManager: PackageManagerSelection = {
	name: "yarn",
	addCommand: "add",
	saveDevFlag: "--dev",
};

export const bunPackageManager: PackageManagerSelection = {
	name: "bun",
	addCommand: "add",
	saveDevFlag: "--dev",
};

export const defaultPackageManagerRef = Ref.make({
	packageManager: npmPackageManager,
});
