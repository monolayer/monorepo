import { Effect } from "effect";
import { execa, type SyncOptions } from "execa";
import type { Writable } from "stream";

export function pipeCommandStdoutToWritable(
	command: string,
	args: readonly string[] = [],
	writable: Writable,
	options?: SyncOptions,
) {
	return Effect.tryPromise(async () => {
		const cmd = execa(command, args, options);
		if (cmd.pipeStdout === undefined) {
			throw new Error("pipeStdout is undefined");
		} else {
			const { stdout } = await cmd.pipeStdout(writable);
			return stdout;
		}
	});
}
