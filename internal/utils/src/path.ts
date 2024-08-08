import { Effect } from "effect";
import { stat } from "fs/promises";

export function pathExists(filePath: string) {
	return Effect.tryPromise(async () => {
		try {
			await stat(filePath);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error.code === "ENOENT") {
				return false;
			}
			throw error;
		}
		return true;
	});
}
