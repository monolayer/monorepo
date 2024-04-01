#!/usr/bin/env tsx

import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import { exit } from "process";
import { checkPackageInstallation } from "~/check-package-installation.js";
import { initFolderAndFiles } from "~/init-folders-and-files.js";
import { installDevPackage } from "~/install-dev-package.js";

const program = Effect.succeed("@types/pg").pipe(
	Effect.tap(checkPackageInstallation),
	Effect.tap(installDevPackage),
	Effect.tap(initFolderAndFiles),
);

const result = await Effect.runPromiseExit(program);
if (result._tag === "Success") {
	p.outro("Done");
	exit(0);
} else {
	console.log(result.cause.toString());
	p.outro(`${color.red("Failed")}`);
	exit(1);
}
