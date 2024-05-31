import * as p from "@clack/prompts";
import { Effect, Layer, Ref } from "effect";
import type { Cause } from "effect/Cause";
import color from "picocolors";
import { exit } from "process";
import { phasedMigratorLayer } from "~/migrations/phased-migrator.js";
import {
	AppEnvironment,
	getEnvironment,
	importSchemaEnvironment,
	type AppEnv,
} from "~/state/app-environment.js";
import type { ProgramContext } from "../program-context.js";
import { dbClientsLayer } from "../services/db-clients.js";
import { cancelOperation } from "./cancel-operation.js";
import { ActionErrors, PromptCancelError, formatErrorStack } from "./errors.js";

export const promptCancelError = Effect.fail(new PromptCancelError());

export async function cliAction(
	name: string,
	options: { readonly connection: string; readonly name?: string },
	tasks: Effect.Effect<unknown, ActionErrors, ProgramContext>[],
) {
	p.intro(name);

	const layers = phasedMigratorLayer().pipe(
		Layer.provideMerge(dbClientsLayer()),
	);

	const appEnv = await loadEnv(options.connection, options.name ?? "default");

	const action = Effect.provide(
		Effect.all(tasks).pipe(
			Effect.catchTags({
				ActionError: (error) =>
					Effect.gen(function* () {
						p.log.error(`${color.red(error.name)}: ${error.message}`);
						p.outro(`${color.red("Failed")}`);
						yield* Effect.fail(exit(1));
					}),
				ExitWithSuccess: () => Effect.succeed(1),
				PromptCancelError: () => cancelOperation(),
			}),
		),
		layers,
	)
		.pipe(catchErrorTags)
		.pipe(printAnyErrors);

	await Effect.runPromise(
		Effect.scoped(
			Effect.provideServiceEffect(action, AppEnvironment, Ref.make(appEnv)),
		),
	).then(cliActionSuccessOutro, cliActionFailureOutro);
}

export async function cliActionWithoutContext(
	name: string,
	tasks: Effect.Effect<unknown, ActionErrors, AppEnvironment>[],
) {
	p.intro(name);

	const importAppEnv = await loadImportSchemaEnv();
	const action = Effect.all(tasks)
		.pipe(
			Effect.catchTags({
				ActionError: (error) =>
					Effect.gen(function* () {
						p.log.error(`${color.red(error.message)}: ${error.message}`);
						p.outro(`${color.red("Failed")}`);
						yield* Effect.fail("exit");
					}),
				ExitWithSuccess: () => Effect.succeed(1),
				PromptCancelError: () => cancelOperation(),
			}),
		)
		.pipe(printAnyErrors);

	await Effect.runPromise(
		Effect.provideServiceEffect(action, AppEnvironment, Ref.make(importAppEnv)),
	).then(cliActionSuccessOutro, cliActionFailureOutro);
}

const catchErrorTags = Effect.catchTags({
	ExitWithSuccess: () => Effect.succeed(1),
	PromptCancelError: () => cancelOperation(),
});

const printAnyErrors = Effect.tapErrorCause(printCause);

const cliActionSuccessOutro = () => {
	p.outro(`${color.green("Done")}`);
	exit(0);
};

const cliActionFailureOutro = () => {
	p.outro(`${color.red("Failed")}`);
	exit(1);
};

export async function loadEnv(environment: string, connection: string) {
	return await Effect.runPromise(
		Effect.gen(function* () {
			return yield* getEnvironment(environment, connection);
		}).pipe(Effect.tapErrorCause(printCause)),
	).then(envLoadSuccess, envLoadFailure);
}

export async function loadImportSchemaEnv() {
	return await Effect.runPromise(
		Effect.gen(function* () {
			return yield* importSchemaEnvironment;
		}).pipe(Effect.tapErrorCause(printCause)),
	).then(envLoadSuccess, envLoadFailure);
}

const envLoadSuccess = (result: AppEnv) => result;

const envLoadFailure = () => {
	p.outro(`${color.red("Failed")}`);
	exit(1);
};

export function printCause(cause: Cause<unknown>) {
	const error =
		cause._tag === "Die" && cause.defect instanceof Error
			? cause.defect
			: cause._tag === "Fail" && cause.error instanceof Error
				? cause.error
				: undefined;
	if (error !== undefined) {
		p.log.error(`${color.red(error.name)} ${error.message}`);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const err = error as any;
		if (err.error !== undefined && err.error instanceof Error) {
			p.log.message(formatErrorStack(err.error.stack));
		} else {
			if (error.stack !== undefined) {
				p.log.message(formatErrorStack(error.stack));
			} else {
				p.log.message(JSON.stringify(error, null, 2));
			}
		}
	} else {
		p.log.error(color.red("Error"));
		p.log.message(JSON.stringify(cause, null, 2));
	}
	return Effect.void;
}
