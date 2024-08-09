import * as p from "@clack/prompts";
import { type ActionErrors } from "@monorepo/base/errors.js";
import {
	actionWithErrorHandling,
	actionWithLayers,
	actionWithServiceEffect,
} from "@monorepo/cli/action-intro.js";
import { printAnyErrors } from "@monorepo/cli/handle-errors.js";
import { actionIntro } from "@monorepo/cli/intro.js";
import {
	cliActionFailureOutro,
	cliActionSuccessOutro,
} from "@monorepo/cli/outros.js";
import { dbClientsLayer } from "@monorepo/services/db-clients.js";
import { phasedMigratorLayer } from "@monorepo/services/phased-migrator.js";
import type { ProgramContext } from "@monorepo/services/program-context.js";
import {
	AppEnvironment,
	getEnvironment,
	importSchemaEnvironment,
	type AppEnv,
} from "@monorepo/state/app-environment.js";
import { Effect, Layer, Ref } from "effect";
import color from "picocolors";
import { exit } from "process";

export async function cliAction(
	name: string,
	options: { readonly connection: string; readonly name?: string },
	tasks: Effect.Effect<unknown, ActionErrors, ProgramContext>[],
) {
	actionIntro(name);

	const layers = phasedMigratorLayer().pipe(
		Layer.provideMerge(dbClientsLayer()),
	);

	await Effect.runPromise(
		actionWithServiceEffect(
			actionWithLayers(tasks, layers),
			AppEnvironment,
			Ref.make(await loadEnv(options)),
		),
	).then(cliActionSuccessOutro, cliActionFailureOutro);
}

export async function cliActionWithoutContext(
	name: string,
	tasks: Effect.Effect<unknown, ActionErrors, AppEnvironment>[],
) {
	actionIntro(name);

	await Effect.runPromise(
		actionWithServiceEffect(
			actionWithErrorHandling(tasks),
			AppEnvironment,
			Ref.make(await loadImportSchemaEnv()),
		),
	).then(cliActionSuccessOutro, cliActionFailureOutro);
}

export async function loadEnv(options: {
	readonly connection: string;
	readonly name?: string;
}) {
	return await Effect.runPromise(
		Effect.gen(function* () {
			return yield* getEnvironment(
				options.connection,
				options.name ?? "default",
			);
		}).pipe(printAnyErrors),
	).then(envLoadSuccess, envLoadFailure);
}

export async function loadImportSchemaEnv() {
	return await Effect.runPromise(
		Effect.gen(function* () {
			return yield* importSchemaEnvironment;
		}).pipe(printAnyErrors),
	).then(envLoadSuccess, envLoadFailure);
}

const envLoadSuccess = (result: AppEnv) => result;

const envLoadFailure = () => {
	p.outro(`${color.red("Failed")}`);
	exit(1);
};
