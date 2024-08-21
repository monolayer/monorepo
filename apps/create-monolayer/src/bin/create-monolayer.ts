#!/usr/bin/env tsx

import * as p from "@clack/prompts";
import { Effect, Ref } from "effect";
import color from "picocolors";
import { exit } from "process";
import { initFolderAndFiles } from "~create-monolayer/init-folders-and-files.js";
import { installPackage } from "~create-monolayer/install-package.js";
import { selectDbFolder } from "~create-monolayer/prompts/select-db-folder.js";
import { selectPackageManager } from "~create-monolayer/prompts/select-package-manager.js";
import {
	DbFolderState,
	type DbFolder,
} from "~create-monolayer/state/db-folder.js";
import {
	PackageManagerState,
	defaultPackageManagerRef,
} from "~create-monolayer/state/package-manager.js";

const program = Effect.all([
	selectPackageManager,
	selectDbFolder,
	installPackage("monolayer", { development: false }),
	installPackage("@types/pg", { development: true }),
	initFolderAndFiles,
]).pipe(
	Effect.catchTags({
		PromptCancelError: (): Effect.Effect<never, never, never> => {
			p.cancel("Operation cancelled.");
			exit(1);
		},
	}),
	Effect.tapErrorCause((error) =>
		Effect.succeed(p.log.error(error.toString())),
	),
);

p.intro("Create monolayer");

const programWithPackageManager = Effect.provideServiceEffect(
	Effect.scoped(program),
	PackageManagerState,
	defaultPackageManagerRef,
);

const programWithDbFolder = Effect.provideServiceEffect(
	programWithPackageManager,
	DbFolderState,
	Ref.make({} as DbFolder),
);

const result = await Effect.runPromise(programWithDbFolder).then(
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
