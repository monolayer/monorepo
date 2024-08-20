import type { UnknownException } from "effect/Cause";
import { tryPromise, type Effect } from "effect/Effect";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const importFile = <T = any>(
	path: string,
): Effect<T, UnknownException, never> => tryPromise(() => import(path));
