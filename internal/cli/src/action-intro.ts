import { Effect, Layer, type Context } from "effect";
import {
	catchErrorTags,
	handleErrors,
	printAnyErrors,
} from "~cli/handle-errors.js";

export function actionWithErrorHandling<AC, AE>(
	tasks: Effect.Effect<unknown, AE, AC>[],
) {
	return Effect.all(tasks).pipe(handleErrors).pipe(printAnyErrors);
}

export function actionWithLayers<
	AC extends object,
	AE extends object,
	LOut extends object,
	LErr extends object,
	LIn extends object,
>(
	tasks: Effect.Effect<
		unknown,
		AE extends object ? AE : never,
		AC extends object ? AC : never
	>[],
	layers: Layer.Layer<
		LOut extends object ? LOut : never,
		LErr extends object ? LErr : never,
		LIn extends object ? LIn : never
	>,
) {
	return Effect.provide(actionWithErrorHandling(tasks), layers)
		.pipe(catchErrorTags)
		.pipe(printAnyErrors);
}

export function actionWithServiceEffect<
	LOut,
	LErr,
	LIn,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends Context.Tag<any, any>,
	E1,
	R1,
>(
	action: Effect.Effect<LOut, LErr, LIn>,
	tag: T,
	effect: Effect.Effect<Context.Tag.Service<T>, E1, R1>,
) {
	return Effect.scoped(Effect.provideServiceEffect(action, tag, effect));
}
