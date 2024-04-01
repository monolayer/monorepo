import { CommanderError } from "commander";
import { ExecaReturnBase, SyncOptions, execa } from "execa";
import type { Writable } from "stream";

export enum ActionStatus {
	KyselyInstallationNotInstalled = "KyselyInstallationNotInstalled",
	KyselyInstallationInstalled = "KyselyInstallationInstalled",
	InstallKyselySuccess = "InstallKyselySuccess",
	Error = "Error",
	Success = "Success",
	InitKineticFolderSuccess = "InitKineticFolderSuccess",
	pgInstallationNotInstalled = "pgInstallationNotInstalled",
	pgInstallationInstalled = "pgInstallationInstalled",
	InstallPgSuccess = "InstallPgSuccess",
	pgTypesInstallationNotInstalled = "pgTypesInstallationNotInstalled",
	pgTypesInstallationInstalled = "pgTypesInstallationInstalled",
	InstallPgTypesSuccess = "InstallPgTypesSuccess",
}

export type CommandSuccess = {
	status: ActionStatus;
	error?: undefined;
};

export type CommandError = {
	status: ActionStatus.Error;
	error: ExecaReturnBase<string | Buffer | undefined> | Error | unknown;
};

export type CommandResult = CommandSuccess | CommandError;

type ExecaCommandSuccess = {
	success: true;
	value: ExecaReturnBase<string | Buffer | undefined>;
	error?: undefined;
};

type ExecaCommandFailure = {
	success: false;
	error: ExecaReturnBase<string | Buffer | undefined> | Error | unknown;
	value?: undefined;
};

export type ExecaCommandResult = ExecaCommandSuccess | ExecaCommandFailure;

export async function runCommand(
	command: string,
	args: readonly string[] = [],
	options?: SyncOptions,
): Promise<ExecaCommandResult> {
	try {
		const result = execa(command, args, options);
		return {
			success: true,
			value: await result,
		};
	} catch (error) {
		if (isExecaError(error)) return { success: false, error: error };
		if (isError(error)) return { success: false, error: error };
		return { success: false, error: error };
	}
}

export async function runAndPipeCommand(
	command: string,
	args: readonly string[] = [],
	writable: Writable,
	options?: SyncOptions,
): Promise<ExecaCommandResult> {
	try {
		const cmd = execa(command, args, options);
		if (cmd.pipeStdout === undefined) {
			throw new Error("pipeStdout is undefined");
		}
		return {
			success: true,
			value: await cmd.pipeStdout(writable),
		};
	} catch (error) {
		if (isExecaError(error)) return { success: false, error: error };
		if (isError(error)) return { success: false, error: error };
		return { success: false, error: error };
	}
}

export function isCommanderError(error: unknown): error is CommanderError {
	return error instanceof CommanderError;
}

export function isExecaError(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	error: any,
): error is ExecaReturnBase<string | Buffer | undefined> {
	return (
		error.escapedCommand !== undefined &&
		error.command !== undefined &&
		error.exitCode !== undefined &&
		error.failed === true
	);
}

export function isError(error: unknown): error is Error {
	return error instanceof Error;
}

export type OperationSuccess<T> = {
	status: ActionStatus.Success;
	result: T;
};

export type OperationAnyError = {
	status: ActionStatus.Error;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	error: any;
};

type OperationError = {
	status: ActionStatus.Error;
	error: Error;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function throwableOperation<T extends (...args: any) => any>(
	operation: () => ReturnType<T>,
): Promise<
	OperationSuccess<Awaited<ReturnType<T>>> | OperationAnyError | OperationError
> {
	try {
		const result = await operation();
		return <OperationSuccess<Awaited<ReturnType<T>>>>{
			status: ActionStatus.Success,
			result: result,
		};
	} catch (error) {
		if (!(error instanceof Error)) {
			return {
				status: ActionStatus.Error,
				error: error,
			};
		}
		return {
			status: ActionStatus.Error,
			error: error,
		};
	}
}