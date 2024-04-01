#!/usr/bin/env tsx

import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import { exit } from "process";
import { checkPackageInstallation } from "~/check-package-installation.js";
import { initFolderAndFiles } from "~/init-folders-and-files.js";
import { installDevPackage, installPackage } from "~/install-package.js";

function exitWithError(cause: string) {
	console.error(cause);
	p.outro(`${color.red("Failed")}`);
	exit(1);
}

async function installPgTypes() {
	const program = Effect.succeed("@types/pg").pipe(
		Effect.flatMap(checkPackageInstallation),
		Effect.tap(installDevPackage),
	);

	const result = await Effect.runPromiseExit(program);
	if (result._tag !== "Success") {
		exitWithError(result.cause.toString());
	}
}

async function installYount() {
	const program = Effect.succeed("yount").pipe(
		Effect.flatMap(checkPackageInstallation),
		Effect.tap(installPackage),
	);

	const result = await Effect.runPromiseExit(program);
	if (result._tag !== "Success") {
		exitWithError(result.cause.toString());
	}
}

async function initStructure() {
	const result = await Effect.runPromiseExit(initFolderAndFiles());
	if (result._tag !== "Success") {
		exitWithError(result.cause.toString());
	}
}

p.intro("Init Yount");
await installPgTypes();
await installYount();
await initStructure();
p.outro("Done");
exit(0);
