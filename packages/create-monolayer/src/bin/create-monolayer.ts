#!/usr/bin/env tsx

import * as p from "@clack/prompts";
import { Effect, Ref } from "effect";
import color from "picocolors";
import { exit } from "process";
import { initFolderAndFiles } from "~/init-folders-and-files.js";
import { installPackage } from "~/install-package.js";
import { selectDbFolder } from "~/prompts/select-db-folder.js";
import {
	packageInstallEnvironmentLayer,
	selectPackageManager,
} from "~/prompts/select-package-manager.js";
import { DbFolderState, type DbFolder } from "~/state/db-folder.js";
import { yarnInstallPeerDependencies } from "~/yarn-install-peer-dependencies.js";

const program = Effect.provide(
	Effect.all([
		selectPackageManager,
		selectDbFolder,
		installPackage("@types/pg", { development: true }),
		installPackage("monolayer", { development: false }),
		yarnInstallPeerDependencies(["pg", "kysely"]),
		initFolderAndFiles,
	]),
	packageInstallEnvironmentLayer(),
).pipe(
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

const result = await Effect.runPromise(
	Effect.provideServiceEffect(
		Effect.scoped(program),
		DbFolderState,
		Ref.make({} as DbFolder),
	),
).then(
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
