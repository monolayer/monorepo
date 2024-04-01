#!/usr/bin/env tsx

import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import { exit } from "process";
import { checkPackageInstallation } from "~/check-package-installation.js";
import { initFolderAndFiles } from "~/init-folders-and-files.js";
import { installDevPackage, installPackage } from "~/install-package.js";

const program = Effect.succeed(true).pipe(
	Effect.flatMap(() =>
		checkPackageInstallation("@types/pg").pipe(Effect.tap(installDevPackage)),
	),
	Effect.flatMap(() =>
		checkPackageInstallation("yount").pipe(Effect.tap(installPackage)),
	),
	Effect.flatMap(initFolderAndFiles),
	Effect.tapErrorCause(Effect.logError),
);

p.intro("Init Yount");

const result = await Effect.runPromise(program).then(
	() => true,
	() => false,
);

if (result) {
	p.outro("Done");
	exit(0);
} else {
	p.outro(`${color.red("Failed")}`);
	exit(1);
}
