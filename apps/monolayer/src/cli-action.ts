import * as p from "@clack/prompts";
import { type ActionErrors } from "@monorepo/base/errors.js";
import {
	catchErrorTags,
	handleErrors,
	printAnyErrors,
} from "@monorepo/cli/handle-errors.js";
import { actionIntro } from "@monorepo/cli/intro.js";
import {
	cliActionFailureOutro,
	cliActionSuccessOutro,
} from "@monorepo/cli/outros.js";
import {
	dbClientsLayer,
	type DbClients,
} from "@monorepo/services/db-clients.js";
import type { Migrator } from "@monorepo/services/migrator.js";
import { phasedMigratorLayer } from "@monorepo/services/phased-migrator.js";
import type { ProgramContext } from "@monorepo/services/program-context.js";
import {
	AppEnvironment,
	getEnvironment,
	importSchemaEnvironment,
	type AppEnv,
} from "@monorepo/state/app-environment.js";
import { Effect, Layer } from "effect";
import type { Scope } from "effect/Scope";
import color from "picocolors";
import { exit } from "process";

export async function cliAction(
	name: string,
	options: {
		readonly databaseId: string;
		readonly envFile?: string;
	},
	tasks: Effect.Effect<unknown, ActionErrors, ProgramContext>[],
) {
	actionIntro(name);

	await Effect.runPromise(
		programWithContext(actionWithLayers(tasks, layers), await loadEnv(options)),
	).then(cliActionSuccessOutro, cliActionFailureOutro);
}

export const layers = phasedMigratorLayer().pipe(
	Layer.provideMerge(dbClientsLayer()),
);

export async function cliActionWithoutContext(
	name: string,
	tasks: Effect.Effect<unknown, ActionErrors, AppEnvironment>[],
) {
	actionIntro(name);

	await Effect.runPromise(
		programWithContext(
			actionWithErrorHandling(tasks),
			await loadImportSchemaEnv(),
		),
	).then(cliActionSuccessOutro, cliActionFailureOutro);
}

export async function loadEnv(options: {
	readonly databaseId: string;
	readonly envFile?: string;
}) {
	return await Effect.runPromise(
		Effect.gen(function* () {
			return yield* getEnvironment(options.databaseId, options.envFile);
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

function programWithContext<A, E, R>(
	program: Effect.Effect<A, E, R>,
	env: AppEnv,
) {
	return Effect.scoped(AppEnvironment.provide(program, env));
}

export async function programWithContextAndServices<
	A,
	E,
	R,
	Rin extends Migrator | DbClients,
>(
	program: Effect.Effect<A, E, R>,
	env: AppEnv,
	layer: Layer.Layer<Rin, never, AppEnvironment | Scope>,
) {
	return Effect.scoped(
		AppEnvironment.provide(Effect.provide(program, layer), env),
	);
}

function actionWithErrorHandling<AC, AE>(
	tasks: Effect.Effect<unknown, AE, AC>[],
) {
	return Effect.all(tasks).pipe(handleErrors).pipe(printAnyErrors);
}

function actionWithLayers<AC, AE, LOut, LErr, LIn>(
	tasks: Effect.Effect<unknown, AE, AC>[],
	layers: Layer.Layer<LOut, LErr, LIn>,
) {
	return Effect.provide(actionWithErrorHandling(tasks), layers)
		.pipe(catchErrorTags)
		.pipe(printAnyErrors);
}
