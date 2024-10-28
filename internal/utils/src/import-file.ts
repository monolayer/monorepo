import type { UnknownException } from "effect/Cause";
import { tryPromise } from "effect/Effect";
import { isErrnoException } from "./exception.js";

/**
 * Dynamically imports a module from the specified path.
 *
 * @param path path to file to import.
 * @typeParam T The expected type of the imported module. Default: `any`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const importFile = <T = any>(path: string) =>
	tryPromise({
		try: () => import(path) as Promise<T>,
		catch: (e) => (isErrnoException(e) ? e : (e as UnknownException)),
	});
