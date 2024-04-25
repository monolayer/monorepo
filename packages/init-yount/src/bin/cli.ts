#!/usr/bin/env tsx

import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import { exit } from "process";
import { initFolderAndFiles } from "~/init-folders-and-files.js";
import { installPackage } from "~/install-package.js";

const program = Effect.all([
	installPackage("@types/pg", { development: true }),
	installPackage("yount", { development: false }),
	initFolderAndFiles(),
]).pipe(Effect.tapErrorCause(Effect.logError));

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
