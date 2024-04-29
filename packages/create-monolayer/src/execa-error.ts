import type { ExecaReturnBase, StdoutStderrAll } from "execa";

export function isExecaError(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	error: any,
): error is ExecaReturnBase<StdoutStderrAll> {
	return (
		error.escapedCommand !== undefined &&
		error.command !== undefined &&
		error.exitCode !== undefined &&
		error.failed === true
	);
}
