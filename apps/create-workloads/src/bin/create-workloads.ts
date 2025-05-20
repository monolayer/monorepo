#!/usr/bin/env tsx

import {
	all,
	provide,
	runPromise,
	succeed,
	tap,
	tapErrorCause,
} from "effect/Effect";
import { effect } from "effect/Layer";
import color from "picocolors";
import { exit } from "process";
import { initFolderAndFiles } from "~create-workloads/programs/init-folders-and-files.js";
import { installPackages } from "~create-workloads/programs/install-package.js";
import { promptWorkloadsFolderSelection } from "~create-workloads/prompts/workloads-folder-selection.js";
import {
	PackageManagerState,
	defaultPackageManagerRef,
} from "~create-workloads/state/package-manager.js";
import {
	WorkloadsFolderState,
	defaultWorkloadsFolderRef,
} from "~create-workloads/state/workloads-folder.js";

const packageManager =
	(process.env.NPM_CONFIG_USER_AGENT ?? "npm").split("/")[0] ?? "npm";

const program = all([
	succeed(packageManager).pipe(tap(PackageManagerState.updatePackageManager)),
	promptWorkloadsFolderSelection.pipe(tap(WorkloadsFolderState.update)),
	installPackages([{ name: "@monolayer/workloads", development: false }]),
	initFolderAndFiles,
]).pipe(tapErrorCause((error) => succeed(console.log(error.toString()))));

console.log("Welcome to @monolayer/workloads!");

const result = await runPromise(
	provide(
		provide(program, effect(WorkloadsFolderState, defaultWorkloadsFolderRef)),
		effect(PackageManagerState, defaultPackageManagerRef),
	),
).then(
	() => true,
	() => false,
);

if (result) {
	console.log(`${color.green("Done")}`);
	exit(0);
} else {
	console.log(`${color.red("Failed")}`);
	exit(1);
}
