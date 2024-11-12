import { type ActionErrors } from "@monorepo/cli/errors.js";
import {
	catchErrorTags,
	handleErrors,
	handleErrorsNew,
	printAnyErrors,
	printCauseNew,
} from "@monorepo/cli/handle-errors.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import type { ProgramContext } from "@monorepo/services/program-context.js";
import {
	AppEnvironment,
	getEnvironment,
	importSchemaEnvironment,
	type AppEnv,
} from "@monorepo/state/app-environment.js";
import { Effect, Layer } from "effect";
import color from "picocolors";
import { exit } from "process";
import { actionInfo } from "./action-info.js";

export async function cliAction(
	name: string,
	options: {
		readonly databaseId: string;
		readonly envFile?: string;
	},
	tasks: Effect.Effect<unknown, ActionErrors, ProgramContext>[],
) {
	console.log(name);

	const tasksWithLayers = actionWithLayers(tasks, layers);
	const program = programWithContext(tasksWithLayers, await loadEnv(options));
	await Effect.runPromise(program).then(
		() => {
			exit(0);
		},
		() => {
			exit(1);
		},
	);
}

export async function headlessCliAction<A>(
	options: {
		readonly databaseId: string;
		readonly envFile?: string;
		readonly verbose?: boolean;
	},
	tasks: Effect.Effect<A, ActionErrors, ProgramContext>[],
) {
	await Effect.runPromise(
		await Effect.runPromise(
			programWithContext(
				Effect.provide(Effect.all([actionInfo, ...tasks]), layers),
				await loadEnv(options),
			)
				.pipe(handleErrorsNew)
				.pipe(Effect.tapErrorCause(printCauseNew)),
		).then(
			() => exit(0),
			() => exit(1),
		),
	);
}

export const layers = DbClients.LiveLayer;

export async function cliActionWithoutContext(
	name: string,
	tasks: Effect.Effect<unknown, ActionErrors, AppEnvironment>[],
) {
	console.log(name);

	await Effect.runPromise(
		programWithContext(
			actionWithErrorHandling(tasks),
			await loadImportSchemaEnv(),
		),
	).then(
		() => {
			exit(0);
		},
		() => {
			exit(1);
		},
	);
}

export async function loadEnv(options: {
	readonly databaseId: string;
	readonly envFile?: string;
	readonly verbose?: boolean;
}) {
	return await Effect.runPromise(
		Effect.gen(function* () {
			const appEnv = yield* getEnvironment(options.databaseId, options.envFile);
			appEnv.debug = options.verbose;
			return appEnv;
		}),
	).then(envLoadSuccess, envLoadFailure);
}

export async function loadImportSchemaEnv() {
	return await Effect.runPromise(
		Effect.gen(function* () {
			return yield* importSchemaEnvironment;
		}),
	).then(envLoadSuccess, envLoadFailure);
}

const envLoadSuccess = (result: AppEnv) => result;

const envLoadFailure = (error: unknown) => {
	console.dir(error);
	console.log(color.red("Error"));
	console.log(JSON.stringify(error, null, 2));
	console.log(`${color.red("Failed")}`);
	exit(1);
};

export function programWithContext<A, E, R>(
	program: Effect.Effect<A, E, R>,
	env: AppEnv,
) {
	return Effect.scoped(AppEnvironment.provide(program, env));
}

export function programWithContextAndServices<A, E, R, Rin, LE, LR>(
	program: Effect.Effect<A, E, R>,
	env: AppEnv,
	layer: Layer.Layer<Rin, LE, LR>,
) {
	return Effect.scoped(
		AppEnvironment.provide(Effect.provide(program, layer), env),
	);
}

function actionWithErrorHandling<AI, AC, AE>(
	tasks: Effect.Effect<AI, AE, AC>[],
) {
	return Effect.all(tasks).pipe(handleErrors).pipe(printAnyErrors);
}

export function actionWithLayers<AI, AC, AE, LOut, LErr, LIn>(
	tasks: Effect.Effect<AI, AE, AC>[],
	layers: Layer.Layer<LOut, LErr, LIn>,
) {
	return Effect.provide(actionWithErrorHandling(tasks), layers).pipe(
		catchErrorTags,
	);
}
