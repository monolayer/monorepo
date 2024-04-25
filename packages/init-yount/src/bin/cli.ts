#!/usr/bin/env tsx

import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import { exit } from "process";
import { initFolderAndFiles } from "~/init-folders-and-files.js";
import { installPackage } from "~/install-package.js";
import {
	packageInstallEnvironmentLayer,
	selectPackageManager,
} from "~/select-package-manager.js";
import { yarnInstallPeerDependencies } from "~/yarn-install-peer-dependencies.js";

const program = Effect.provide(
	Effect.all([
		selectPackageManager(),
		installPackage("@types/pg", { development: true }),
		installPackage("yount", { development: false }),
		yarnInstallPeerDependencies(["pg", "kysely"]),
		initFolderAndFiles(),
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

p.intro("Init Yount");

const result = await Effect.runPromise(Effect.scoped(program)).then(
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
