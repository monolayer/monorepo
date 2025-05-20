import { Context, Ref } from "effect";
import { gen } from "effect/Effect";
import { get, make, update } from "effect/Ref";

export interface PackageManager {
	packageManager: PackageManagerSelection;
}

export class PackageManagerState extends Context.Tag("PackageManagerState")<
	PackageManagerState,
	Ref.Ref<PackageManager>
>() {
	static get current() {
		return gen(function* () {
			return yield* get(yield* PackageManagerState);
		});
	}

	static updatePackageManager(name: string) {
		return gen(function* () {
			switch (name) {
				case "npm":
					return yield* update(yield* PackageManagerState, () => {
						return { packageManager: npmPackageManager };
					});
				case "pnpm":
					return yield* update(yield* PackageManagerState, () => {
						return { packageManager: pnpmPackageManager };
					});
				case "yarn":
					return yield* update(yield* PackageManagerState, () => {
						return { packageManager: yarnPackageManager };
					});
				case "bun":
					return yield* update(yield* PackageManagerState, () => {
						return { packageManager: bunPackageManager };
					});
				default:
					return yield* update(yield* PackageManagerState, () => {
						return { packageManager: npmPackageManager };
					});
			}
		});
	}
}

export type PackageManagerName = "npm" | "pnpm" | "yarn" | "bun";

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

export const defaultPackageManagerRef = make({
	packageManager: npmPackageManager,
});
