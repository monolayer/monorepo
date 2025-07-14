import path from "path";
import { RouteMatcher } from "./matcher.js";
import type { RouteParams } from "./types.js";

// Recursive validator for dynamic segments
export type IsValidSegment<S extends string> =
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	S extends `${infer _Start}[${infer Param}]${infer After}`
		? After extends `/${string}` | "" // Must end or be followed by `/`
			? IsValidSegment<After> // Recurse
			: false // ❌ Invalid characters after [param]
		: true; // ✅ No more dynamic segments

// Final validator type
export type ValidateRouteFormat<T extends string> =
	IsValidSegment<T> extends true ? T : never;

// Combined with previous duplicate check
export type ExtractRouteParamsTuple<
	T extends string,
	Acc extends string[] = [],
> = T extends `${string}[${infer Param}]${infer Rest}`
	? ExtractRouteParamsTuple<Rest, [...Acc, Param]>
	: Acc;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HasDuplicates<T extends readonly any[]> = T extends [
	infer F,
	...infer R,
]
	? F extends R[number]
		? true
		: HasDuplicates<R>
	: false;

export type ValidateUniqueParams<T extends string> =
	HasDuplicates<ExtractRouteParamsTuple<T>> extends true ? never : T;

// Final route validator
export type ValidateRoute<T extends string> =
	ValidateRouteFormat<T> extends never
		? never
		: ValidateUniqueParams<T> extends never
			? never
			: T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ValidateRoutes<T extends Record<string, any>> = {
	[K in keyof T]: ValidateRoute<K & string> extends never ? never : T[K];
};

export type DrainOuterGeneric<T> = [T] extends [unknown] ? T : never;

export type Simplify<T> = DrainOuterGeneric<
	{
		[K in keyof T]: T[K];
	} & {}
>;

/**
 * Creates a channel router with channels for broadcast.
 *
 * This function takes a session handler and a configuration object for routes. Each route
 * is mapped to a channel and an optional authorization handler. The route paths can
 * include dynamic segments, like `/users/[id]`, which are parsed and passed to the
 * authorization logic.
 *
 * @template T - A record mapping route strings to their channel types.
 * @template S - The type of the session object, returned by the `session` function.
 *
 * @param session A function that resolves to a session object. This object is available
 *   within the authorization handlers. It receives an object with `cookies` as an argument.
 * @param routes An object where keys are route strings and values are objects defining
 *   the channel and its authorization logic.
 *   - `auth`: An optional function to authorize "PUBLISH" or "SUBSCRIBE" operations.
 *     It receives the operation type, route parameters, and the session object.
 *   - `channel`: The channel instance for the route.
 *
 * @returns An object containing the configured routes, an internal authorization function (`authFn`),
 *   and the session handler.
 *
 * @example
 * ```ts
 * import { channel, channelRouter } from "@monolayer/sdk";
 *
 * const router = channelRouter(
 *   async () => ({ userId: 1 }),
 *   {
 *     "/todos": {
 *       channel: channel<{ message: string }>(),
 *       auth: async (ctx) => {
 *         console.log("User trying to access todos:", ctx.session.userId);
 *         return true; // Allow access
 *       },
 *     },
 *     "/users/[id]": {
 *       channel: channel<{ salute: string }>(),
 *       auth: async (ctx) => {
 *         // Only allow users to access their own channel
 *         return ctx.session.userId === Number(ctx.params.id);
 *       },
 *     },
 *   }
 * );
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function channelRouter<T extends Record<string, any>, S>(
	session: (opts: { cookies: Record<string, string> }) => Promise<S>,
	routes: {
		[route in keyof T]: ValidateRoute<route & string> extends never
			? never
			: {
					auth?: (ctx: {
						operation: "PUBLISH" | "SUBSCRIBE";
						params: route extends string ? Simplify<RouteParams<route>> : never;
						session: S;
					}) => Promise<boolean>;
					channel: T[route];
				};
	},
) {
	const authFn = async (
		route: string,
		operation: "PUBLISH" | "SUBSCRIBE",
		session: S,
	) => {
		const auth: Record<
			string,
			| ((ctx: {
					operation: "PUBLISH" | "SUBSCRIBE";
					session: S;
					params: Record<string, string>;
			  }) => Promise<boolean>)
			| undefined
		> = {};
		for (const routeName of Object.keys(routes)) {
			if (routes[routeName]) {
				auth[`${path.join("default", routeName)}`] = routes[routeName].auth;
			}
		}
		const matcher = new RouteMatcher(
			Object.keys(routes).map((r) => path.join("default", r)),
		);
		const match = matcher.match(route);
		if (match) {
			const routeAuth = auth[route];
			if (routeAuth === undefined) return true;
			return await routeAuth({
				session: session as unknown as S,
				params: match.params,
				operation,
			});
		} else {
			return true;
		}
	};
	return { routes, authFn, session };
}
